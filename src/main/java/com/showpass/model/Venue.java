package com.showpass.model;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
@Document("venues") public class Venue {
 @Id public String id;
 public String name;
 public String address;
 public int capacity;
 public String ownerId;
 public Venue() {}
}
