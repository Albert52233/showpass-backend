import { useState } from "react";
import { ArrowRight, CalendarDays, MapPin, Ticket } from "lucide-react";
import { api } from "./api";
import type { Order, ShowEvent, Venue } from "./types";
import { date, errorMessage, money, time } from "./utils";
import { Empty, FormError, Status } from "./ui";

export default function Tickets({
  orders,
  events,
  venues,
  onDiscover,
  onRefresh,
  notify,
}: {
  orders: Order[];
  events: ShowEvent[];
  venues: Venue[];
  onDiscover: () => void;
  onRefresh: () => Promise<void>;
  notify: (message: string) => void;
}) {
  const [filter, setFilter] = useState("ALL");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  async function update(order: Order, action: "mock-pay" | "cancel") {
    setBusy(order.id);
    setError("");
    try {
      await api(`/orders/${order.id}/${action}`, "POST", {});
      await onRefresh();
      notify(
        action === "mock-pay"
          ? "Demo payment confirmed. You’re on the list!"
          : "Reservation cancelled. Tickets returned to the event.",
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy("");
    }
  }
  const visible = orders
    .filter((o) => filter === "ALL" || o.status === filter)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow accent">LESS SCROLLING. MORE LIVING.</span>
          <h1>
            Your ticket to good times<span className="accent">.</span>
          </h1>
          <p>All your plans, in one happy place.</p>
        </div>
        <span className="wallet-icon">
          <Ticket size={40} />
        </span>
      </div>
      <div className="wallet-note">
        <Ticket size={19} />
        <p>
          This is a demo ticket wallet. Payment is simulated and no real money
          is charged.
        </p>
      </div>
      <div className="filter-tabs" aria-label="Filter orders">
        {[
          ["ALL", "All tickets"],
          ["PENDING", "Reserved"],
          ["PAID", "Confirmed"],
          ["CANCELLED", "Cancelled"],
        ].map(([value, label]) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
            className={filter === value ? "selected" : ""}
          >
            {label}
            <span>
              {
                orders.filter((o) => value === "ALL" || o.status === value)
                  .length
              }
            </span>
          </button>
        ))}
      </div>
      <FormError error={error} />
      {visible.length === 0 ? (
        <Empty
          title={
            filter === "ALL"
              ? "Your next story is waiting."
              : "No tickets in this collection yet."
          }
          action={
            <button className="button primary" onClick={onDiscover}>
              Find your next event
              <ArrowRight size={17} />
            </button>
          }
        >
          Discover something that gets you out of the group chat and into the
          crowd.
        </Empty>
      ) : (
        <div className="ticket-list">
          {visible.map((order) => {
            const event = events.find((e) => e.id === order.eventId);
            const venue = venues.find((v) => v.id === event?.venueId);
            return (
              <article
                key={order.id}
                className={`wallet-ticket ${order.status === "CANCELLED" ? "ticket-cancelled" : ""}`}
              >
                <div className="ticket-main">
                  <div className="ticket-top">
                    <span className="eyebrow">SHOWPASS / YOUR EXPERIENCE</span>
                    <Status value={order.status} />
                  </div>
                  <h2>{event?.title || "Event details unavailable"}</h2>
                  <p>
                    <CalendarDays size={15} />
                    {event
                      ? `${date(event.startDate)} · ${time(event.startDate)}`
                      : "Schedule unavailable"}
                  </p>
                  <p>
                    <MapPin size={15} />
                    {venue?.name || "Venue unavailable"}
                  </p>
                  {event &&
                    ["CANCELLED", "COMPLETED"].includes(event.status) && (
                      <p className="ticket-event-notice">
                        Event {event.status.toLowerCase()}. Contact the
                        organizer about your order.
                      </p>
                    )}
                  <span className="ticket-reference">
                    ORDER #{order.id.slice(-8).toUpperCase()} · {order.quantity}{" "}
                    {order.quantity === 1 ? "TICKET" : "TICKETS"}
                  </span>
                </div>
                <div className="ticket-stub">
                  <strong>{money(order.totalCents)}</strong>
                  <span>Total · USD</span>
                  {order.status === "PENDING" ? (
                    <>
                      <button
                        className="button primary compact"
                        disabled={!!busy}
                        onClick={() => void update(order, "mock-pay")}
                      >
                        {busy === order.id
                          ? "Updating…"
                          : "Confirm demo payment"}
                      </button>
                      <button
                        className="text-button subtle-danger"
                        disabled={!!busy}
                        onClick={() => void update(order, "cancel")}
                      >
                        Cancel reservation
                      </button>
                    </>
                  ) : (
                    <div className="barcode" aria-hidden="true" />
                  )}
                  <span className="small muted">
                    {order.status === "PAID"
                      ? "Demo payment complete"
                      : order.status === "CANCELLED"
                        ? "Reservation cancelled"
                        : "No payment collected"}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
