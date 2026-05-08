package com.example.demo.queue.observer;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for QueueEvent (Observer Pattern - Event Object).
 * Verifies event data integrity and enum values.
 */
class QueueEventTest {

    @Test
    void constructor_shouldSetAllFields() {
        QueueEvent event = new QueueEvent(
                QueueEvent.EventType.TICKET_CREATED, 1L, 100L, 5L, "Test");

        assertEquals(QueueEvent.EventType.TICKET_CREATED, event.getType());
        assertEquals(1L, event.getTicketId());
        assertEquals(100L, event.getUserId());
        assertEquals(5L, event.getOfficeId());
        assertEquals("Test", event.getMessage());
    }

    @Test
    void eventType_shouldHaveAllExpectedValues() {
        QueueEvent.EventType[] values = QueueEvent.EventType.values();
        assertEquals(4, values.length);
    }

    @Test
    void eventType_TICKET_CREATED_exists() {
        assertNotNull(QueueEvent.EventType.valueOf("TICKET_CREATED"));
    }

    @Test
    void eventType_TURN_APPROACHING_exists() {
        assertNotNull(QueueEvent.EventType.valueOf("TURN_APPROACHING"));
    }

    @Test
    void eventType_NOW_SERVING_exists() {
        assertNotNull(QueueEvent.EventType.valueOf("NOW_SERVING"));
    }

    @Test
    void eventType_TICKET_CANCELLED_exists() {
        assertNotNull(QueueEvent.EventType.valueOf("TICKET_CANCELLED"));
    }

    @Test
    void setters_shouldUpdateFields() {
        QueueEvent event = new QueueEvent(
                QueueEvent.EventType.TICKET_CREATED, 1L, 100L, 5L, "Original");

        event.setMessage("Updated");
        event.setType(QueueEvent.EventType.NOW_SERVING);

        assertEquals("Updated", event.getMessage());
        assertEquals(QueueEvent.EventType.NOW_SERVING, event.getType());
    }
}
