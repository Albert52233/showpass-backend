package com.showpass.model;
import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
@Document("events") public class Event {
 @Id public String id;
 public String organizerId;
 public String venueId;
 public String title;
 public String description;
 public Instant startDate;
 public Instant endDate;
 public EventStatus status = EventStatus.DRAFT;
 public int capacity;
 public int available;
 public long priceCents;
 public long version;
 public Event() {}
 public void validateCreate(Instant now) {
  if (title == null || title.isBlank()) throw new IllegalArgumentException("Title is required");
  if (startDate == null || !startDate.isAfter(now)) throw new IllegalArgumentException("Start date must be in the future");
  validateDates();
  if (capacity <= 0) throw new IllegalArgumentException("Capacity must be positive");
  if (priceCents < 0) throw new IllegalArgumentException("Price cannot be negative");
 }
 public void validateDates() {
  if (startDate == null || endDate == null || !endDate.isAfter(startDate))
   throw new IllegalArgumentException("End date must be after start date");
 }
 public void validateStatusTransition(EventStatus next) {
  if (status == null || !status.canMoveTo(next)) throw new IllegalArgumentException("Invalid event status transition");
 }
}
