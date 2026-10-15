import type { EventStatus, ShowEvent } from "./types";
export const money = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: cents % 100 ? 2 : 0,
  }).format(cents / 100);
export const date = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
export const time = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
export const statusLabel = (status: string) =>
  status
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^./, (s) => s.toUpperCase());
export const toLocalInput = (value: string) => {
  const d = new Date(value);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};
export const transitions: Record<EventStatus, EventStatus[]> = {
  DRAFT: ["PUBLISHED"],
  PUBLISHED: ["ON_SALE", "CANCELLED"],
  ON_SALE: ["SOLD_OUT", "COMPLETED", "CANCELLED"],
  SOLD_OUT: ["ON_SALE", "COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};
export function transitionReason(
  event: ShowEvent,
  next: EventStatus,
): string | null {
  const now = Date.now();
  if (
    (next === "PUBLISHED" || next === "ON_SALE") &&
    new Date(event.startDate).getTime() <= now
  )
    return "The start must be in the future.";
  if (next === "ON_SALE" && event.available <= 0)
    return "No tickets available.";
  if (next === "SOLD_OUT" && event.available !== 0)
    return "Tickets are still available.";
  if (next === "COMPLETED" && new Date(event.endDate).getTime() > now)
    return "Available after the event ends.";
  return null;
}
export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong.";
export const eventTheme = (title: string) =>
  [...title].reduce((a, c) => a + c.charCodeAt(0), 0) % 4;
