package com.example.demo;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootTest
@org.junit.jupiter.api.Disabled("Runs against the configured (production) database — enable manually when needed")
public class DbUpdaterTest2 {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    public void updateCategories() {
        jdbcTemplate.update("UPDATE service_offices SET category = 'Medical Clinic' WHERE name = 'Downtown Clinic'");
        System.out.println("Downtown Clinic updated successfully.");
    }
}
