package com.example.demo.model.notification;

import org.springframework.stereotype.Component;

@Component
public class SmsNotification implements Notification {

    @Override
    public void send(String phoneOrEmail, String message) {
        System.out.println("[SMS NOTIFICATION] Sent to " + phoneOrEmail + ": " + message);
        // Standard SMS logic
    }

    @Override
    public String getType() {
        return "SMS";
    }
}
