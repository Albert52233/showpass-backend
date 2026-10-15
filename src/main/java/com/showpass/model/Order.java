package com.showpass.model;
import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
@Document("orders") public class Order {
 @Id public String id;
 public String userId;
 @Indexed public String eventId;
 public int quantity;
 public long totalCents;
 public String status="PENDING";
 public Instant createdAt=Instant.now();
 public Order() {}
}
