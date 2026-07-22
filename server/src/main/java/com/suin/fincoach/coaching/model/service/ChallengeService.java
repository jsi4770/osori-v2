package com.suin.fincoach.coaching.model.service;

import java.util.List;
import java.util.Map;

import com.suin.fincoach.coaching.model.vo.Challenge;

public interface ChallengeService {

	// 채팅 스레드의 대화 내용에서 실행 가능한 목표를 추출한다 (저장하지 않음 — 사용자가
	// 확인한 뒤 createChallenge로 실제 저장한다).
	Map<String, Object> extractChallenge(int threadId, int userId);

	// 사용자가 확인한 챌린지를 저장한다.
	Challenge createChallenge(int userId, Integer threadId, String category, String title,
			String metricType, int targetValue, int periodDays);

	// 진행 중이거나 어제 끝난 챌린지 목록 (최신순, 최대 5개)
	List<Challenge> getRecentChallenges(int userId);

	// 챌린지 취소/삭제
	int deleteChallenge(int challengeId, int userId);

}
