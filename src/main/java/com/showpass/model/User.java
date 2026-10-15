package com.showpass.model;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
@Document("users") public class User {
 @Id public String id;
 @Indexed(unique=true) public String email;
 public String passwordHash;
 public String role="USER";
 public User() {}
 public User(String email,String hash) {this.email=email;this.passwordHash=hash;}
}
