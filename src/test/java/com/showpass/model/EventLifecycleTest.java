package com.showpass.model;

import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import static org.junit.jupiter.api.Assertions.*;

class EventLifecycleTest {
 private static final Instant NOW=Instant.parse("2030-01-01T00:00:00Z");
 private static final Map<EventStatus,Set<EventStatus>> EXPECTED=Map.of(
  EventStatus.DRAFT,Set.of(EventStatus.PUBLISHED),
  EventStatus.PUBLISHED,Set.of(EventStatus.ON_SALE,EventStatus.CANCELLED),
  EventStatus.ON_SALE,Set.of(EventStatus.SOLD_OUT,EventStatus.COMPLETED,EventStatus.CANCELLED),
  EventStatus.SOLD_OUT,Set.of(EventStatus.ON_SALE,EventStatus.COMPLETED,EventStatus.CANCELLED),
  EventStatus.COMPLETED,Set.of(),EventStatus.CANCELLED,Set.of());

 static Stream<Arguments> transitions(){
  return Stream.of(EventStatus.values()).flatMap(from->Stream.of(EventStatus.values())
   .map(to->Arguments.of(from,to,EXPECTED.get(from).contains(to))));
 }
 @ParameterizedTest @MethodSource("transitions")
 void validatesEveryTransition(EventStatus from,EventStatus to,boolean allowed){
  Event e=event();e.status=from;
  if(allowed)assertDoesNotThrow(()->e.validateStatusTransition(to));
  else assertThrows(IllegalArgumentException.class,()->e.validateStatusTransition(to));
 }
 static Event event(){
  Event e=new Event();e.title="Concert";e.capacity=10;e.available=10;
  e.startDate=NOW.plusSeconds(3600);e.endDate=NOW.plusSeconds(7200);return e;
 }
 @Test void rejectsMissingStatuses(){
  Event e=event();assertThrows(IllegalArgumentException.class,()->e.validateStatusTransition(null));
  e.status=null;assertThrows(IllegalArgumentException.class,()->e.validateStatusTransition(EventStatus.PUBLISHED));
 }
 @Test void publishingAndOpeningSalesRequireFutureStart(){
  Event e=event();
  assertDoesNotThrow(()->e.validateStatusTransition(EventStatus.PUBLISHED,NOW));
  e.startDate=NOW;
  assertThrows(IllegalArgumentException.class,()->e.validateStatusTransition(EventStatus.PUBLISHED,NOW));
  e.status=EventStatus.PUBLISHED;
  assertThrows(IllegalArgumentException.class,()->e.validateStatusTransition(EventStatus.ON_SALE,NOW));
  e.status=EventStatus.SOLD_OUT;
  assertThrows(IllegalArgumentException.class,()->e.validateStatusTransition(EventStatus.ON_SALE,NOW));
 }
 @Test void completingRequiresEndDateReached(){
  Event e=event();e.status=EventStatus.ON_SALE;
  assertThrows(IllegalArgumentException.class,()->e.validateStatusTransition(EventStatus.COMPLETED,e.endDate.minusNanos(1)));
  assertDoesNotThrow(()->e.validateStatusTransition(EventStatus.COMPLETED,e.endDate));
  assertDoesNotThrow(()->e.validateStatusTransition(EventStatus.COMPLETED,e.endDate.plusNanos(1)));
 }
 @Test void rejectsMissingAndEqualDates(){
  assertThrows(IllegalArgumentException.class,()->Event.validateFutureDates(null,NOW,NOW));
  assertThrows(IllegalArgumentException.class,()->Event.validateFutureDates(NOW.plusSeconds(1),null,NOW));
  assertThrows(IllegalArgumentException.class,()->Event.validateFutureDates(NOW.plusSeconds(1),NOW.plusSeconds(1),NOW));
  assertThrows(IllegalArgumentException.class,()->Event.validateFutureDates(NOW,NOW.plusSeconds(1),NOW));
 }
}
