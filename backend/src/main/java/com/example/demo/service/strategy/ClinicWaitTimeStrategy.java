package com.example.demo.service.strategy;

import org.springframework.stereotype.Component;

@Component("clinicWaitTimeStrategy")
public class ClinicWaitTimeStrategy implements WaitTimeStrategy {
    // Doctors take longer per patient on average (e.g., 15 mins)
    @Override
    public int calculateWaitTime(int peopleAhead) {
        return peopleAhead * 15;
    }
}
