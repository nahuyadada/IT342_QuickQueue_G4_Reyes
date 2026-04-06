package com.example.demo.service;

import com.example.demo.service.observer.QueueObserver;
import org.springframework.stereotype.Component;

@Component
public class RealUserObserver implements QueueObserver {
    private String email;

    public RealUserObserver(String email) {
        this.email = email;
    }

    @Override
    public void update(String queueStatusMessage) {
        System.out.println("User " + email + " received queue update: " + queueStatusMessage);
    }

    @Override
    public String getObserverEmail() {
        return email;
    }
}
