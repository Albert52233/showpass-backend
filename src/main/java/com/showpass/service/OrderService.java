package com.showpass.service;
import com.showpass.model.*;
import com.showpass.repository.OrderRepository;
import com.mongodb.client.result.UpdateResult;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
@Service public class OrderService {
 private final MongoTemplate mongo;private final EventService events;private final OrderRepository orders;
 public OrderService(MongoTemplate mongo,EventService events,OrderRepository orders){this.mongo=mongo;this.events=events;this.orders=orders;}
 public Order purchase(String eventId,int quantity,String userId){
  if(quantity<1||quantity>10)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Quantity must be 1-10");
  Event event=events.get(eventId);
  Query query=new Query(Criteria.where("_id").is(eventId).and("status").is(EventStatus.ON_SALE).and("available").gte(quantity));
  Update update=new Update().inc("available",-quantity);
  Event updated=mongo.findAndModify(query,update,org.springframework.data.mongodb.core.FindAndModifyOptions.options().returnNew(true),Event.class);
  if(updated==null)throw new ResponseStatusException(HttpStatus.CONFLICT,"Event not on sale or insufficient inventory");
  Order order=new Order();order.eventId=eventId;order.userId=userId;order.quantity=quantity;order.totalCents=Math.multiplyExact(event.priceCents,quantity);
  try{return orders.save(order);}catch(RuntimeException ex){mongo.updateFirst(new Query(Criteria.where("_id").is(eventId)),new Update().inc("available",quantity),Event.class);throw ex;}
 }
 public Order get(String id,String userId){Order o=orders.findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND));
  if(!o.userId.equals(userId))throw new ResponseStatusException(HttpStatus.FORBIDDEN);return o;}
 public List<Order> mine(String userId){return orders.findAll().stream().filter(o->o.userId.equals(userId)).toList();}
 public Order confirmMockPayment(String id,String userId){
  Order o=get(id,userId);
  if(!"PENDING".equals(o.status))throw new ResponseStatusException(HttpStatus.CONFLICT,"Order already processed");
  o.status="PAID";return orders.save(o);
 }
 public Order cancel(String id,String userId){
  Order o=get(id,userId);
  if(!"PENDING".equals(o.status))throw new ResponseStatusException(HttpStatus.CONFLICT,"Only pending orders can be cancelled");
  o.status="CANCELLED";Order saved=orders.save(o);
  mongo.updateFirst(new Query(Criteria.where("_id").is(o.eventId)),new Update().inc("available",o.quantity),Event.class);
  return saved;
 }
}
