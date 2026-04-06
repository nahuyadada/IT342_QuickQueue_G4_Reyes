package com.example.demo.model.queue;

import java.time.LocalDateTime;

public class QueueTicket {
    private final String ticketNumber;
    private final String serviceLocation;
    private final String userEmail;
    private final int estimatedWaitTimeMinutes;
    private final LocalDateTime issuedAt;

    private QueueTicket(Builder builder) {
        this.ticketNumber = builder.ticketNumber;
        this.serviceLocation = builder.serviceLocation;
        this.userEmail = builder.userEmail;
        this.estimatedWaitTimeMinutes = builder.estimatedWaitTimeMinutes;
        this.issuedAt = builder.issuedAt;
    }

    public String getTicketNumber() { return ticketNumber; }
    public String getServiceLocation() { return serviceLocation; }
    public String getUserEmail() { return userEmail; }
    public int getEstimatedWaitTimeMinutes() { return estimatedWaitTimeMinutes; }
    public LocalDateTime getIssuedAt() { return issuedAt; }

    @Override
    public String toString() {
        return "QueueTicket{" +
                "ticketNumber='" + ticketNumber + '\'' +
                ", serviceLocation='" + serviceLocation + '\'' +
                ", estimatedWaitTime=" + estimatedWaitTimeMinutes + " min" +
                '}';
    }

    // Builder Pattern
    public static class Builder {
        private String ticketNumber;
        private String serviceLocation;
        private String userEmail;
        private int estimatedWaitTimeMinutes;
        private LocalDateTime issuedAt;

        public Builder withTicketNumber(String ticketNumber) {
            this.ticketNumber = ticketNumber;
            return this;
        }

        public Builder withServiceLocation(String serviceLocation) {
            this.serviceLocation = serviceLocation;
            return this;
        }

        public Builder withUserEmail(String userEmail) {
            this.userEmail = userEmail;
            return this;
        }

        public Builder withEstimatedWaitTimeMinutes(int waitTime) {
            this.estimatedWaitTimeMinutes = waitTime;
            return this;
        }

        public Builder withIssuedAt(LocalDateTime issuedAt) {
            this.issuedAt = issuedAt;
            return this;
        }

        public QueueTicket build() {
            return new QueueTicket(this);
        }
    }
}
