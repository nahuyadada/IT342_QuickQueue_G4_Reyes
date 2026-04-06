package com.example.demo.model.notification;

public interface Notification {
    void send(String userEmail, String message);
    String getType();
}
