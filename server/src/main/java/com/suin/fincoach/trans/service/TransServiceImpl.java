package com.suin.fincoach.trans.service;

import java.util.List;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.suin.fincoach.trans.dao.TransDao;
import com.suin.fincoach.trans.model.vo.Mytrans;

@Service
public class TransServiceImpl implements TransService{

	@Autowired
	private TransDao dao;

	@Autowired
	private SqlSessionTemplate sqlSession;

	@Override
	public int myTransSave(Mytrans mt) {

		return dao.myTransSave(sqlSession,mt);

	}

	@Override
	public List<Mytrans> getMyTransactions(int userId) {
		return dao.selectMyTrans(sqlSession, userId);
	}

	@Override
	public int updateTrans(Mytrans mt) {

		return dao.updateTrans(sqlSession,mt);
	}

	@Override
	public int deleteTrans(int transId) {

		return dao.deleteTrans(sqlSession,transId);
	}

	// [추가] 고정지출 -> MYTRANS 자동반영 MERGE 실행
	@Override
	public int mergeFixedToMyTrans() {
	  return dao.mergeFixedToMyTrans(sqlSession);
	}

	@Override
	public List<Mytrans> recentTrans(int userId) {

		return dao.recentTrans(sqlSession,userId);
	}

}
