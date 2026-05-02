package com.example.demo.repository;

import com.example.demo.model.ServiceOffice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceOfficeRepository extends JpaRepository<ServiceOffice, Long> {
    List<ServiceOffice> findByIsActiveTrue();
    List<ServiceOffice> findByIsActiveTrueAndApprovalStatus(ServiceOffice.ApprovalStatus approvalStatus);
    List<ServiceOffice> findByType(String type);
    List<ServiceOffice> findByApprovalStatusOrderByCreatedAtAsc(ServiceOffice.ApprovalStatus approvalStatus);
    boolean existsByNameIgnoreCaseAndAddressIgnoreCase(String name, String address);
}
