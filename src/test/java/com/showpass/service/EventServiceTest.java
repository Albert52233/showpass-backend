package com.showpass.service;

import com.showpass.model.*;
import com.showpass.repository.*;
import java.time.*;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class EventServiceTest {
 private static final Instant NOW=Instant.parse("2030-01-01T00:00:00Z");
 private EventRepository events;
 private EventService service;
 private Event event;
 @BeforeEach void setup(){
  events=mock(EventRepository.class);
  service=new EventService(events,mock(VenueRepository.class),Clock.fixed(NOW,ZoneOffset.UTC));
  event=new Event();event.id="event";event.organizerId="owner";event.status=EventStatus.ON_SALE;
  event.startDate=NOW.plusSeconds(3600);event.endDate=NOW.plusSeconds(7200);event.available=10;
  when(events.findById("event")).thenReturn(Optional.of(event));
  when(events.save(any(Event.class))).thenAnswer(call->call.getArgument(0));
 }
 private void fails(HttpStatus status,Runnable action){
  assertEquals(status,assertThrows(ResponseStatusException.class,action::run).getStatusCode());
  verify(events,never()).save(any());
 }
 @Test void rejectsSkippingLifecycleWithoutMutation(){
  event.status=EventStatus.DRAFT;
  fails(HttpStatus.BAD_REQUEST,()->service.changeStatus("event",EventStatus.ON_SALE,"owner"));
  assertEquals(EventStatus.DRAFT,event.status);
 }
 @Test void onlyOrganizerCanChangeStatusOrDates(){
  fails(HttpStatus.FORBIDDEN,()->service.changeStatus("event",EventStatus.CANCELLED,"other"));
  fails(HttpStatus.FORBIDDEN,()->service.updateDates("event",NOW.plusSeconds(10),NOW.plusSeconds(20),"other"));
 }
 @Test void rejectsSoldOutWithRemainingInventory(){
  fails(HttpStatus.CONFLICT,()->service.changeStatus("event",EventStatus.SOLD_OUT,"owner"));
  assertEquals(EventStatus.ON_SALE,event.status);
 }
 @Test void canMarkSoldOutAndReopenAfterInventoryReturns(){
  event.available=0;
  assertEquals(EventStatus.SOLD_OUT,service.changeStatus("event",EventStatus.SOLD_OUT,"owner").status);
  event.available=1;
  assertEquals(EventStatus.ON_SALE,service.changeStatus("event",EventStatus.ON_SALE,"owner").status);
  verify(events,times(2)).save(event);
 }
 @Test void cannotOpenSalesWithoutInventory(){
  event.status=EventStatus.PUBLISHED;event.available=0;
  fails(HttpStatus.CONFLICT,()->service.changeStatus("event",EventStatus.ON_SALE,"owner"));
 }
 @Test void cannotPublishAnEventThatHasStarted(){
  event.status=EventStatus.DRAFT;event.startDate=NOW;
  fails(HttpStatus.BAD_REQUEST,()->service.changeStatus("event",EventStatus.PUBLISHED,"owner"));
 }
 @Test void cannotCompleteBeforeEnd(){
  fails(HttpStatus.BAD_REQUEST,()->service.changeStatus("event",EventStatus.COMPLETED,"owner"));
 }
 @Test void canCompleteAtEnd(){
  event.startDate=NOW.minusSeconds(10);event.endDate=NOW;
  assertEquals(EventStatus.COMPLETED,service.changeStatus("event",EventStatus.COMPLETED,"owner").status);
 }
 @ParameterizedTest @EnumSource(value=EventStatus.class,names={"COMPLETED","CANCELLED"})
 void finalEventsCannotChange(EventStatus status){
  event.status=status;
  fails(HttpStatus.BAD_REQUEST,()->service.changeStatus("event",EventStatus.PUBLISHED,"owner"));
  fails(HttpStatus.CONFLICT,()->service.updateDates("event",NOW.plusSeconds(10),NOW.plusSeconds(20),"owner"));
 }
 @Test void invalidDatesDoNotMutateEvent(){
  Instant start=event.startDate,end=event.endDate;
  fails(HttpStatus.BAD_REQUEST,()->service.updateDates("event",NOW.plusSeconds(20),NOW.plusSeconds(10),"owner"));
  assertEquals(start,event.startDate);assertEquals(end,event.endDate);
  fails(HttpStatus.BAD_REQUEST,()->service.updateDates("event",NOW,NOW.plusSeconds(10),"owner"));
  assertEquals(start,event.startDate);assertEquals(end,event.endDate);
 }
 @Test void validDatesAreSaved(){
  Event result=service.updateDates("event",NOW.plusSeconds(10),NOW.plusSeconds(20),"owner");
  assertEquals(NOW.plusSeconds(10),result.startDate);verify(events).save(event);
 }
}
