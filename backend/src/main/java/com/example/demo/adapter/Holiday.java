package com.example.demo.adapter;

import java.time.LocalDate;

/**
 * Internal holiday data model used throughout the application.
 * Decoupled from any external API response format.
 */
public record Holiday(
        String name,
        LocalDate date,
        String countryCode
) {
}
