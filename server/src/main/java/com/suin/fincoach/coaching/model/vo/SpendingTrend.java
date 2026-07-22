package com.suin.fincoach.coaching.model.vo;

import java.sql.Timestamp;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SpendingTrend {

	private int trendId;                    // PK (SEQ_TREND)
	private int userId;                     // 사용자 id
	private String yearMonth;               // 캐시 키 (yyyy-MM) — 이 달에 이미 분석이 있으면 재사용
	private String content;                 // 분석 문구
	@JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
	private Timestamp createdAt;             // 생성 시각

}
