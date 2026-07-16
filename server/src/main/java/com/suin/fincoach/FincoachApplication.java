package com.suin.fincoach;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@EnableScheduling
@SpringBootApplication
public class FincoachApplication {

	public static void main(String[] args) {
		
		// 해시 한 번 뽑고 콘솔 복사하기
	    System.out.println("bcrypt(1234) = " + new BCryptPasswordEncoder().encode("1234"));
		
		SpringApplication.run(FincoachApplication.class, args);
		
		
	}

}