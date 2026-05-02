package com.example.demo.queue.observer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Observer Pattern (Behavioral) — Concrete Observer: Logging
 *
 * Logs all queue events for auditing and debugging purposes.
 * Demonstrates how new observers can be added without modifying
 * the queue management code.
 */
@Component
public class LoggingNotificationListener implements QueueEventListener {

    private static final Logger log = LoggerFactory.getLogger(LoggingNotificationListener.class);

    @Override
    public void onQueueEvent(QueueEvent event) {
        log.info("[QUEUE EVENT] Type={}, TicketId={}, UserId={}, OfficeId={}, Message={}",
                event.getType(),
                event.getTicketId(),
                event.getUserId(),
                event.getOfficeId(),
                event.getMessage());
    }
}
