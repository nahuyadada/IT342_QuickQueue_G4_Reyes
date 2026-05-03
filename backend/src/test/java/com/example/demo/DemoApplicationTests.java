package com.example.demo;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
@Disabled("Requires full Spring context with database connection — run separately as integration test")
class DemoApplicationTests {

	@Test
	void contextLoads() {
	}

}
