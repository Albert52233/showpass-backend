package com.showpass.repository;
import org.springframework.data.mongodb.repository.MongoRepository;
import com.showpass.model.Order;
public interface OrderRepository extends MongoRepository<Order,String> {}
