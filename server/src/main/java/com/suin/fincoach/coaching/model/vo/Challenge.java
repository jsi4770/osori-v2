package com.suin.fincoach.coaching.model.vo;

import java.sql.Timestamp;
import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Challenge {

	private int challengeId;                // PK (SEQ_CHALLENGE)
	private int userId;                     // 사용자 id
	private Integer threadId;               // 이 챌린지를 만든 채팅 스레드 (참고용, 없을 수 있음)
	private String category;                // 대상 카테고리 (없으면 전체 지출 기준)
	private String title;                   // 사람이 읽을 목표 요약, e.g. "배달 주 2회 이하로"
	private String metricType;              // 'AMOUNT'(지출 금액) | 'COUNT'(거래 횟수)
	private int targetValue;                // AMOUNT면 원, COUNT면 횟수
	private LocalDate startDate;
	private LocalDate endDate;
	@JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
	private Timestamp createdAt;

}
