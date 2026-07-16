package com.suin.fincoach.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

//해당 클래스가 설정파일임을 알려주는 어노테이션 
@Configuration
public class SecurityConfig implements WebMvcConfigurer {
	
	//등록하고자 하는 bean이있다면 @Bean 어노테이션 작성
	
	@Bean
	public BCryptPasswordEncoder bcrypt() {
		
		//해당 객체 생성하여 반환 
		return new BCryptPasswordEncoder();
	}
	
	@Override
	public void addResourceHandlers(ResourceHandlerRegistry registry) {
	    String projectPath = System.getProperty("user.dir");

	    String location = "file:///" + projectPath.replace("\\", "/") + "/upload/profiles/";

	    registry.addResourceHandler("/upload/profiles/**")
	            .addResourceLocations(location);
	}
}
	
	
	
