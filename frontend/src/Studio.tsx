import { useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  MapPin,
  Plus,
  Radio,
  Ticket,
  Users,
} from "lucide-react";
import { api } from "./api";
import type { EventStatus, ShowEvent, Venue } from "./types";
import {
  date,
  errorMessage,
  money,
  statusLabel,
  transitionReason,
  transitions,
} from "./utils";
import { Empty, FormError, Status } from "./ui";

export default function Studio({
  events,
  venues,
  userId,
  onCreateEvent,
  onCreateVenue,
  onEditDates,
  onRefresh,
  notify,
}: {
  events: ShowEvent[];
  venues: Venue[];
  userId: string;
  onCreateEvent: () => void;
  onCreateVenue: () => void;
  onEditDates: (event: ShowEvent) => void;
  onRefresh: () => Promise<void>;
  notify: (message: string) => void;
}) {
  const mine = events.filter((e) => e.organizerId === userId);
  const myVenues = venues.filter((v) => v.ownerId === userId);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [cancelId, setCancelId] = useState("");
  async function move(event: ShowEvent, status: EventStatus) {
    setBusy(event.id);
    setError("");
    try {
      await api(`/events/${event.id}/status`, "PATCH", { status });
      setCancelId("");
      await onRefresh();
      notify(`“${event.title}” is now ${statusLabel(status).toLowerCase()}.`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy("");
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow accent">BEHIND THE GOOD TIMES</span>
          <h1>
            Organizer studio<span className="accent">.</span>
          </h1>
          <p>Big ideas. Full rooms. It starts with you.</p>
        </div>
        <div className="heading-actions">
          <button className="button secondary" onClick={onCreateVenue}>
            <MapPin size={17} />
            Add venue
          </button>
          <button
            className="button primary"
            onClick={onCreateEvent}
            disabled={venues.length === 0}
          >
            <Plus size={18} />
            Create event
          </button>
        </div>
      </div>
      <div className="stat-grid">
        <div>
          <span>
            <CalendarDays size={18} />
            Your events
          </span>
          <strong>{mine.length.toString().padStart(2, "0")}</strong>
        </div>
        <div>
          <span>
            <Radio size={18} />
            On sale now
          </span>
          <strong>
            {mine
              .filter((e) => e.status === "ON_SALE")
              .length.toString()
              .padStart(2, "0")}
          </strong>
        </div>
        <div>
          <span>
            <Ticket size={18} />
            Tickets reserved
          </span>
          <strong>
            {mine.reduce((sum, e) => sum + e.capacity - e.available, 0)}
          </strong>
        </div>
        <div>
          <span>
            <MapPin size={18} />
            Your venues
          </span>
          <strong>{myVenues.length.toString().padStart(2, "0")}</strong>
        </div>
      </div>
      <div className="section-heading">
        <h2>
          Your events <span className="count">{mine.length}</span>
        </h2>
        <span className="muted small">From first idea to final encore.</span>
      </div>
      <FormError error={error} />
      {mine.length === 0 ? (
        <Empty
          title="The next great event could be yours."
          action={
            <button
              className="button primary"
              onClick={venues.length ? onCreateEvent : onCreateVenue}
            >
              {venues.length
                ? "Create your first event"
                : "Add your first venue"}
              <ArrowRight size={17} />
            </button>
          }
        >
          Start with a venue and a draft. We’ll help you take it from there.
        </Empty>
      ) : (
        <div className="studio-list">
          {mine.map((event) => (
            <article className="studio-event" key={event.id}>
              <div className="studio-event-top">
                <div className="date-tile">
                  <span>
                    {new Date(event.startDate).toLocaleString("en-US", {
                      month: "short",
                    })}
                  </span>
                  <strong>{new Date(event.startDate).getDate()}</strong>
                </div>
                <div className="studio-event-title">
                  <Status value={event.status} />
                  <h3>{event.title}</h3>
                  <p>
                    {venues.find((v) => v.id === event.venueId)?.name ||
                      "Venue"}{" "}
                    <span>·</span> {date(event.startDate)}
                  </p>
                </div>
                <div className="studio-inventory">
                  <strong>
                    {event.available} <small>/ {event.capacity}</small>
                  </strong>
                  <span>tickets available · {money(event.priceCents)}</span>
                </div>
              </div>
              <div className="studio-event-actions">
                <span className="small muted">
                  <Users size={15} /> {event.capacity - event.available}{" "}
                  reserved
                </span>
                <div className="transition-actions">
                  {!["COMPLETED", "CANCELLED"].includes(event.status) && (
                    <button
                      className="text-button"
                      disabled={!!busy}
                      onClick={() => onEditDates(event)}
                    >
                      Edit dates
                    </button>
                  )}
                  {transitions[event.status].map((next) => {
                    const reason = transitionReason(event, next);
                    return (
                      <span key={next} className="transition-option">
                        <button
                          className={`button compact ${next === "CANCELLED" ? "danger-outline" : "secondary"}`}
                          disabled={!!busy || !!reason}
                          title={reason || undefined}
                          onClick={() =>
                            next === "CANCELLED"
                              ? setCancelId(event.id)
                              : void move(event, next)
                          }
                        >
                          {busy === event.id
                            ? "Updating…"
                            : next === "ON_SALE"
                              ? "Open sales"
                              : next === "PUBLISHED"
                                ? "Publish event"
                                : next === "SOLD_OUT"
                                  ? "Mark sold out"
                                  : next === "COMPLETED"
                                    ? "Complete event"
                                    : "Cancel event"}
                          {!reason && next !== "CANCELLED" && (
                            <ChevronRight size={14} />
                          )}
                        </button>
                        {reason && <small>{reason}</small>}
                      </span>
                    );
                  })}
                </div>
              </div>
              {cancelId === event.id && (
                <div className="confirmation" role="alert">
                  <div>
                    <strong>Cancel this event?</strong>
                    <p>
                      This is a final status. Existing orders are not
                      automatically refunded or cancelled.
                    </p>
                  </div>
                  <button
                    className="button secondary compact"
                    disabled={!!busy}
                    onClick={() => setCancelId("")}
                  >
                    Keep event
                  </button>
                  <button
                    className="button danger compact"
                    disabled={!!busy}
                    onClick={() => void move(event, "CANCELLED")}
                  >
                    Confirm cancellation
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
      <div className="section-heading venue-section">
        <h2>
          Your spaces <span className="count">{myVenues.length}</span>
        </h2>
        <button className="text-button" onClick={onCreateVenue}>
          Add a venue <Plus size={16} />
        </button>
      </div>
      {myVenues.length ? (
        <div className="venue-grid">
          {myVenues.map((v) => (
            <article className="venue-card" key={v.id}>
              <div className="venue-icon">
                <MapPin size={23} />
              </div>
              <h3>{v.name}</h3>
              <p>{v.address}</p>
              <span>
                <Users size={14} /> {v.capacity} people
              </span>
            </article>
          ))}
        </div>
      ) : (
        <p className="muted">
          Your venues will appear here. You can also use existing venues when
          creating an event.
        </p>
      )}
    </>
  );
}
