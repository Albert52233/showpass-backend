package com.showpass.model;
import org.junit.jupiter.api.Test;
import java.time.Instant;
import static org.junit.jupiter.api.Assertions.*;
class EventTest {
 @Test void rejectsPastStart(){Event e=valid();e.startDate=Instant.now().minusSeconds(60);assertThrows(IllegalArgumentException.class,()->e.validateCreate(Instant.now()));}
 @Test void rejectsEndBeforeStart(){Event e=valid();e.endDate=e.startDate.minusSeconds(1);assertThrows(IllegalArgumentException.class,e::validateDates);}
 @Test void rejectsInvalidTransition(){Event e=valid();assertThrows(IllegalArgumentException.class,()->e.validateStatusTransition(EventStatus.ON_SALE));}
 @Test void allowsValidTransition(){Event e=valid();assertDoesNotThrow(()->e.validateStatusTransition(EventStatus.PUBLISHED));}
 @Test void completedIsTerminal(){Event e=valid();e.status=EventStatus.COMPLETED;assertThrows(IllegalArgumentException.class,()->e.validateStatusTransition(EventStatus.DRAFT));}
 static Event valid(){Event e=new Event();e.title="Concert";e.startDate=Instant.now().plusSeconds(3600);e.endDate=e.startDate.plusSeconds(7200);e.capacity=100;return e;}
}
