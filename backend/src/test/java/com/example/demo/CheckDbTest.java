package com.example.demo;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.List;
import java.util.Map;

@SpringBootTest
@org.junit.jupiter.api.Disabled("Runs against the configured (production) database — enable manually when needed")
public class CheckDbTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    public void checkOffices() {
        List<Map<String, Object>> offices = jdbcTemplate.queryForList("SELECT id, name, category, is_active, approval_status FROM service_offices");
        for (Map<String, Object> office : offices) {
            System.out.println("OFFICE: " + office);
        }
    }
}
