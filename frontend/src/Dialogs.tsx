import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  Ticket,
} from "lucide-react";
import { api, storeSession } from "./api";
import type { Order, Session, ShowEvent, Venue } from "./types";
import {
  date,
  errorMessage,
  money,
  statusLabel,
  time,
  toLocalInput,
} from "./utils";
import { Dialog, FormError, Poster, Status } from "./ui";

export function AuthDialog({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (session: Session) => void;
}) {
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const fields = new FormData(event.currentTarget);
    const email = String(fields.get("email")).trim();
    try {
      const result = await api<{ access_token: string }>(
        `/auth/${register ? "register" : "login"}`,
        "POST",
        { email, password: fields.get("password") },
      );
      onSuccess(storeSession(result.access_token, email));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      title={
        register
          ? "Your next great night starts here."
          : "Good to see you again."
      }
      onClose={onClose}
    >
      <p className="dialog-intro">
        {register
          ? "Create an account to collect experiences, not things."
          : "Sign in to find your tickets and make new plans."}
      </p>
      <form onSubmit={submit} className="form-stack">
        <label>
          Email address
          <input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            maxLength={254}
            required
          />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete={register ? "new-password" : "current-password"}
            placeholder="At least 8 characters"
            minLength={8}
            required
          />
        </label>
        <FormError error={error} />
        <button className="button primary full" disabled={busy}>
          {busy ? "One moment…" : register ? "Create account" : "Sign in"}
          <ArrowRight size={18} />
        </button>
      </form>
      <p className="auth-switch">
        {register ? "Already part of the crowd?" : "New around here?"}{" "}
        <button
          className="text-button"
          onClick={() => {
            setRegister(!register);
            setError("");
          }}
        >
          {register ? "Sign in" : "Create an account"}
        </button>
      </p>
    </Dialog>
  );
}

