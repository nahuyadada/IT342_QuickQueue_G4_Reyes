package com.example.demo.observer;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Observer Pattern (Behavioral) — Subject / Publisher
 *
 * Manages a list of QueueEventListeners and publishes queue events to all of them.
 * Spring automatically injects all beans implementing QueueEventListener.
 *
 * When the queue state changes (ticket created, turn approaching, now serving),
 * the publisher notifies ALL registered listeners without knowing their specifics.
 * This decouples queue logic from notification delivery mechanisms.
 */
@Component
@RequiredArgsConstructor
public class QueueEventPublisher {

    private final List<QueueEventListener> listeners;

    /**
     * Publish an event to all registered listeners.
     */
    public void publish(QueueEvent event) {
        for (QueueEventListener listener : listeners) {
            listener.onQueueEvent(event);
        }
    }
}
