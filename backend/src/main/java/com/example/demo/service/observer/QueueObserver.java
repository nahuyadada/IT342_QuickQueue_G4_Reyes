package com.example.demo.service.observer;

public interface QueueObserver {
    void update(String queueStatusMessage);
    String getObserverEmail();
}
