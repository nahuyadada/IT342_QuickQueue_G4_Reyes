package com.example.demo.service.adapter;

import org.springframework.stereotype.Service;

@Service
public class LegacySmsProvider {
    // A dummy legacy system method that we want to adapt
    public void dispatchShortMessageService(String phoneNumber, String textPayload) {
        System.out.println("[LEGACY SMS API] Dispatching to " + phoneNumber + " | Content: " + textPayload);
    }
}
