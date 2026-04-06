package com.example.demo.service.strategy;

import org.springframework.stereotype.Component;

@Component("bankWaitTimeStrategy")
public class BankWaitTimeStrategy implements WaitTimeStrategy {
    // Bank tellers are usually faster (e.g., 5 mins per person)
    @Override
    public int calculateWaitTime(int peopleAhead) {
        return peopleAhead * 5;
    }
}
