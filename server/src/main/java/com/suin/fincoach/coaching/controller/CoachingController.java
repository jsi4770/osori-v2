package com.suin.fincoach.coaching.controller;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.suin.fincoach.coaching.model.service.CoachingService;
import com.suin.fincoach.coaching.model.service.GeminiCallBudget;
import com.suin.fincoach.coaching.model.vo.AnomalyItem;
import com.suin.fincoach.coaching.model.vo.CoachingMessage;
import com.suin.fincoach.coaching.model.vo.SpendingTrend;

@RestController
@RequestMapping("/coaching")
@CrossOrigin
public class CoachingController {

	@Autowired
	private CoachingService service;

	@Autowired
	private GeminiCallBudget geminiCallBudget;

	// Gemini는 무료 티어라도 호출량이 있으므로, 안전 캡을 넘기면 실제 호출을 막고 429를 돌려준다.
	@Value("${coaching.llm.enabled:false}")
	private boolean llmEnabled;

	@Value("${coaching.llm.daily-limit:50}")
	private int dailyLimit;

	// 실제 Gemini 호출이 일어나는 엔드포인트에만 일일 안전 캡 적용 (LLM이 켜져 있을 때만 카운트).
	// 카운터는 챌린지 컨트롤러와 공유(GeminiCallBudget) — 구글 할당량이 프로젝트+모델 단위라서다.
	private ResponseEntity<?> dailyCapExceeded() {
		if (llmEnabled && geminiCallBudget.incrementAndGetTodayCalls() > dailyLimit) {
			return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
					.body(Map.of("message", "오늘의 AI 코칭 호출 한도(" + dailyLimit + "회)를 초과했습니다. 잠시 후 다시 시도해주세요."));
		}
		return null;
	}

	@PostMapping("/nudge")
	public ResponseEntity<?> nudge(@RequestBody Map<String, Object> body) {
		ResponseEntity<?> capped = dailyCapExceeded();
		if (capped != null) {
			return capped;
		}

		int userId = toInt(body.get("userId"));
		String category = body.get("category") == null ? null : String.valueOf(body.get("category"));
		int originalAmount = toInt(body.get("originalAmount"));
		int avgAmount = toInt(body.get("avgAmount"));

		CoachingMessage result = service.generateNudge(userId, category, originalAmount, avgAmount);
		return ResponseEntity.ok(result);
	}

	@PostMapping("/nudge/composite")
	public ResponseEntity<?> compositeNudge(@RequestBody Map<String, Object> body) {
		ResponseEntity<?> capped = dailyCapExceeded();
		if (capped != null) {
			return capped;
		}

		int userId = toInt(body.get("userId"));

		@SuppressWarnings("unchecked")
		List<Map<String, Object>> rawAnomalies = (List<Map<String, Object>>) body.get("anomalies");
		if (rawAnomalies == null || rawAnomalies.isEmpty()) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST)
					.body(Map.of("message", "진단할 이상치 정보가 없습니다."));
		}

		List<AnomalyItem> anomalies = rawAnomalies.stream()
				.map(m -> new AnomalyItem(
						String.valueOf(m.get("category")),
						toInt(m.get("originalAmount")),
						toInt(m.get("avgAmount"))))
				.collect(Collectors.toList());

		CoachingMessage result = service.generateCompositeNudge(userId, anomalies);
		return ResponseEntity.ok(result);
	}

	@PostMapping("/chat")
	public ResponseEntity<?> chat(@RequestBody Map<String, Object> body) {
		ResponseEntity<?> capped = dailyCapExceeded();
		if (capped != null) {
			return capped;
		}

		int threadId = toInt(body.get("threadId"));
		int userId = toInt(body.get("userId"));
		String message = body.get("message") == null ? null : String.valueOf(body.get("message"));

		if (message == null || message.isBlank()) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST)
					.body(Map.of("message", "메시지 내용이 비어 있습니다."));
		}

		CoachingMessage result = service.continueChat(threadId, userId, message);
		return ResponseEntity.ok(result);
	}

	@GetMapping("/report/{userId}")
	public ResponseEntity<?> report(@PathVariable int userId) {
		return ResponseEntity.ok(service.getGrowthReport(userId));
	}

	@PostMapping("/trend")
	public ResponseEntity<?> trend(@RequestBody Map<String, Object> body) {
		int userId = toInt(body.get("userId"));
		String yearMonth = body.get("yearMonth") == null ? null : String.valueOf(body.get("yearMonth"));

		@SuppressWarnings("unchecked")
		List<Map<String, Object>> monthlyTotals = (List<Map<String, Object>>) body.get("monthlyTotals");
		if (monthlyTotals == null) {
			monthlyTotals = List.of();
		}

		// 캐시에 이미 있으면 Gemini를 호출하지 않으므로, 이 경우엔 일일 호출 캡을 소모시키지 않는다.
		if (service.peekCachedTrend(userId, yearMonth) == null) {
			ResponseEntity<?> capped = dailyCapExceeded();
			if (capped != null) {
				return capped;
			}
		}

		SpendingTrend result = service.getSpendingTrend(userId, yearMonth, monthlyTotals);
		return ResponseEntity.ok(result);
	}

	private int toInt(Object value) {
		if (value == null) {
			return 0;
		}
		if (value instanceof Number) {
			return ((Number) value).intValue();
		}
		try {
			return Integer.parseInt(String.valueOf(value).trim());
		} catch (NumberFormatException e) {
			return 0;
		}
	}

}
