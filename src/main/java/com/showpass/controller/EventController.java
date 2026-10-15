package com.showpass.controller;
import com.showpass.model.*;
import com.showpass.repository.EventRepository;
import com.showpass.service.EventService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/events") public class EventController {
 private final EventService service;private final EventRepository repo;
 public EventController(EventService s,EventRepository r){service=s;repo=r;}
 public record CreateRequest(@NotBlank String title,String description,@NotBlank String venueId,
 Instant startDate,Instant endDate,@Min(1) int capacity,@Min(0) long priceCents) {}
 public record StatusRequest(@NotNull EventStatus status) {}
 public record DatesRequest(@NotNull Instant startDate,@NotNull Instant endDate) {}
 @GetMapping public List<Event> list(){return repo.findAll();}
 @GetMapping("/{id}") public Event get(@PathVariable String id){return service.get(id);}
 @PostMapping @ResponseStatus(HttpStatus.CREATED) public Event create(@Valid @RequestBody CreateRequest r,JwtAuthenticationToken auth){
  Event e=new Event();e.title=r.title();e.description=r.description();e.venueId=r.venueId();e.startDate=r.startDate();e.endDate=r.endDate();e.capacity=r.capacity();e.priceCents=r.priceCents();
  return service.create(e,auth.getName());
 }
 @PatchMapping("/{id}/status") public Event status(@PathVariable String id,@Valid @RequestBody StatusRequest r,JwtAuthenticationToken auth){return service.changeStatus(id,r.status(),auth.getName());}
 @PatchMapping("/{id}/dates") public Event dates(@PathVariable String id,@Valid @RequestBody DatesRequest r,JwtAuthenticationToken auth){return service.updateDates(id,r.startDate(),r.endDate(),auth.getName());}
}
