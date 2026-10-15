import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronDown,
  Compass,
  LogOut,
  MapPin,
  Search,
  Sparkles,
  Ticket,
  X,
} from "lucide-react";
import { api, clearSession, getSession } from "./api";
import {
  AuthDialog,
  EventDialog,
  EventFormDialog,
  VenueDialog,
} from "./Dialogs";
import Studio from "./Studio";
import Tickets from "./Tickets";
import type { Order, Page, Session, ShowEvent, Venue } from "./types";
import { date, errorMessage, money, time } from "./utils";
import { Burst, Empty, Poster, Status } from "./ui";

type Modal =
  | { kind: "auth"; returnEvent?: string }
  | { kind: "event"; id: string }
  | { kind: "create" }
  | { kind: "venue" }
  | { kind: "dates"; event: ShowEvent }
  | null;
const currentPage = (): Page =>
  ["tickets", "studio"].includes(location.hash.slice(1))
    ? (location.hash.slice(1) as Page)
    : "discover";

export default function App() {
  const [page, setPage] = useState<Page>(currentPage);
  const [session, setSession] = useState<Session | null>(getSession);
  const [events, setEvents] = useState<ShowEvent[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [modal, setModal] = useState<Modal>(null);
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [dates, setDates] = useState("ALL");
  const sequence = useRef(0);
  const refresh = useCallback(async () => {
    const version = ++sequence.current;
    try {
      const [e, v, o] = await Promise.all([
        api<ShowEvent[]>("/events"),
        api<Venue[]>("/venues"),
        session ? api<Order[]>("/orders") : Promise.resolve([] as Order[]),
      ]);
      if (version !== sequence.current) return;
      setEvents(e);
      setVenues(v);
      setOrders(o);
      setLoadError("");
    } catch (error) {
      if (version === sequence.current) setLoadError(errorMessage(error));
    } finally {
      if (version === sequence.current) setLoading(false);
    }
  }, [session]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    const handler = () => {
      if (["discover", "tickets", "studio"].includes(location.hash.slice(1))) {
        setPage(currentPage());
        window.scrollTo({ top: 0 });
      }
    };
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  useEffect(() => {
    document.title = `${page === "discover" ? "Go out. Feel something." : page === "tickets" ? "My tickets" : "Organizer studio"} — Showpass`;
  }, [page]);
  useEffect(() => {
    if (!session) return;
    const expire = () => {
      clearSession();
      setSession(null);
      setOrders([]);
      setModal({ kind: "auth" });
      setToast("Your session expired. Sign in to keep going.");
    };
    const timer = window.setTimeout(
      expire,
      Math.max(0, session.expiresAt - Date.now()),
    );
    window.addEventListener("showpass-session-expired", expire);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("showpass-session-expired", expire);
    };
  }, [session]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 7000);
    return () => clearTimeout(timer);
  }, [toast]);
  function navigate(next: Page) {
    location.hash = next;
  }
  function signOut() {
    clearSession();
    setSession(null);
    setOrders([]);
    setModal(null);
    setToast("You’ve signed out. See you at the next one.");
  }
  async function saved(message: string) {
    setModal(null);
    await refresh();
    setToast(message);
  }
  const now = Date.now();
  const upcoming = events.filter(
    (e) =>
      ["PUBLISHED", "ON_SALE", "SOLD_OUT"].includes(e.status) &&
      new Date(e.startDate).getTime() > now,
  );
  const shown = upcoming
    .filter((event) => {
      const venue = venues.find((v) => v.id === event.venueId);
      const match =
        `${event.title} ${event.description || ""} ${venue?.name || ""} ${venue?.address || ""}`
          .toLowerCase()
          .includes(search.toLowerCase().trim());
      const start = new Date(event.startDate).getTime();
      const limit = dates === "WEEK" ? now + 7 * 86400000 : now + 30 * 86400000;
      const statusMatch =
        filter === "ALL" ||
        (filter === "FREE" ? event.priceCents === 0 : event.status === filter);
      return match && statusMatch && (dates === "ALL" || start <= limit);
    })
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const selected =
    modal?.kind === "event" ? events.find((e) => e.id === modal.id) : undefined;
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="#discover" aria-label="Showpass home">
            <span className="brand-icon">
              <Ticket size={22} strokeWidth={2.4} />
            </span>
            showpass<span className="brand-dot">®</span>
          </a>
          <nav className="main-nav" aria-label="Main navigation">
            <a
              href="#discover"
              aria-current={page === "discover" ? "page" : undefined}
            >
              Discover
            </a>
            <a
              href="#tickets"
              aria-current={page === "tickets" ? "page" : undefined}
            >
              My tickets
            </a>
            <a
              href="#studio"
              aria-current={page === "studio" ? "page" : undefined}
            >
              Organizer studio
              <ArrowUpRight size={14} />
            </a>
          </nav>
          <div className="account-actions">
            {session ? (
              <>
                <span className="account-name" title={session.email}>
                  {session.email.split("@")[0]}
                </span>
                <button
                  className="icon-button"
                  aria-label="Sign out"
                  title="Sign out"
                  onClick={signOut}
                >
                  <LogOut size={19} />
                </button>
              </>
            ) : (
              <button
                className="button dark compact"
                onClick={() => setModal({ kind: "auth" })}
              >
                Sign in <ArrowUpRight size={16} />
              </button>
            )}
          </div>
        </div>
      </header>
      <main id="main-content" className="site-main" tabIndex={-1}>
        {page === "discover" ? (
          <>
            <section className="hero">
              <div className="hero-copy">
                <span className="eyebrow">
                  <span className="live-dot" />
                  FOR THE LOVE OF BEING THERE
                </span>
                <h1>
                  Go out.
                  <br />
                  Feel <em>something.</em>
                </h1>
                <p>
                  The nights you talk about. The people you meet.
                  <br className="desktop-break" /> The moments that don’t happen
                  on a screen.
                </p>
                <a className="button dark" href="#event-list">
                  Find your next thing
                  <ArrowDown size={17} />
                </a>
                <div className="hero-footnote">
                  <span className="tiny-stars">
                    <Burst />
                    <Burst />
                    <Burst />
                  </span>
                  Real people. Shared moments. Good stories.
                </div>
              </div>
              <div className="hero-art" aria-hidden="true">
                <div className="hero-orbit" />
                <div className="hero-sphere" />
                <Burst className="sunburst" />
                <div className="art-caption">
                  <span>LESS SAME OLD.</span>
                  <strong>
                    MORE
                    <br />
                    <i>
                      REMEMBER
                      <br />
                      WHEN.
                    </i>
                  </strong>
                </div>
                <div className="floating-ticket">
                  <div>
                    <Ticket size={22} />
                    <span>
                      ADMIT YOURSELF
                      <br />
                      <strong>TO A GOOD TIME.</strong>
                    </span>
                    <ArrowUpRight size={23} />
                  </div>
                  <div className="ticket-perforation" />
                  <div className="floating-ticket-bottom">
                    <span>SHOW UP. TUNE IN.</span>
                    <div className="mini-barcode" />
                  </div>
                </div>
                <div className="art-footer">
                  <span>THE WORLD IS BETTER LIVE.</span>
                  <span>01 — ∞</span>
                </div>
              </div>
            </section>
            <div className="marquee" aria-hidden="true">
              <span>GOOD TIMES ARE CALLING</span>
              <Sparkles size={18} />
              <span>BE PART OF SOMETHING</span>
              <Sparkles size={18} />
              <span>MAKE A LITTLE ROOM FOR LIVE</span>
              <Sparkles size={18} />
              <span>GOOD TIMES ARE CALLING</span>
            </div>
            <section className="discover-section" id="event-list">
              <div className="section-heading">
                <div>
                  <span className="eyebrow accent">
                    OFF THE FEED. INTO THE MOMENT.
                  </span>
                  <h2>
                    Find your kind of out<span className="accent">.</span>
                  </h2>
                </div>
                <span className="live-count">
                  <span className="live-dot" />
                  {loading
                    ? "Finding the good stuff"
                    : `${upcoming.length} upcoming ${upcoming.length === 1 ? "experience" : "experiences"}`}
                </span>
              </div>
              <div className="search-bar">
                <label className="search-field">
                  <Search size={20} />
                  <span className="sr-only">Search events</span>
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="An event, a place, a little inspiration…"
                  />
                </label>
                <div className="search-date">
                  <CalendarDays size={18} />
                  <label className="sr-only" htmlFor="date-filter">
                    Event dates
                  </label>
                  <select
                    id="date-filter"
                    value={dates}
                    onChange={(e) => setDates(e.target.value)}
                  >
                    <option value="ALL">Any date</option>
                    <option value="WEEK">Next 7 days</option>
                    <option value="MONTH">Next 30 days</option>
                  </select>
                  <ChevronDown size={15} />
                </div>
              </div>
              <div className="event-filters">
                <div className="filter-chips" aria-label="Filter events">
                  {[
                    ["ALL", "All experiences"],
                    ["ON_SALE", "On sale now"],
                    ["PUBLISHED", "Coming soon"],
                    ["FREE", "Free to go"],
                  ].map(([key, label]) => (
                    <button
                      className={filter === key ? "active" : ""}
                      aria-pressed={filter === key}
                      onClick={() => setFilter(key)}
                      key={key}
                    >
                      {key === "ALL" && <Compass size={15} />}
                      {label}
                    </button>
                  ))}
                </div>
                <span className="small muted">
                  A little something for everyone.
                </span>
              </div>
              {loading ? (
                <div
                  className="event-grid"
                  aria-label="Loading events"
                  aria-busy="true"
                >
                  {[1, 2, 3].map((i) => (
                    <div className="skeleton-card" key={i}>
                      <div />
                      <span />
                      <span />
                    </div>
                  ))}
                </div>
              ) : loadError ? (
                <div className="load-error" role="alert">
                  <h3>We couldn’t load the good times.</h3>
                  <p>{loadError}</p>
                  <button
                    className="button secondary"
                    onClick={() => {
                      setLoading(true);
                      void refresh();
                    }}
                  >
                    Try again
                  </button>
                </div>
              ) : shown.length ? (
                <div className="event-grid">
                  {shown.map((event) => {
                    const venue = venues.find((v) => v.id === event.venueId);
                    return (
                      <button
                        className="event-card"
                        key={event.id}
                        onClick={() =>
                          setModal({ kind: "event", id: event.id })
                        }
                        aria-label={`View ${event.title}`}
                      >
                        <div className="event-card-art">
                          <Poster title={event.title} />
                          <div className="card-status">
                            <Status value={event.status} />
                          </div>
                          <span className="card-open">
                            <ArrowUpRight size={20} />
                          </span>
                        </div>
                        <div className="event-card-body">
                          <span className="event-date">
                            {date(event.startDate)}
                            <span>·</span>
                            {time(event.startDate)}
                          </span>
                          <h3>{event.title}</h3>
                          <p>
                            <MapPin size={14} />
                            {venue?.name || "Venue to be announced"}
                          </p>
                          <div className="event-card-bottom">
                            <strong>
                              {event.priceCents
                                ? money(event.priceCents)
                                : "Free"}
                              <small>
                                {event.priceCents ? " / person" : " admission"}
                              </small>
                            </strong>
                            <span>
                              {event.status === "ON_SALE"
                                ? `${event.available} available`
                                : event.status === "PUBLISHED"
                                  ? "On sale soon"
                                  : "Sold out"}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <Empty
                  title={
                    search || filter !== "ALL" || dates !== "ALL"
                      ? "Nothing here. Something out there."
                      : "The next good thing is on its way."
                  }
                  action={
                    search || filter !== "ALL" || dates !== "ALL" ? (
                      <button
                        className="button secondary"
                        onClick={() => {
                          setSearch("");
                          setFilter("ALL");
                          setDates("ALL");
                        }}
                      >
                        Clear filters
                      </button>
                    ) : (
                      <button
                        className="button secondary"
                        onClick={() => navigate("studio")}
                      >
                        Create an experience
                        <ArrowUpRight size={16} />
                      </button>
                    )
                  }
                >
                  {search || filter !== "ALL" || dates !== "ALL"
                    ? "Try another search or give your filters a little breathing room."
                    : "New experiences will appear here when organizers publish them."}
                </Empty>
              )}
            </section>
            <section className="organizer-banner">
              <Burst className="banner-spark" />
              <div>
                <span className="eyebrow">
                  YOU BRING THE IDEA. WE’LL BRING THE TICKETS.
                </span>
                <h2>Got a room to fill?</h2>
                <p>Turn your “what if” into their “you had to be there.”</p>
              </div>
              <button
                className="button dark"
                onClick={() => navigate("studio")}
              >
                Make it happen
                <ArrowUpRight size={18} />
              </button>
            </section>
          </>
        ) : !session ? (
          <div className="signed-out-page">
            <span className="eyebrow accent">
              YOUR GOOD TIMES, ALL TOGETHER
            </span>
            <h1>
              {page === "tickets"
                ? "Your plans belong here."
                : "Something great starts with you."}
            </h1>
            <Empty
              title={
                page === "tickets"
                  ? "Sign in to find your tickets."
                  : "Meet your organizer studio."
              }
              action={
                <button
                  className="button primary"
                  onClick={() => setModal({ kind: "auth" })}
                >
                  Sign in to continue
                  <ArrowRight size={17} />
                </button>
              }
            >
              {page === "tickets"
                ? "Your reservations and confirmed demo tickets are one sign-in away."
                : "Create venues, build events, and take them from draft to a full room."}
            </Empty>
          </div>
        ) : loading ? (
          <div className="page-loading" role="status">
            Getting things ready…
          </div>
        ) : loadError ? (
          <div className="load-error" role="alert">
            <h2>We couldn’t load your workspace.</h2>
            <p>{loadError}</p>
            <button className="button secondary" onClick={() => void refresh()}>
              Try again
            </button>
          </div>
        ) : page === "tickets" ? (
          <Tickets
            orders={orders}
            events={events}
            venues={venues}
            onDiscover={() => navigate("discover")}
            onRefresh={refresh}
            notify={setToast}
          />
        ) : (
          <Studio
            events={events}
            venues={venues}
            userId={session.userId}
            onCreateEvent={() => setModal({ kind: "create" })}
            onCreateVenue={() => setModal({ kind: "venue" })}
            onEditDates={(event) => setModal({ kind: "dates", event })}
            onRefresh={refresh}
            notify={setToast}
          />
        )}
      </main>
      <footer className="site-footer">
        <a className="brand" href="#discover">
          <span className="brand-icon">
            <Ticket size={19} />
          </span>
          showpass
        </a>
        <p>Less watching life. More being there.</p>
        <span>Made for the moments. © {new Date().getFullYear()} Showpass</span>
      </footer>
      {modal?.kind === "auth" && (
        <AuthDialog
          onClose={() =>
            setModal(
              modal.returnEvent
                ? { kind: "event", id: modal.returnEvent }
                : null,
            )
          }
          onSuccess={(s) => {
            setSession(s);
            setToast("You’re in. Let’s make some plans.");
            setModal(
              modal.returnEvent
                ? { kind: "event", id: modal.returnEvent }
                : null,
            );
          }}
        />
      )}
      {modal?.kind === "event" && selected && (
        <EventDialog
          key={selected.id}
          event={selected}
          venue={venues.find((v) => v.id === selected.venueId)}
          session={session}
          onClose={() => setModal(null)}
          onSignIn={() => setModal({ kind: "auth", returnEvent: selected.id })}
          onBooked={() => {
            void saved(
              "Tickets reserved. Confirm your demo payment in My tickets.",
            );
            navigate("tickets");
          }}
        />
      )}
      {modal?.kind === "venue" && (
        <VenueDialog
          onClose={() => setModal(null)}
          onSaved={() =>
            void saved("Your venue is ready for its next great night.")
          }
        />
      )}
      {(modal?.kind === "create" || modal?.kind === "dates") && (
        <EventFormDialog
          event={modal.kind === "dates" ? modal.event : undefined}
          venues={venues}
          onClose={() => setModal(null)}
          onSaved={() =>
            void saved(
              modal.kind === "dates"
                ? "Your event dates have been updated."
                : "Draft created. Your next great event starts here.",
            )
          }
        />
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={19} />
          <span>{toast}</span>
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </>
  );
}
