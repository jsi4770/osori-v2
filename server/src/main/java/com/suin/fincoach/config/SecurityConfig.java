package com.suin.fincoach.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

//해당 클래스가 설정파일임을 알려주는 어노테이션
@Configuration
public class SecurityConfig {

	//등록하고자 하는 bean이있다면 @Bean 어노테이션 작성

	@Bean
	public BCryptPasswordEncoder bcrypt() {

		//해당 객체 생성하여 반환
		return new BCryptPasswordEncoder();
	}
}
	
	
	
