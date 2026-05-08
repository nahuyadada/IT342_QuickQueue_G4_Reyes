package com.example.demo.office.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Links a user to a service office as a staff member.
 * Staff members can manage queues and toggle the office open/close.
 */
@Entity
@Table(name = "office_staff",
       uniqueConstraints = @UniqueConstraint(columnNames = {"office_id", "user_id"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OfficeStaff {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "office_id", nullable = false)
    private Long officeId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    /** Display name of the staff member (denormalized for convenience) */
    @Column(nullable = false)
    private String userName;

    /** Email of the staff member (denormalized for convenience) */
    @Column(nullable = false)
    private String userEmail;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false)
    private StaffRole role = StaffRole.STAFF;

    @Builder.Default
    @Column(nullable = false, updatable = false)
    private LocalDateTime addedAt = LocalDateTime.now();

    public enum StaffRole {
        STAFF,
        MANAGER
    }
}
