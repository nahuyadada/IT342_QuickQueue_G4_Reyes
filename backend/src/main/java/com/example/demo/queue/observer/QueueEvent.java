package com.example.demo.queue.observer;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Observer Pattern (Behavioral) — Event Object
 *
 * Represents a queue state change event. Published by QueueEventPublisher
 * and consumed by QueueEventListener implementations.
 */
@Data
@AllArgsConstructor
public class QueueEvent {

    private EventType type;
    private Long ticketId;
    private Long userId;
    private Long officeId;
    private String message;

    public enum EventType {
        TICKET_CREATED,
        TURN_APPROACHING,
        NOW_SERVING,
        TICKET_COMPLETED,
        TICKET_CANCELLED
    }
}
