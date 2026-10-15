package com.showpass.repository;
import org.springframework.data.mongodb.repository.MongoRepository;
import com.showpass.model.Event;
public interface EventRepository extends MongoRepository<Event,String> {}
