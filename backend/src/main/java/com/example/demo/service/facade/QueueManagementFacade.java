package com.example.demo.service.facade;

import com.example.demo.model.notification.Notification;
import com.example.demo.model.queue.QueueTicket;
import com.example.demo.service.QueueService;
import com.example.demo.service.RealUserObserver;
import com.example.demo.service.notification.NotificationFactory;
import com.example.demo.service.strategy.WaitTimeStrategy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Service
public class QueueManagementFacade {

    private final QueueService queueService;
    private final NotificationFactory notificationFactory;
    private final Map<String, WaitTimeStrategy> strategies;

    @Autowired
    public QueueManagementFacade(QueueService queueService, 
                                 NotificationFactory notificationFactory, 
                                 Map<String, WaitTimeStrategy> strategies) {
        this.queueService = queueService;
        this.notificationFactory = notificationFactory;
        this.strategies = strategies;
    }

    public QueueTicket joinQueue(String userEmail, String serviceLocationType, String notificationPreference) {
        // 1. Determine wait time using Strategy Pattern
        WaitTimeStrategy strategy = strategies.getOrDefault(serviceLocationType.toLowerCase() + "WaitTimeStrategy", 
                                                            strategies.get("clinicWaitTimeStrategy"));
        int expectedWaitTime = strategy.calculateWaitTime(queueService.getPeopleAhead());

        // 2. Generate Number
        int queueNumberInt = queueService.getNextQueueNumber();
        String formattedNumber = serviceLocationType.substring(0, 1).toUpperCase() + "-" + String.format("%03d", queueNumberInt);

        // 3. Build Ticket using Builder Pattern
        QueueTicket ticket = new QueueTicket.Builder()
                .withTicketNumber(formattedNumber)
                .withServiceLocation(serviceLocationType)
                .withUserEmail(userEmail)
                .withEstimatedWaitTimeMinutes(expectedWaitTime)
                .withIssuedAt(LocalDateTime.now())
                .build();

        // 4. Register Observer
        queueService.registerObserver(new RealUserObserver(userEmail));

        // 5. Send Notification using Factory Pattern (and potentially Adapter)
        Notification notificationSender = notificationFactory.getNotification(notificationPreference.toUpperCase());
        notificationSender.send(userEmail, "You have joined the queue! Ticket: " + formattedNumber + ". Est Wait: " + expectedWaitTime + " mins");

        return ticket;
    }
    
    public void advanceQueue() {
        queueService.advanceQueue();
    }
}
