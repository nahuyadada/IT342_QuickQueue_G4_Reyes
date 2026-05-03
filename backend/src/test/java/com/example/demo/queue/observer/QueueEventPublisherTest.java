package com.example.demo.queue.observer;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for QueueEventPublisher (Observer Pattern).
 * Verifies event broadcasting to all registered listeners.
 */
class QueueEventPublisherTest {

    @Test
    void publish_shouldNotifyAllListeners() {
        List<QueueEvent> receivedEvents1 = new ArrayList<>();
        List<QueueEvent> receivedEvents2 = new ArrayList<>();

        QueueEventListener listener1 = receivedEvents1::add;
        QueueEventListener listener2 = receivedEvents2::add;

        QueueEventPublisher publisher = new QueueEventPublisher(List.of(listener1, listener2));

        QueueEvent event = new QueueEvent(
                QueueEvent.EventType.TICKET_CREATED, 1L, 100L, 1L, "Test message");

        publisher.publish(event);

        assertEquals(1, receivedEvents1.size());
        assertEquals(1, receivedEvents2.size());
        assertEquals("Test message", receivedEvents1.get(0).getMessage());
    }

    @Test
    void publish_shouldPassCorrectEventToListeners() {
        List<QueueEvent> received = new ArrayList<>();
        QueueEventListener listener = received::add;

        QueueEventPublisher publisher = new QueueEventPublisher(List.of(listener));

        QueueEvent event = new QueueEvent(
                QueueEvent.EventType.NOW_SERVING, 1L, 100L, 1L, "Now serving");

        publisher.publish(event);

        assertEquals(QueueEvent.EventType.NOW_SERVING, received.get(0).getType());
        assertEquals(1L, received.get(0).getTicketId());
        assertEquals(100L, received.get(0).getUserId());
    }

    @Test
    void publish_withNoListeners_shouldNotThrow() {
        QueueEventPublisher publisher = new QueueEventPublisher(List.of());

        QueueEvent event = new QueueEvent(
                QueueEvent.EventType.TICKET_CANCELLED, 1L, 100L, 1L, "Cancelled");

        assertDoesNotThrow(() -> publisher.publish(event));
    }

    @Test
    void publish_multipleEvents_shouldNotifyForEach() {
        List<QueueEvent> received = new ArrayList<>();
        QueueEventListener listener = received::add;

        QueueEventPublisher publisher = new QueueEventPublisher(List.of(listener));

        publisher.publish(new QueueEvent(QueueEvent.EventType.TICKET_CREATED, 1L, 100L, 1L, "Created"));
        publisher.publish(new QueueEvent(QueueEvent.EventType.NOW_SERVING, 2L, 101L, 1L, "Serving"));
        publisher.publish(new QueueEvent(QueueEvent.EventType.TICKET_CANCELLED, 3L, 102L, 1L, "Cancelled"));

        assertEquals(3, received.size());
    }
}
