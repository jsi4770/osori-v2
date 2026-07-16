package com.suin.fincoach.coaching.model.service;

import java.util.List;

import com.suin.fincoach.coaching.model.vo.CoachingMessage;

public interface CoachingService {

	// 소비 이상치로부터 넛지 코칭 생성 + NUDGE 행 저장
	CoachingMessage generateNudge(int userId, String category, int amount, int avgAmount);

	// 스레드 히스토리를 이어 대화형 코칭 진행 + USER/COACH 행 저장, COACH 응답 반환
	CoachingMessage continueChat(int threadId, int userId, String userMessage);

	// 성장 리포트용 최근 넛지 목록 (수용 여부 포함)
	List<CoachingMessage> getGrowthReport(int userId);

	// 넛지 수용/거절 반영
	int respondToNudge(int messageId, boolean accepted);

}
