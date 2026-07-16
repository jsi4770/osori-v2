package com.suin.fincoach.trans.dao;

import java.util.List;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.stereotype.Repository;

import com.suin.fincoach.trans.model.vo.Mytrans;

@Repository
public class TransDao {

	public int myTransSave(SqlSessionTemplate sqlSession, Mytrans mt) {

		return sqlSession.insert("transMapper.myTransSave",mt);
	}

	public List<Mytrans> selectMyTrans(SqlSessionTemplate sqlSession, int userId) {
		return sqlSession.selectList("transMapper.selectMyTrans", userId);
	}

	public int updateTrans(SqlSessionTemplate sqlSession, Mytrans mt) {

		return sqlSession.update("transMapper.updateTrans",mt);
	}

	public int deleteTrans(SqlSessionTemplate sqlSession, int transId) {

		return sqlSession.delete("transMapper.deleteTrans",transId);
	}

	// [추가] 고정지출 -> MYTRANS 자동반영 MERGE 실행
	public int mergeFixedToMyTrans(SqlSessionTemplate sqlSession) {
		return sqlSession.insert("transMapper.mergeFixedToMyTrans");
	}

	public List<Mytrans> recentTrans(SqlSessionTemplate sqlSession, int userId) {

		return sqlSession.selectList("transMapper.recentTrans",userId);
	}

}
