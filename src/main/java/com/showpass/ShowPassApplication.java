package com.showpass;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import java.time.Clock;
@SpringBootApplication public class ShowPassApplication {
 @Bean Clock clock() { return Clock.systemUTC(); }
 public static void main(String[] args) { SpringApplication.run(ShowPassApplication.class,args); }
}
