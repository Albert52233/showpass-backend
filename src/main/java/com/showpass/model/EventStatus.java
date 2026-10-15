package com.showpass.model;
import java.util.*;
public enum EventStatus {
 DRAFT, PUBLISHED, ON_SALE, SOLD_OUT, COMPLETED, CANCELLED;
 private static final Map<EventStatus, Set<EventStatus>> ALLOWED = Map.of(
 DRAFT,Set.of(PUBLISHED), PUBLISHED,Set.of(ON_SALE,CANCELLED),
 ON_SALE,Set.of(SOLD_OUT,COMPLETED,CANCELLED),
 SOLD_OUT,Set.of(ON_SALE,COMPLETED,CANCELLED),
 COMPLETED,Set.of(),CANCELLED,Set.of());
 public boolean canMoveTo(EventStatus target) { return target != null && ALLOWED.get(this).contains(target); }
}
