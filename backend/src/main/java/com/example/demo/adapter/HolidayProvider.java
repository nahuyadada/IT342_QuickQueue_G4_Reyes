package com.example.demo.adapter;

import java.util.List;

/**
 * Adapter Pattern (Structural) — Target Interface
 *
 * Defines a clean internal interface for fetching holiday data.
 * Any external holiday API (Abstract API, Calendarific, etc.)
 * must be adapted to this interface, keeping business logic
 * decoupled from third-party API specifics.
 */
public interface HolidayProvider {

    /**
     * Get holidays for a given country and year.
     *
     * @param countryCode ISO 3166-1 alpha-2 country code (e.g., "PH", "US")
     * @param year        The year to look up holidays for
     * @return List of holidays in the internal Holiday format
     */
    List<Holiday> getHolidays(String countryCode, int year);
}
