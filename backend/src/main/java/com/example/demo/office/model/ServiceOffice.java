package com.example.demo.office.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "service_offices")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceOffice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String address;

    @Column(nullable = false)
    private String type; // e.g., "CLINIC", "BANK", "GOVERNMENT"

    @Column
    private Long ownerUserId;

    @Column
    private Double latitude;

    @Column
    private Double longitude;

    // ── New registration fields ──

    @Column
    private String category; // restaurant, salon, repair shop, etc.

    @Column
    private String phoneNumber;

    @Column
    private String website; // optional: website or social media page

    @Column(columnDefinition = "TEXT")
    private String businessHours;

    @Column(columnDefinition = "TEXT")
    private String photos;

    // ── Verification documents ──

    @Column(columnDefinition = "TEXT")
    private String businessPermit;

    @Column(columnDefinition = "TEXT")
    private String dtiSecRegistration;

    @Column(columnDefinition = "TEXT")
    private String utilityBill;

    @Column(columnDefinition = "TEXT")
    private String leaseAgreement;

    @Column(columnDefinition = "TEXT")
    private String taxDocument;

    @Column(columnDefinition = "TEXT")
    private String additionalNotes;

    // ── Status fields ──

    @Builder.Default
    @Column(nullable = false)
    private boolean isActive = true;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false)
    private ApprovalStatus approvalStatus = ApprovalStatus.PENDING;

    @Builder.Default
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum ApprovalStatus {
        PENDING,
        APPROVED,
        REJECTED
    }
}
