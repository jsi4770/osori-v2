package com.suin.fincoach.coaching.model.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// 홈 화면에서 한 번에 감지된 이상치 카테고리 하나(최대 3개까지 함께 종합 진단에 쓰인다).
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnomalyItem {
	private String category;
	private int originalAmount;
	private int avgAmount;
}
