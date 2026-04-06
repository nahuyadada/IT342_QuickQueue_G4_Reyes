# Refactoring Report

**Activity:** Applying Design Patterns to QuickQueue
**Developer:** Christian Andrey Villareal Reyes (IT342-G4)

---

## 1. Before vs After Description

### What was the original implementation?
Initially, the QuickQueue system's backend was heavily focused on Authentication (`AuthService`), with the core Queue Management operations completely missing or planned as a monolithic Block inside a `QueueController`. Without design patterns, issuing a ticket would involve massive `if-else` blocks to calculate wait times for different services, direct instantiation of notification services, and tightly coupled observer updates within a massive procedural function. 

### What problems did it have? (or would it have had?)
- **Tight Coupling:** The Controller would be responsible for generating tickets, calculating times, and sending SMS.
- **Poor Maintainability:** Adding a new location type (e.g., Government Office) would require modifying the `if-else` blocks for wait time calculations.
- **Low Reusability:** Creating notification objects (`new SmsNotification()`) made it impossible to swap notification providers smoothly.

### After Refactoring
The system now separates concerns cleanly into Services using **six software design patterns**. The `QueueController` simply delegates complex workflows to a `QueueManagementFacade`, which coordinates `QueueService`, `WaitTimeStrategy`, and `NotificationFactory`. 

---

## 2. Applied Design Patterns

### A. Factory Method
- **Where it was applied:** `NotificationFactory`, `Notification`, `SmsNotification`, `InAppNotification`.
- **Justification:** We chose this because notifications can have various mediums. Using a factory method allows the Facade to simply request a notification type without knowing its instantiation details.
- **Improvement:** Easy to add a new `EmailNotification` class without modifying the Queue logic.

### B. Builder
- **Where it was applied:** `QueueTicket.Builder`
- **Justification:** `QueueTicket` objects require many parameters (Ticket Number, Service Location, Wait Time, Timestamp). A telescoping constructor would be unreadable.
- **Improvement:** The code constructing the ticket reads clearly like English, ensuring immutability of the final Ticket object.

### C. Facade
- **Where it was applied:** `QueueManagementFacade`
- **Justification:** The process of joining a queue involves 5 distinct steps (Wait time calc, Number generation, Ticket building, Observer registration, Notification).
- **Improvement:** The Web Controller stays extremely thin and clean, only invoking `facade.joinQueue()`.

### D. Adapter
- **Where it was applied:** `ExternalSmsAdapter` and `LegacySmsProvider`
- **Justification:** Simulates integration with a third-party legacy SMS API. The third-party API uses method names like `dispatchShortMessageService` which break our `Notification` interface.
- **Improvement:** The QuickQueue backend can talk to legacy systems via the Adapter without altering its own clean interfaces.

### E. Strategy
- **Where it was applied:** `WaitTimeStrategy`, `ClinicWaitTimeStrategy`, `BankWaitTimeStrategy`
- **Justification:** Different locations process lines at different speeds. 
- **Improvement:** Removed monolithic `switch` logic. Adding a new `GovernmentWaitTimeStrategy` only requires adding a new class.

### F. Observer
- **Where it was applied:** `QueueSubject`, `QueueObserver`, `RealUserObserver`, `QueueService`
- **Justification:** Queue progression needs to alert connected users automatically.
- **Improvement:** Loose coupling. `QueueService` doesn't know who is waiting; it simply calls `notifyObservers()` when the line moves.

---

## 3. Code Snippets

### Factory Pattern 
```java
@Service
public class NotificationFactory {
    public Notification getNotification(String type) {
        Notification notification = notificationMap.get(type);
        return notification;
    }
}
```

### Strategy Pattern
```java
@Component("bankWaitTimeStrategy")
public class BankWaitTimeStrategy implements WaitTimeStrategy {
    @Override
    public int calculateWaitTime(int peopleAhead) {
        return peopleAhead * 5; // 5 mins per person
    }
}
```

### Facade Pattern
```java
public QueueTicket joinQueue(String userEmail, String serviceLocationType, String notificationPref) {
    WaitTimeStrategy strategy = strategies.get(serviceLocationType + "WaitTimeStrategy");
    int expectedWaitTime = strategy.calculateWaitTime(queueService.getPeopleAhead());
    
    // ... number generation logic ...
    
    QueueTicket ticket = new QueueTicket.Builder()
            .withTicketNumber(formattedNumber)
            .build();
            
    Notification notification = notificationFactory.getNotification(notificationPref);
    notification.send(userEmail, "Joined!");
    return ticket;
}
```
