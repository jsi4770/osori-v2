package com.suin.fincoach;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class FincoachApplication {

	public static void main(String[] args) {
		SpringApplication.run(FincoachApplication.class, args);
	}

}