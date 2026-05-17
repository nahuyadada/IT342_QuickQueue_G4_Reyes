package com.example.demo;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootTest
public class DbUpdaterTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    public void updateCategories() {
        System.out.println("Updating database categories...");
        jdbcTemplate.update("UPDATE service_offices SET category = 'Government Office', type = 'Public Service' WHERE name = 'Quick Lube Auto'");
        jdbcTemplate.update("UPDATE service_offices SET name = 'City Hall', address = '1 City Hall Square' WHERE name = 'Quick Lube Auto'");

        jdbcTemplate.update("UPDATE service_offices SET category = 'Bank & Finance', type = 'Banking' WHERE name = 'Gourmet Burgers'");
        jdbcTemplate.update("UPDATE service_offices SET name = 'First National Bank', address = '100 Financial Way' WHERE name = 'Gourmet Burgers'");
        System.out.println("Database updated successfully.");
    }
}
