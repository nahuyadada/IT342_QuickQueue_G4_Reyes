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

    @Column(nullable = false)
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

    @Column(length = 1000)
    private String businessHours; // JSON or text format of hours

    @Column(length = 2000)
    private String photos; // comma-separated photo filenames or URLs

    // ── Verification documents ──

    @Column
    private String businessPermit; // filename of uploaded permit

    @Column
    private String dtiSecRegistration; // DTI/SEC registration document

    @Column
    private String utilityBill; // utility bill document

    @Column
    private String leaseAgreement; // lease agreement document

    @Column
    private String taxDocument; // tax document

    @Column(length = 1000)
    private String additionalNotes; // optional notes from applicant

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
