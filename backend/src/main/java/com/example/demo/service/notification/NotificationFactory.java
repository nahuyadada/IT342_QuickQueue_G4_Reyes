package com.example.demo.service.notification;

import com.example.demo.model.notification.Notification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class NotificationFactory {

    private final Map<String, Notification> notificationMap;

    @Autowired
    public NotificationFactory(List<Notification> notifications) {
        notificationMap = notifications.stream()
                .collect(Collectors.toMap(Notification::getType, notification -> notification));
    }

    public Notification getNotification(String type) {
        Notification notification = notificationMap.get(type);
        if (notification == null) {
            throw new IllegalArgumentException("Unknown notification type: " + type);
        }
        return notification;
    }
}
