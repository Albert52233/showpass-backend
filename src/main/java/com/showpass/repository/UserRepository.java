package com.showpass.repository;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;
import com.showpass.model.User;
public interface UserRepository extends MongoRepository<User,String> {Optional<User> findByEmail(String email);}
