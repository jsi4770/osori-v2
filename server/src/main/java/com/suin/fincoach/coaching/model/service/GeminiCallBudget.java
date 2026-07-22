package com.suin.fincoach.coaching.model.service;

import java.time.LocalDate;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.stereotype.Component;

// 실제 Gemini 호출이 일어나는 모든 엔드포인트(코칭/챌린지)가 공유하는 일일 호출 카운터.
// 구글의 무료 티어 한도는 API 키가 아니라 프로젝트+모델 단위라서, 컨트롤러마다 따로 세면
// 실제 한도를 반영하지 못하고 이중으로 카운트하는 셈이 된다. 그래서 하나의 빈으로 공유한다.
@Component
public class GeminiCallBudget {

	private final AtomicInteger callsToday = new AtomicInteger(0);
	private volatile LocalDate callsDate = LocalDate.now();

	public synchronized int incrementAndGetTodayCalls() {
		LocalDate today = LocalDate.now();
		if (!today.equals(callsDate)) {
			callsDate = today;
			callsToday.set(0);
		}
		return callsToday.incrementAndGet();
	}

}
