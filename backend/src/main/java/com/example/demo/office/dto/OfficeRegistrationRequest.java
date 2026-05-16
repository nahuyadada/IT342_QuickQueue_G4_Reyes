package com.example.demo.office.dto;

import lombok.Data;

@Data
public class OfficeRegistrationRequest {
    // Basic info
    private String name;
    private String address;
    private String type;
    private String category;
    private Double latitude;
    private Double longitude;

    // Contact info
    private String phoneNumber;
    private String website; // optional

    // Operations
    private String businessHours;

    // Media
    private String photos; // comma-separated filenames or base64 previews

    // Verification documents (filenames or references)
    private String businessPermit;
    private String dtiSecRegistration;
    private String utilityBill;
    private String leaseAgreement;
    private String taxDocument;

    // Optional
    private String additionalNotes;
}
