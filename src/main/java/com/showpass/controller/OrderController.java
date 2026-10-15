package com.showpass.controller;
import com.showpass.model.Order;
import com.showpass.service.OrderService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/orders") public class OrderController {
 private final OrderService service;public OrderController(OrderService s){service=s;}
 public record OrderRequest(@NotBlank String eventId,@Min(1) @Max(10) int quantity) {}
 @PostMapping @ResponseStatus(HttpStatus.CREATED) public Order purchase(@Valid @RequestBody OrderRequest r,JwtAuthenticationToken a){return service.purchase(r.eventId(),r.quantity(),a.getName());}
 @GetMapping public List<Order> mine(JwtAuthenticationToken a){return service.mine(a.getName());}
 @GetMapping("/{id}") public Order get(@PathVariable String id,JwtAuthenticationToken a){return service.get(id,a.getName());}
 @PostMapping("/{id}/mock-pay") public Order pay(@PathVariable String id,JwtAuthenticationToken a){return service.confirmMockPayment(id,a.getName());}
 @PostMapping("/{id}/cancel") public Order cancel(@PathVariable String id,JwtAuthenticationToken a){return service.cancel(id,a.getName());}
}
