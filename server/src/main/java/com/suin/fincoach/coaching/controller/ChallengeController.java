package com.suin.fincoach.coaching.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.suin.fincoach.coaching.model.service.ChallengeService;
import com.suin.fincoach.coaching.model.service.GeminiCallBudget;
import com.suin.fincoach.coaching.model.vo.Challenge;

@RestController
@RequestMapping("/challenge")
@CrossOrigin
public class ChallengeController {

	@Autowired
	private ChallengeService service;

	@Autowired
	private GeminiCallBudget geminiCallBudget;

	@Value("${coaching.llm.enabled:false}")
	private boolean llmEnabled;

	@Value("${coaching.llm.daily-limit:50}")
	private int dailyLimit;

	// 챌린지 추출만 실제 Gemini를 호출하므로, 코칭 컨트롤러와 같은 카운터로 일일 캡을 공유한다.
	private ResponseEntity<?> dailyCapExceeded() {
		if (llmEnabled && geminiCallBudget.incrementAndGetTodayCalls() > dailyLimit) {
			return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
					.body(Map.of("message", "오늘의 AI 코칭 호출 한도(" + dailyLimit + "회)를 초과했습니다. 잠시 후 다시 시도해주세요."));
		}
		return null;
	}

	@PostMapping("/extract")
	public ResponseEntity<?> extract(@RequestBody Map<String, Object> body) {
		ResponseEntity<?> capped = dailyCapExceeded();
		if (capped != null) {
			return capped;
		}

		int threadId = toInt(body.get("threadId"));
		int userId = toInt(body.get("userId"));
		return ResponseEntity.ok(service.extractChallenge(threadId, userId));
	}

	@PostMapping
	public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
		int userId = toInt(body.get("userId"));
		Integer threadId = body.get("threadId") == null ? null : toInt(body.get("threadId"));
		String category = body.get("category") == null ? null : String.valueOf(body.get("category"));
		String title = body.get("title") == null ? null : String.valueOf(body.get("title"));
		String metricType = body.get("metricType") == null ? null : String.valueOf(body.get("metricType"));
		int targetValue = toInt(body.get("targetValue"));
		int periodDays = toInt(body.get("periodDays"));

		if (title == null || title.isBlank() || metricType == null || targetValue <= 0) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST)
					.body(Map.of("message", "챌린지 정보가 올바르지 않습니다."));
		}

		Challenge saved = service.createChallenge(userId, threadId, category, title, metricType, targetValue, periodDays);
		return ResponseEntity.ok(saved);
	}

	@GetMapping("/{userId}")
	public ResponseEntity<?> list(@PathVariable int userId) {
		return ResponseEntity.ok(service.getRecentChallenges(userId));
	}

	@DeleteMapping("/{challengeId}")
	public ResponseEntity<?> delete(@PathVariable int challengeId, @RequestParam int userId) {
		int result = service.deleteChallenge(challengeId, userId);
		if (result > 0) {
			return ResponseEntity.ok(Map.of("message", "챌린지를 삭제했습니다."));
		}
		return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "챌린지를 찾을 수 없습니다."));
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
