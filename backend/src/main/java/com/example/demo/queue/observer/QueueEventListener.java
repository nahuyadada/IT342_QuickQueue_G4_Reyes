package com.example.demo.queue.observer;

/**
 * Observer Pattern (Behavioral) — Observer Interface
 *
 * Any component that wants to react to queue state changes
 * implements this interface. New notification channels (email, SMS, push)
 * can be added by simply creating a new listener — zero changes to
 * the queue management code (Open/Closed Principle).
 */
public interface QueueEventListener {

    /**
     * Called when a queue event occurs.
     */
    void onQueueEvent(QueueEvent event);
}
