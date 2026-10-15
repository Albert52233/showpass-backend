package com.showpass.controller;
import com.showpass.model.Venue;
import com.showpass.repository.VenueRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;
import org.springframework.http.*;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
@RestController @RequestMapping("/api/venues") public class VenueController {
 private final VenueRepository repo;
 public VenueController(VenueRepository repo){this.repo=repo;}
 public record VenueRequest(@NotBlank String name,@NotBlank String address,@Min(1) int capacity) {}
 @GetMapping public List<Venue> list(){return repo.findAll();}
 @GetMapping("/{id}") public Venue get(@PathVariable String id){return repo.findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND));}
 @PostMapping @ResponseStatus(HttpStatus.CREATED) public Venue create(@Valid @RequestBody VenueRequest req,JwtAuthenticationToken auth){
  Venue v=new Venue();v.name=req.name();v.address=req.address();v.capacity=req.capacity();v.ownerId=auth.getName();return repo.save(v);
 }
}