export function EventDialog({
  event,
  venue,
  session,
  onClose,
  onSignIn,
  onBooked,
}: {
  event: ShowEvent;
  venue?: Venue;
  session: Session | null;
  onClose: () => void;
  onSignIn: () => void;
  onBooked: () => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const available =
    event.status === "ON_SALE" &&
    event.available > 0 &&
    new Date(event.startDate).getTime() > Date.now();
  const max = Math.min(10, event.available);
  async function book() {
    if (!session) {
      onSignIn();
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api<Order>("/orders", "POST", { eventId: event.id, quantity });
      onBooked();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog title={event.title} onClose={onClose} wide>
      <Poster title={event.title} large />
      <div className="event-detail-grid">
        <div>
          <Status value={event.status} />
          <h3 className="detail-heading">A plan worth making.</h3>
          <p className="description">
            {event.description ||
              "Make time for something different. Join the crowd and experience it in person."}
          </p>
          <div className="detail-line">
            <CalendarDays size={19} />
            <span>
              {date(event.startDate)}
              <small>
                {time(event.startDate)} – {date(event.endDate)},{" "}
                {time(event.endDate)}
              </small>
            </span>
          </div>
          <div className="detail-line">
            <MapPin size={19} />
            <span>
              {venue?.name || "Venue details coming soon"}
              <small>{venue?.address}</small>
            </span>
          </div>
          <p className="small muted">
            <Clock3 size={14} /> Times shown in{" "}
            {Intl.DateTimeFormat()
              .resolvedOptions()
              .timeZone.replaceAll("_", " ")}
            .
          </p>
        </div>
        <aside className="booking-panel">
          <span className="eyebrow">YOUR NEXT EXPERIENCE</span>
          <h3>
            {event.priceCents === 0
              ? "Free admission"
              : money(event.priceCents)}
            <small> / ticket</small>
          </h3>
          {available ? (
            <>
              <p className="muted small">{event.available} tickets available</p>
              <div className="quantity">
                <span>Tickets</span>
                <div>
                  <button
                    className="icon-button"
                    aria-label="Fewer tickets"
                    disabled={quantity <= 1 || busy}
                    onClick={() => setQuantity(quantity - 1)}
                  >
                    <Minus size={16} />
                  </button>
                  <output aria-label="Ticket quantity">{quantity}</output>
                  <button
                    className="icon-button"
                    aria-label="More tickets"
                    disabled={quantity >= max || busy}
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              <div className="booking-total">
                <span>Total</span>
                <strong>{money(quantity * event.priceCents)}</strong>
              </div>
              <FormError error={error} />
              <button
                className="button primary full"
                disabled={busy}
                onClick={book}
              >
                {busy
                  ? "Reserving…"
                  : session
                    ? "Reserve tickets"
                    : "Sign in to reserve"}
                <Ticket size={18} />
              </button>
            </>
          ) : (
            <p className="availability-message">
              {new Date(event.startDate).getTime() <= Date.now()
                ? "This event has already started."
                : event.status === "PUBLISHED"
                  ? "Tickets are coming soon. Check back for the next release."
                  : `Tickets are unavailable. ${statusLabel(event.status)}.`}
            </p>
          )}
          <p className="demo-note">
            <ShieldCheck size={15} /> Demo checkout. No real charges.
          </p>
        </aside>
      </div>
    </Dialog>
  );
}

export function VenueDialog({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(event.currentTarget);
    try {
      await api<Venue>("/venues", "POST", {
        name: String(f.get("name")).trim(),
        address: String(f.get("address")).trim(),
        capacity: Number(f.get("capacity")),
      });
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog title="Every great event needs a place." onClose={onClose}>
      <p className="dialog-intro">Add a venue, then bring it to life.</p>
      <form className="form-stack" onSubmit={submit}>
        <label>
          Venue name
          <input
            name="name"
            required
            maxLength={150}
            placeholder="The name above the door"
          />
        </label>
        <label>
          Address
          <input
            name="address"
            required
            maxLength={300}
            placeholder="Street, city, and postcode"
          />
        </label>
        <label>
          Capacity
          <input
            name="capacity"
            type="number"
            min={1}
            max={2147483647}
            step={1}
            defaultValue={100}
            required
          />
        </label>
        <FormError error={error} />
        <button className="button primary full" disabled={busy}>
          {busy ? "Adding venue…" : "Add venue"}
          <Plus size={18} />
        </button>
      </form>
    </Dialog>
  );
}

export function EventFormDialog({
  event,
  venues,
  onClose,
  onSaved,
}: {
  event?: ShowEvent;
  venues: Venue[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [venueId, setVenueId] = useState(venues[0]?.id || "");
  const venue = venues.find((v) => v.id === venueId);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    const start = new Date(String(f.get("startDate"))),
      end = new Date(String(f.get("endDate")));
    if (start.getTime() <= Date.now() || end <= start) {
      setError("Choose a future start, with an end after the start.");
      setBusy(false);
      return;
    }
    const dates = {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
    try {
      await api<ShowEvent>(
        event ? `/events/${event.id}/dates` : "/events",
        event ? "PATCH" : "POST",
        event
          ? dates
          : {
              ...dates,
              title: String(f.get("title")).trim(),
              description: String(f.get("description")).trim(),
              venueId,
              capacity: Number(f.get("capacity")),
              priceCents: Math.round(Number(f.get("price")) * 100),
            },
      );
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      title={event ? "Make time for a new date." : "Bring your idea to life."}
      onClose={onClose}
    >
      <p className="dialog-intro">
        {event
          ? `Update the schedule for ${event.title}.`
          : "Start with a draft. Publish when you’re ready."}
      </p>
      <form className="form-stack" onSubmit={submit}>
        {!event && (
          <>
            <label>
              Event title
              <input
                name="title"
                required
                maxLength={180}
                placeholder="Give them something to look forward to"
              />
            </label>
            <label>
              Description
              <textarea
                name="description"
                rows={3}
                maxLength={4000}
                placeholder="Set the scene. What makes this one special?"
              />
            </label>
            <label>
              Venue
              <select
                value={venueId}
                onChange={(e) => setVenueId(e.target.value)}
                required
              >
                <option value="" disabled>
                  Choose a venue
                </option>
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} · {v.capacity} capacity
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
        <div className="form-row">
          <label>
            Starts
            <input
              name="startDate"
              type="datetime-local"
              required
              defaultValue={event ? toLocalInput(event.startDate) : undefined}
            />
          </label>
          <label>
            Ends
            <input
              name="endDate"
              type="datetime-local"
              required
              defaultValue={event ? toLocalInput(event.endDate) : undefined}
            />
          </label>
        </div>
        <p className="field-hint">
          Your local time ·{" "}
          {Intl.DateTimeFormat()
            .resolvedOptions()
            .timeZone.replaceAll("_", " ")}
        </p>
        {!event && (
          <div className="form-row">
            <label>
              Ticket capacity
              <input
                name="capacity"
                type="number"
                min={1}
                max={venue?.capacity || 2147483647}
                step={1}
                required
                defaultValue={1}
              />
            </label>
            <label>
              Price per ticket (USD)
              <input
                name="price"
                type="number"
                min={0}
                max={1000000}
                step="0.01"
                defaultValue={0}
                required
              />
            </label>
          </div>
        )}
        <FormError error={error} />
        <button
          className="button primary full"
          disabled={busy || (!event && !venueId)}
        >
          {busy ? "Saving…" : event ? "Save dates" : "Create draft"}
          <ArrowRight size={18} />
        </button>
      </form>
    </Dialog>
  );
}
