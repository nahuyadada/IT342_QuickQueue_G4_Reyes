package com.example.demo.service.adapter;

import com.example.demo.model.notification.Notification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class ExternalSmsAdapter implements Notification {

    private final LegacySmsProvider legacySmsProvider;

    @Autowired
    public ExternalSmsAdapter(LegacySmsProvider legacySmsProvider) {
        this.legacySmsProvider = legacySmsProvider;
    }

    @Override
    public void send(String userEmailOrPhone, String message) {
        // Adapting the interface call from QuickQueue to the legacy format
        legacySmsProvider.dispatchShortMessageService(userEmailOrPhone, message);
    }

    @Override
    public String getType() {
        return "EXTERNAL_SMS";
    }
}
