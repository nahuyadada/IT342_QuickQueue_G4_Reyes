package com.example.demo.service;

import com.example.demo.service.observer.QueueObserver;
import com.example.demo.service.observer.QueueSubject;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class QueueService implements QueueSubject {

    private final List<QueueObserver> observers = new ArrayList<>();
    private int currentQueueNumber = 0;
    private int totalPeopleInQueue = 0;

    public synchronized int getNextQueueNumber() {
        totalPeopleInQueue++;
        return ++currentQueueNumber;
    }

    public synchronized int getPeopleAhead() {
        return totalPeopleInQueue - 1; // Simplistic approach
    }

    public void advanceQueue() {
        if (totalPeopleInQueue > 0) {
            totalPeopleInQueue--;
            notifyObservers();
        }
    }

    @Override
    public void registerObserver(QueueObserver observer) {
        observers.add(observer);
    }

    @Override
    public void removeObserver(QueueObserver observer) {
        observers.remove(observer);
    }

    @Override
    public void notifyObservers() {
        for (QueueObserver observer : observers) {
            observer.update("The queue has advanced! People ahead of you: " + totalPeopleInQueue);
        }
    }
}
