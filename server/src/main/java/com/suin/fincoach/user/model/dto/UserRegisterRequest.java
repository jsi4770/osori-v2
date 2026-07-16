package com.suin.fincoach.user.model.dto;

import com.suin.fincoach.user.model.vo.User;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Builder
@Data
public class UserRegisterRequest {
	
	private User user;
	private String loginType;     
    private String providerUserId;

}
