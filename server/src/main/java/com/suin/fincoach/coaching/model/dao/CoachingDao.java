package com.suin.fincoach.coaching.model.dao;

import java.util.List;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.stereotype.Repository;

import com.suin.fincoach.coaching.model.vo.CoachingMessage;

@Repository
public class CoachingDao {

	// NUDGE / USER / COACH 행 삽입. MESSAGE_ID는 SEQ_COACHING.NEXTVAL, useGeneratedKeys로 messageId 채움.
	public int insertMessage(SqlSessionTemplate sqlSession, CoachingMessage message) {
		return sqlSession.insert("coachingMapper.insertMessage", message);
	}

	// 한 스레드의 모든 메시지를 MESSAGE_ID 순으로 조회
	public List<CoachingMessage> selectThread(SqlSessionTemplate sqlSession, int threadId) {
		return sqlSession.selectList("coachingMapper.selectThread", threadId);
	}

	// 사용자의 최근 NUDGE 행 (최신순)
	public List<CoachingMessage> selectRecentNudges(SqlSessionTemplate sqlSession, int userId) {
		return sqlSession.selectList("coachingMapper.selectRecentNudges", userId);
	}

	// NUDGE 행의 ACCEPTED 값 갱신
	public int updateAccepted(SqlSessionTemplate sqlSession, CoachingMessage message) {
		return sqlSession.update("coachingMapper.updateAccepted", message);
	}

}
