package com.example.demo.service.observer;

public interface QueueSubject {
    void registerObserver(QueueObserver observer);
    void removeObserver(QueueObserver observer);
    void notifyObservers();
}
