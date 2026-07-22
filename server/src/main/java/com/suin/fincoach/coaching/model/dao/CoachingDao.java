package com.suin.fincoach.coaching.model.dao;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.stereotype.Repository;

import com.suin.fincoach.coaching.model.vo.CoachingMessage;

@Repository
public class CoachingDao {

	// NUDGE / USER / COACH 행 삽입. MESSAGE_ID는 SEQ_COACHING.NEXTVAL, useGeneratedKeys로 messageId 채움.
	public int insertMessage(SqlSessionTemplate sqlSession, CoachingMessage message) {
		return sqlSession.insert("coachingMapper.insertMessage", message);
	}

	// 오늘 이미 같은 카테고리+금액의 NUDGE가 있는지 조회 (중복 삽입 방지용)
	public CoachingMessage selectTodayNudge(SqlSessionTemplate sqlSession, int userId, String category, int originalAmount) {
		Map<String, Object> params = new HashMap<>();
		params.put("userId", userId);
		params.put("category", category);
		params.put("originalAmount", originalAmount);
		return sqlSession.selectOne("coachingMapper.selectTodayNudge", params);
	}

	// 오늘 이미 같은 카테고리 조합(정렬 후 join)으로 만든 종합 NUDGE가 있는지 조회
	public CoachingMessage selectTodayCompositeNudge(SqlSessionTemplate sqlSession, int userId, String categoryKey) {
		Map<String, Object> params = new HashMap<>();
		params.put("userId", userId);
		params.put("categoryKey", categoryKey);
		return sqlSession.selectOne("coachingMapper.selectTodayCompositeNudge", params);
	}

	// 한 스레드의 모든 메시지를 MESSAGE_ID 순으로 조회
	public List<CoachingMessage> selectThread(SqlSessionTemplate sqlSession, int threadId) {
		return sqlSession.selectList("coachingMapper.selectThread", threadId);
	}

	// 사용자의 최근 NUDGE 행 (최신순)
	public List<CoachingMessage> selectRecentNudges(SqlSessionTemplate sqlSession, int userId) {
		return sqlSession.selectList("coachingMapper.selectRecentNudges", userId);
	}

}
