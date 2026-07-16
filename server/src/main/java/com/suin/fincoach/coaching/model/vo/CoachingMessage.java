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
public class CoachingMessage {

	private int messageId;                  // PK (SEQ_COACHING)
	private int userId;                     // 사용자 id
	private int threadId;                   // NUDGE 행은 자기 자신의 messageId, 이후 대화는 그 값을 공유
	private String role;                    // 'NUDGE' | 'USER' | 'COACH'
	private String content;                 // 메시지 내용
	private String category;                // 소비 카테고리 (NUDGE 행에만 의미)
	private Integer originalAmount;         // 이상치가 감지된 지출액 (NUDGE 행)
	private Integer avgAmount;              // 해당 카테고리 평소 평균 (NUDGE 행)
	private String accepted;                // 'Y' | 'N' | null (NUDGE 행에만 의미)
	@JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
	private Timestamp createdAt;            // 생성 시각

}
