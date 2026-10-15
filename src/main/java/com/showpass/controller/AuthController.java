package com.showpass.controller;
import com.showpass.model.User;
import com.showpass.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
@RestController @RequestMapping("/api/auth") public class AuthController {
 private final UserRepository users; private final PasswordEncoder passwords; private final JwtEncoder encoder;
 public AuthController(UserRepository u,PasswordEncoder p,JwtEncoder e){users=u;passwords=p;encoder=e;}
 public record Credentials(@Email @NotBlank String email,@NotBlank @Size(min=8) String password) {}
 @PostMapping("/register") @ResponseStatus(HttpStatus.CREATED)
 public Map<String,String> register(@Valid @RequestBody Credentials c){
  String email=c.email().trim().toLowerCase(java.util.Locale.ROOT);
  if(users.findByEmail(email).isPresent())throw new ResponseStatusException(HttpStatus.CONFLICT,"Email already registered");
  User user=users.save(new User(email,passwords.encode(c.password())));return token(user);
 }
 @PostMapping("/login") public Map<String,String> login(@Valid @RequestBody Credentials c){
  User user=users.findByEmail(c.email().trim().toLowerCase(java.util.Locale.ROOT))
   .orElseThrow(()->new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Invalid credentials"));
  if(!passwords.matches(c.password(),user.passwordHash))throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Invalid credentials");
  return token(user);
 }
 private Map<String,String> token(User user){
  Instant now=Instant.now();JwtClaimsSet claims=JwtClaimsSet.builder().issuer("showpass").subject(user.id)
   .issuedAt(now).expiresAt(now.plus(2,ChronoUnit.HOURS)).claim("role",user.role).build();
  String jwt=encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(),claims)).getTokenValue();
  return Map.of("access_token",jwt,"token_type","Bearer");
 }
}
