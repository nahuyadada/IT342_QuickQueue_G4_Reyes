package com.example.demo.integration.controller;

import com.example.demo.integration.adapter.Holiday;
import com.example.demo.integration.adapter.HolidayProvider;
import com.example.demo.shared.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Integration controller for external API consumption.
 * Uses the Adapter Pattern — calls HolidayProvider interface,
 * which internally adapts the external API response format.
 *
 * SDD §5.2: GET /integration/holidays
 */
@RestController
@RequestMapping("/api/integration")
@RequiredArgsConstructor
public class IntegrationController {

    private final HolidayProvider holidayProvider;

    @GetMapping("/holidays")
    public ResponseEntity<ApiResponse<List<Holiday>>> getHolidays(
            @RequestParam(defaultValue = "PH") String country,
            @RequestParam(defaultValue = "2026") int year) {
        try {
            List<Holiday> holidays = holidayProvider.getHolidays(country, year);
            return ResponseEntity.ok(ApiResponse.success(holidays));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("SYSTEM-001", "Failed to fetch holidays: " + e.getMessage()));
        }
    }
}
