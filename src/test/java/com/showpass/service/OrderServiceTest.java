package com.showpass.service;

import com.showpass.model.*;
import com.showpass.repository.OrderRepository;
import java.time.*;
import org.bson.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.mongodb.core.*;
import org.springframework.data.mongodb.core.query.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class OrderServiceTest {
 private static final Instant NOW=Instant.parse("2030-01-01T00:00:00Z");
 private MongoTemplate mongo;
 private OrderRepository orders;
 private OrderService service;
 @BeforeEach void setup(){
  mongo=mock(MongoTemplate.class);orders=mock(OrderRepository.class);
  EventService events=mock(EventService.class);
  Event event=new Event();event.id="event";event.priceCents=250;
  when(events.get("event")).thenReturn(event);
  service=new OrderService(mongo,events,orders,Clock.fixed(NOW,ZoneOffset.UTC));
 }
 @Test void failedAtomicReservationNeverCreatesOrder(){
  ResponseStatusException ex=assertThrows(ResponseStatusException.class,()->service.purchase("event",2,"user"));
  assertEquals(HttpStatus.CONFLICT,ex.getStatusCode());verifyNoInteractions(orders);
 }
 @Test void timeGuardIsPartOfAtomicReservation(){
  when(mongo.findAndModify(any(Query.class),any(Update.class),any(FindAndModifyOptions.class),eq(Event.class))).thenReturn(new Event());
  when(orders.save(any(Order.class))).thenAnswer(call->call.getArgument(0));
  Order order=service.purchase("event",2,"user");
  assertEquals(500,order.totalCents);assertEquals("user",order.userId);
  ArgumentCaptor<Query> query=ArgumentCaptor.forClass(Query.class);
  verify(mongo).findAndModify(query.capture(),any(Update.class),any(FindAndModifyOptions.class),eq(Event.class));
  assertEquals(NOW,query.getValue().getQueryObject().get("startDate",Document.class).get("$gt"));
 }
}
