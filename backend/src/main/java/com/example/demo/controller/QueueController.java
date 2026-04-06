package com.example.demo.controller;

import com.example.demo.model.queue.QueueTicket;
import com.example.demo.service.facade.QueueManagementFacade;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/queue")
public class QueueController {

    private final QueueManagementFacade queueFacade;

    @Autowired
    public QueueController(QueueManagementFacade queueFacade) {
        this.queueFacade = queueFacade;
    }

    @PostMapping("/take")
    public ResponseEntity<QueueTicket> takeQueue(
            @RequestParam String email, 
            @RequestParam String locationType, 
            @RequestParam(defaultValue = "IN_APP") String notificationPref) {
        
        QueueTicket ticket = queueFacade.joinQueue(email, locationType, notificationPref);
        return ResponseEntity.ok(ticket);
    }
    
    @PostMapping("/advance")
    public ResponseEntity<String> advanceQueue() {
        queueFacade.advanceQueue();
        return ResponseEntity.ok("Queue advanced and observers notified.");
    }
}
