package com.example.demo.office.repository;

import com.example.demo.office.model.ServiceOffice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceOfficeRepository extends JpaRepository<ServiceOffice, Long> {
    List<ServiceOffice> findByIsActiveTrue();
    List<ServiceOffice> findByIsActiveTrueAndApprovalStatus(ServiceOffice.ApprovalStatus approvalStatus);
    List<ServiceOffice> findByType(String type);
    List<ServiceOffice> findByApprovalStatusOrderByCreatedAtAsc(ServiceOffice.ApprovalStatus approvalStatus);
    List<ServiceOffice> findByOwnerUserIdOrderByCreatedAtDesc(Long ownerUserId);
    boolean existsByNameIgnoreCaseAndAddressIgnoreCase(String name, String address);
    List<ServiceOffice> findByApprovalStatusOrderByNameAsc(ServiceOffice.ApprovalStatus approvalStatus);
}
