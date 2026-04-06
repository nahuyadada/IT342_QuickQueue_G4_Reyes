package com.example.demo.model.notification;

import org.springframework.stereotype.Component;

@Component
public class InAppNotification implements Notification {

    @Override
    public void send(String userEmail, String message) {
        System.out.println("[IN-APP NOTIFICATION] Sent to " + userEmail + ": " + message);
        // Implementation for websocket/push notification
    }

    @Override
    public String getType() {
        return "IN_APP";
    }
}
