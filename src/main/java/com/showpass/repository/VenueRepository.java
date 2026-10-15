package com.showpass.repository;
import org.springframework.data.mongodb.repository.MongoRepository;
import com.showpass.model.Venue;
public interface VenueRepository extends MongoRepository<Venue,String> {}
