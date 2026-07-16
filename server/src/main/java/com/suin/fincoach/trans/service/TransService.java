package com.suin.fincoach.trans.service;

import java.util.List;

import com.suin.fincoach.trans.model.vo.Mytrans;

public interface TransService {

	public int myTransSave(Mytrans mt);
	public List<Mytrans> getMyTransactions(int userId);
	public int updateTrans(Mytrans mt);
	public int deleteTrans(int transId);
	public int mergeFixedToMyTrans();
	public List<Mytrans> recentTrans(int userId);

}
