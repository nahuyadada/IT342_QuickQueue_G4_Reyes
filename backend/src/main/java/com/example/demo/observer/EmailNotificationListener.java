package com.example.demo.observer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Observer Pattern (Behavioral) — Concrete Observer: Email Notification
 *
 * Simulates email notifications for queue events. In production this would
 * use Spring's JavaMailSender with SMTP configuration as described in the SDD
 * (POST /notifications/send). Currently logs the notification for demonstration.
 *
 * Adding real SMTP support requires only modifying this class —
 * no changes to QueueFacade, QueueService, or QueueEventPublisher.
 */
@Component
public class EmailNotificationListener implements QueueEventListener {

    private static final Logger log = LoggerFactory.getLogger(EmailNotificationListener.class);

    @Override
    public void onQueueEvent(QueueEvent event) {
        switch (event.getType()) {
            case TICKET_CREATED -> sendNotification(
                    event.getUserId(),
                    "Queue Ticket Confirmed",
                    event.getMessage()
            );
            case TURN_APPROACHING -> sendNotification(
                    event.getUserId(),
                    "Your Turn is Approaching!",
                    event.getMessage()
            );
            case NOW_SERVING -> sendNotification(
                    event.getUserId(),
                    "Now Serving - Your Turn!",
                    event.getMessage()
            );
            case TICKET_CANCELLED -> sendNotification(
                    event.getUserId(),
                    "Ticket Cancelled",
                    event.getMessage()
            );
        }
    }

    /**
     * Simulate sending an email notification.
     * In production: use JavaMailSender to send via SMTP.
     */
    private void sendNotification(Long userId, String subject, String body) {
        log.info("[EMAIL NOTIFICATION] To UserId={}, Subject='{}', Body='{}'",
                userId, subject, body);
    }
}
