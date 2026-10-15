package com.showpass.service;
import com.showpass.model.*;
import com.showpass.repository.*;
import java.time.Instant;
import java.time.Clock;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
@Service public class EventService {
 private final EventRepository events;private final VenueRepository venues;private final Clock clock;
 public EventService(EventRepository events,VenueRepository venues,Clock clock){this.events=events;this.venues=venues;this.clock=clock;}
 public Event get(String id){return events.findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Event not found"));}
 public Event create(Event e,String userId){
  try{e.validateCreate(clock.instant());}catch(IllegalArgumentException ex){throw new ResponseStatusException(HttpStatus.BAD_REQUEST,ex.getMessage());}
  Venue v=venues.findById(e.venueId).orElseThrow(()->new ResponseStatusException(HttpStatus.BAD_REQUEST,"Unknown venue"));
  if(e.capacity>v.capacity)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Exceeds venue capacity");
  e.id=null;e.organizerId=userId;e.status=EventStatus.DRAFT;e.available=e.capacity;return events.save(e);
 }
 public Event changeStatus(String id,EventStatus next,String userId){
  Event e=get(id);ensureOwner(e,userId);
  try{e.validateStatusTransition(next,clock.instant());}catch(IllegalArgumentException ex){throw new ResponseStatusException(HttpStatus.BAD_REQUEST,ex.getMessage());}
  if(next==EventStatus.ON_SALE&&e.available<=0)throw new ResponseStatusException(HttpStatus.CONFLICT,"No inventory");
  if(next==EventStatus.SOLD_OUT&&e.available!=0)throw new ResponseStatusException(HttpStatus.CONFLICT,"Event still has inventory");
  e.status=next;return events.save(e);
 }
 public Event updateDates(String id,Instant start,Instant end,String userId){
  Event e=get(id);ensureOwner(e,userId);
  if(e.status==EventStatus.COMPLETED||e.status==EventStatus.CANCELLED)throw new ResponseStatusException(HttpStatus.CONFLICT,"Event is final");
  try{Event.validateFutureDates(start,end,clock.instant());}catch(IllegalArgumentException ex){throw new ResponseStatusException(HttpStatus.BAD_REQUEST,ex.getMessage());}
  e.startDate=start;e.endDate=end;
  return events.save(e);
 }
 public void ensureOwner(Event e,String userId){if(!userId.equals(e.organizerId))throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Not event organizer");}
}
