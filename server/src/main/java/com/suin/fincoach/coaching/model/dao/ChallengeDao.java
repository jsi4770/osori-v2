package com.suin.fincoach.coaching.model.dao;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.stereotype.Repository;

import com.suin.fincoach.coaching.model.vo.Challenge;

@Repository
public class ChallengeDao {

	public int insertChallenge(SqlSessionTemplate sqlSession, Challenge challenge) {
		return sqlSession.insert("challengeMapper.insertChallenge", challenge);
	}

	// 진행 중이거나 어제 끝난(결과를 한 번은 보여주는) 챌린지까지 최신순으로 조회
	public List<Challenge> selectRecentChallenges(SqlSessionTemplate sqlSession, int userId) {
		return sqlSession.selectList("challengeMapper.selectRecentChallenges", userId);
	}

	public int deleteChallenge(SqlSessionTemplate sqlSession, int challengeId, int userId) {
		Map<String, Object> params = new HashMap<>();
		params.put("challengeId", challengeId);
		params.put("userId", userId);
		return sqlSession.delete("challengeMapper.deleteChallenge", params);
	}

}
