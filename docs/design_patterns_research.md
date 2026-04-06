# Software Design Patterns Research
**Course:** Software Design Patterns Activity  
**Project:** QuickQueue (Queue Management System)

---

## 1. Factory Method
**Category:** Creational Pattern

**Problem It Solves:** 
When a class cannot anticipate the class of objects it must create, or when a system needs to be independent of how its products are created. Using the `new` keyword directly couples the code to specific implementations.

**How It Works:** 
It defines an interface or abstract class for creating an object, but lets subclasses decide which class to instantiate. The factory method shifts the responsibility of instantiation to a separate class/method.

**Real-world Example:** 
In a logistics application, a `TransportFactory` might create a `Truck` (for ground shipping) or a `Ship` (for sea shipping), both returning a common `Transport` interface.

**Possible use case in QuickQueue:** 
Generating different types of notifications (SMS, In-App, Email). A `NotificationFactory` can receive the desired type and instantiate the corresponding `SmsNotification` or `InAppNotification` without tightly coupling the core queue logic to the specifics of the notification type.

---

## 2. Builder
**Category:** Creational Pattern

**Problem It Solves:** 
When an object requires complex initialization with many optional or required parameters, using a constructor with a long list of arguments (Telescoping Constructor Anti-pattern) becomes unreadable and hard to maintain.

**How It Works:** 
It separates the construction of a complex object from its representation. The Builder pattern uses step-by-step methods (`withName()`, `withDate()`, etc.) that return the builder object itself (method chaining), culminating in a `build()` method to yield the final object.

**Real-world Example:** 
Building a complex SQL query string using a `QueryBuilder` where you conditionally append `SELECT`, `WHERE`, and `ORDER BY` clauses.

**Possible use case in QuickQueue:** 
Constructing a `QueueTicket` response object. A ticket might require a service location, unique queue numbered string, generated timestamp, estimated wait time, and user details. A `QueueTicket.Builder` cleanly constructs this prior to returning it to the frontend via API.

---

## 3. Facade
**Category:** Structural Pattern

**Problem It Solves:** 
When a system or subsystem has become overly complex with many moving parts and interfaces, client code shouldn't have to interact with all the underlying components to achieve a simple task.

**How It Works:** 
Provides a simplified, higher-level interface to a complex subsystem. Internally, the Facade handles interactions with all the complex classes and exposes only a clean, simple set of operations to the client.

**Real-world Example:** 
A smart home app UI acting as a facade. A single "Movie Mode" button turns off the lights, closes the blinds, turns on the TV, and sets the audio system, hiding all those individual integrations from the user.

**Possible use case in QuickQueue:** 
A `QueueManagementFacade`. When a user "Takes a Queue Number", the Facade internally coordinates with `QueueRepository` (to generate numbers), `Strategy` (to calculate timing), `TicketBuilder` (to format response), and `NotificationService` (to schedule alerts), returning a clean response to the Controller layer.

---

## 4. Adapter
**Category:** Structural Pattern

**Problem It Solves:** 
When two incompatible interfaces need to work together. Commonly used when integrating with third-party libraries or legacy code that cannot be altered directly.

**How It Works:** 
It acts as a wrapper that catches calls to the target interface and delegates them in a format recognizable to the adaptee interface.

**Real-world Example:** 
A power adapter that allows a US plug (110V flat pins) to connect to a European socket (220V round pins). 

**Possible use case in QuickQueue:** 
Integrating a dummy legacy or third-party SMS gateway `LegacySmsProvider` into our generic `Notification` interface. We use an `ExternalSmsAdapter` to translate QuickQueue's standard `send(message)` into the legacy API's `dispatchShortMessageService(recipient, payload)` logic.

---

## 5. Strategy
**Category:** Behavioral Pattern

**Problem It Solves:** 
When you have multiple algorithms for a specific task and need to switch between them dynamically at runtime without cluttering code with massive `if-else` or `switch` statements.

**How It Works:** 
It encapsulates each algorithm inside its own class that implements a common strategy interface. The context class holds a reference to the strategy and delegates the execution to it dynamically.

**Real-world Example:** 
A navigation app calculating routes. It uses different strategies: `CarRouteStrategy`, `WalkingRouteStrategy`, or `BicycleRouteStrategy` depending on the user's choice.

**Possible use case in QuickQueue:** 
Calculating the Estimated Wait Time. A banking queue goes faster per person than a medical clinic queue. A `WaitTimeStrategy` interface can have `ClinicWaitTimeStrategy` and `BankWaitTimeStrategy`, letting QuickQueue switch the calculation mechanism based on the selected Service Location type.

---

## 6. Observer
**Category:** Behavioral Pattern

**Problem It Solves:** 
When a change to one object requires changing others, and you don't know exactly how many objects need to be changed or who they are.

**How It Works:** 
It defines a one-to-many dependency so that when one object (Subject) changes state, all its dependents (Observers) are notified and updated automatically. 

**Real-world Example:** 
A newspaper subscription. The publisher (Subject) publishes a new issue, and all subscribers (Observers) get it delivered automatically without needing to check the store every day (polling).

**Possible use case in QuickQueue:** 
Users waiting in line. The Queue object is the Subject, and connected clients (Users) are Observers. When the queue number advances, it signals an event that notifies all registered observers, so the system can alert those whose turns are approaching.
