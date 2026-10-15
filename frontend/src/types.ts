export type EventStatus =
  "DRAFT" | "PUBLISHED" | "ON_SALE" | "SOLD_OUT" | "COMPLETED" | "CANCELLED";
export interface ShowEvent {
  id: string;
  organizerId: string;
  venueId: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  status: EventStatus;
  capacity: number;
  available: number;
  priceCents: number;
}
export interface Venue {
  id: string;
  name: string;
  address: string;
  capacity: number;
  ownerId: string;
}
export interface Order {
  id: string;
  eventId: string;
  userId: string;
  quantity: number;
  totalCents: number;
  status: "PENDING" | "PAID" | "CANCELLED";
  createdAt: string;
}
export interface Session {
  token: string;
  email: string;
  userId: string;
  expiresAt: number;
}
export type Page = "discover" | "tickets" | "studio";
