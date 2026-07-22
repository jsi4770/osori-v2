package com.suin.fincoach.coaching.model.dao;

import java.util.HashMap;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.stereotype.Repository;

import com.suin.fincoach.coaching.model.vo.SpendingTrend;

@Repository
public class TrendDao {

	// 같은 유저+연월 조합의 캐시된 분석이 있는지 조회
	public SpendingTrend selectTrend(SqlSessionTemplate sqlSession, int userId, String yearMonth) {
		Map<String, Object> params = new HashMap<>();
		params.put("userId", userId);
		params.put("yearMonth", yearMonth);
		return sqlSession.selectOne("trendMapper.selectTrend", params);
	}

	// 분석 결과 캐시 저장
	public int insertTrend(SqlSessionTemplate sqlSession, SpendingTrend trend) {
		return sqlSession.insert("trendMapper.insertTrend", trend);
	}

}
