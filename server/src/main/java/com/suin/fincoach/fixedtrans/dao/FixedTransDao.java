package com.suin.fincoach.fixedtrans.dao;

import java.util.ArrayList;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.stereotype.Repository;

import com.suin.fincoach.fixedtrans.model.dto.request.FixedTransCreateRequest;
import com.suin.fincoach.fixedtrans.model.dto.request.FixedTransUpdateRequest;
import com.suin.fincoach.fixedtrans.model.vo.FixedTrans;

@Repository
public class FixedTransDao {

	public int create(SqlSessionTemplate sqlSession, FixedTransCreateRequest req) {
		return sqlSession.insert("fixedTransMapper.create",req); 
	}

	public ArrayList<FixedTrans> getFixedList(SqlSessionTemplate sqlSession, int userId) {
		return (ArrayList) sqlSession.selectList("fixedTransMapper.getFixedList", userId); 
	}

	public int deleteFixedExpense(SqlSessionTemplate sqlSession, int fixedId) {
		return sqlSession.delete("fixedTransMapper.deleteFixedExpense", fixedId); 
	}

	public int updateFixedExpense(SqlSessionTemplate sqlSession, FixedTransUpdateRequest req) {
		return sqlSession.update("fixedTransMapper.updateFixedExpense", req); 
	}
	
}
