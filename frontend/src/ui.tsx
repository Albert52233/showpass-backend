import { useEffect, useId, useRef, type ReactNode } from "react";
import { ArrowUpRight, Ticket, X } from "lucide-react";
import { eventTheme, statusLabel } from "./utils";

export function Status({ value }: { value: string }) {
  return (
    <span className={`status status-${value.toLowerCase()}`}>
      {statusLabel(value)}
    </span>
  );
}
export function Poster({
  title,
  large = false,
}: {
  title: string;
  large?: boolean;
}) {
  return (
    <div
      className={`poster theme-${eventTheme(title)} ${large ? "poster-large" : ""}`}
      aria-hidden="true"
    >
      <div className="poster-grid" />
      <div className="poster-orbit orbit-one" />
      <div className="poster-orbit orbit-two" />
      <div className="poster-sun" />
      <span className="poster-edition">SHOWPASS ORIGINAL EXPERIENCES</span>
      <span className="poster-type">
        LIVE
        <br />
        <i>A LITTLE.</i>
      </span>
      <ArrowUpRight className="poster-arrow" />
      <div className="poster-bottom">
        <span>BE HERE. BE PART OF IT.</span>
        <span>SP / LIVE</span>
      </div>
    </div>
  );
}
export function Empty({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Ticket size={27} />
      </span>
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}
export function Dialog({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const dialog = ref.current!;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialog.showModal();
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = before;
      previouslyFocused?.focus();
    };
  }, []);
  return (
    <dialog
      className={`dialog ${wide ? "dialog-wide" : ""}`}
      ref={ref}
      aria-labelledby={id}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="dialog-inner">
        <div className="dialog-heading">
          <h2 id={id}>{title}</h2>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={21} />
          </button>
        </div>
        {children}
      </section>
    </dialog>
  );
}
export function FormError({ error }: { error: string }) {
  return error ? (
    <p className="form-error" role="alert">
      {error}
    </p>
  ) : null;
}

export function Burst({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M50 9v82M9 50h82M21 21l58 58M21 79l58-58"
        stroke="currentColor"
        strokeWidth="11"
        strokeLinecap="round"
      />
    </svg>
  );
}
