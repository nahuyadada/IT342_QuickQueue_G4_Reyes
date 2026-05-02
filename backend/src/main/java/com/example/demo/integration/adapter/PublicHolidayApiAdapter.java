package com.example.demo.integration.adapter;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

/**
 * Adapter Pattern (Structural) — Concrete Adapter
 *
 * Adapts the external Nager.Date public holiday API response format
 * to our internal HolidayProvider interface. The external API returns
 * data in its own JSON structure; this adapter transforms it into
 * our internal Holiday records.
 *
 * If the external API changes or we switch providers, only this adapter
 * needs to be updated — business logic remains untouched.
 *
 * External API: https://date.nager.at/api/v3/PublicHolidays/{year}/{countryCode}
 * (Free, no API key required)
 */
@Component
public class PublicHolidayApiAdapter implements HolidayProvider {

    private static final Logger log = LoggerFactory.getLogger(PublicHolidayApiAdapter.class);
    private static final String NAGER_API_URL = "https://date.nager.at/api/v3/PublicHolidays";

    private final RestClient restClient = RestClient.create();

    @Override
    public List<Holiday> getHolidays(String countryCode, int year) {
        try {
            NagerHoliday[] externalHolidays = restClient.get()
                    .uri(NAGER_API_URL + "/{year}/{countryCode}", year, countryCode.toUpperCase())
                    .retrieve()
                    .body(NagerHoliday[].class);

            if (externalHolidays == null) {
                return Collections.emptyList();
            }

            // Adapt external format to internal Holiday records
            return java.util.Arrays.stream(externalHolidays)
                    .map(ext -> new Holiday(
                            ext.localName() != null ? ext.localName() : ext.name(),
                            LocalDate.parse(ext.date()),
                            ext.countryCode()
                    ))
                    .toList();

        } catch (Exception e) {
            log.error("Failed to fetch holidays from Nager.Date API: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * External API response format (Nager.Date).
     * This is the "Adaptee" — the incompatible interface we're adapting from.
     */
    private record NagerHoliday(
            String date,
            String localName,
            String name,
            String countryCode,
            boolean global,
            @JsonProperty("types") String[] types
    ) {
    }
}
