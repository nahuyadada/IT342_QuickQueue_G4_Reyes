package com.example.demo.office.repository;

import com.example.demo.office.model.OfficeStaff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OfficeStaffRepository extends JpaRepository<OfficeStaff, Long> {

    /** All staff for a given office. */
    List<OfficeStaff> findByOfficeIdOrderByAddedAtAsc(Long officeId);

    /** All offices a user is staff at. */
    List<OfficeStaff> findByUserIdOrderByAddedAtDesc(Long userId);

    /** Check if a user is already staff at an office. */
    boolean existsByOfficeIdAndUserId(Long officeId, Long userId);

    /** Find specific staff record. */
    Optional<OfficeStaff> findByOfficeIdAndUserId(Long officeId, Long userId);
}
