package com.suin.fincoach.fixedtrans.model.vo;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Builder
@Data
public class FixedTrans {

	private int fixedId; // 고정 지출 아이디
	private String name; // 고정 지출 사유
	@JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
	private LocalDate transDate; // 거래 날짜
	private int amount; // 고정 지출
	private String category; // 카테고리
	private int payDay; // 고정 지출 발생일
	private int userId; // 참조 회원 아이디
}
