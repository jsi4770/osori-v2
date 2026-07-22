package com.suin.fincoach.coaching.model.service;

import java.util.List;
import java.util.Map;

import com.suin.fincoach.coaching.model.vo.CoachingMessage;
import com.suin.fincoach.coaching.model.vo.SpendingTrend;

public interface CoachingService {

	// 소비 이상치로부터 넛지 코칭 생성 + NUDGE 행 저장
	CoachingMessage generateNudge(int userId, String category, int amount, int avgAmount);

	// 스레드 히스토리를 이어 대화형 코칭 진행 + USER/COACH 행 저장, COACH 응답 반환
	CoachingMessage continueChat(int threadId, int userId, String userMessage);

	// 성장 리포트용 최근 넛지 목록 (수용 여부 포함)
	List<CoachingMessage> getGrowthReport(int userId);

	// 넛지 수용/거절 반영
	int respondToNudge(int messageId, boolean accepted);

	// 월별 카테고리 지출 데이터를 바탕으로 거시적 소비 흐름(2개월+) 또는 이번 달 소비 구성(1개월) 분석.
	// (userId, yearMonth) 단위로 캐싱되어 같은 달에는 다시 호출해도 Gemini를 재호출하지 않는다.
	SpendingTrend getSpendingTrend(int userId, String yearMonth, List<Map<String, Object>> monthlyTotals);

	// 캐시된 분석만 가벼운 조회 (Gemini 호출 없음). 컨트롤러가 캐시 히트 시 일일 캡을 소모하지 않도록 하기 위함.
	SpendingTrend peekCachedTrend(int userId, String yearMonth);

}
