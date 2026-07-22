package com.suin.fincoach.coaching.model.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.suin.fincoach.coaching.model.dao.ChallengeDao;
import com.suin.fincoach.coaching.model.dao.CoachingDao;
import com.suin.fincoach.coaching.model.vo.Challenge;
import com.suin.fincoach.coaching.model.vo.CoachingMessage;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class ChallengeServiceImpl implements ChallengeService {

	@Autowired
	private ChallengeDao dao;

	@Autowired
	private CoachingDao coachingDao;

	@Autowired
	private SqlSessionTemplate sqlSession;

	@Autowired
	private GeminiClient geminiClient;

	// 이 기능은 자유 대화의 의미를 이해해야 해서 의미 있는 Mock 대체가 불가능하다 —
	// LLM이 꺼져 있으면 정직하게 "지금은 쓸 수 없다"고 알린다.
	@Value("${coaching.llm.enabled:false}")
	private boolean llmEnabled;

	private static final String CHALLENGE_EXTRACT_SYSTEM_PROMPT =
			"당신은 재무 코치와 사용자의 대화를 분석해 실행 가능한 챌린지(목표)를 추출하는 도우미입니다. "
			+ "대화에서 사용자가 실제로 동의하거나 하겠다고 말한 구체적이고 측정 가능한 목표가 있으면 추출하고, "
			+ "그런 목표가 분명하지 않으면 found를 false로만 응답하세요. metricType은 지출 금액을 줄이는 목표면 "
			+ "AMOUNT, 횟수를 줄이는 목표면 COUNT입니다. targetValue는 AMOUNT면 원 단위 최대 지출 금액, COUNT면 "
			+ "최대 허용 횟수입니다. periodDays는 목표 기간(일)이며, 대화에 기간이 명시되지 않았으면 7(1주일)로 "
			+ "하세요. title은 사람이 읽기 좋은 한 줄 요약(예: '배달 주 2회 이하로')입니다.";

	@Override
	public Map<String, Object> extractChallenge(int threadId, int userId) {
		List<CoachingMessage> history = coachingDao.selectThread(sqlSession, threadId);
		if (history == null || history.isEmpty()) {
			return Map.of("found", false);
		}

		if (!llmEnabled) {
			return Map.of("found", false, "reason", "LLM_DISABLED");
		}

		JSONArray contents = new JSONArray();
		for (CoachingMessage msg : history) {
			String role = "USER".equals(msg.getRole()) ? "user" : "model";
			contents.add(geminiClient.turn(role, msg.getContent()));
		}
		contents.add(geminiClient.userTurn("위 대화에서 실행 가능한 챌린지를 추출해줘."));

		JSONObject result = geminiClient.generateStructured(
				CHALLENGE_EXTRACT_SYSTEM_PROMPT, contents, challengeResponseSchema());
		if (result == null) {
			return Map.of("found", false, "reason", "EXTRACT_FAILED");
		}

		boolean found = Boolean.TRUE.equals(result.get("found"));
		if (!found) {
			return Map.of("found", false);
		}

		return Map.of(
				"found", true,
				"category", String.valueOf(result.getOrDefault("category", "")),
				"title", String.valueOf(result.getOrDefault("title", "")),
				"metricType", String.valueOf(result.getOrDefault("metricType", "AMOUNT")),
				"targetValue", toInt(result.get("targetValue")),
				"periodDays", toInt(result.getOrDefault("periodDays", 7L)));
	}

	@Override
	public Challenge createChallenge(int userId, Integer threadId, String category, String title,
			String metricType, int targetValue, int periodDays) {
		LocalDate start = LocalDate.now();
		LocalDate end = start.plusDays(Math.max(periodDays, 1) - 1L);

		Challenge challenge = Challenge.builder()
				.userId(userId)
				.threadId(threadId)
				.category(category)
				.title(title)
				.metricType(metricType)
				.targetValue(targetValue)
				.startDate(start)
				.endDate(end)
				.build();

		dao.insertChallenge(sqlSession, challenge);
		return challenge;
	}

	@Override
	public List<Challenge> getRecentChallenges(int userId) {
		return dao.selectRecentChallenges(sqlSession, userId);
	}

	@Override
	public int deleteChallenge(int challengeId, int userId) {
		return dao.deleteChallenge(sqlSession, challengeId, userId);
	}

	private JSONObject challengeResponseSchema() {
		JSONObject found = new JSONObject();
		found.put("type", "BOOLEAN");

		JSONObject category = new JSONObject();
		category.put("type", "STRING");

		JSONObject title = new JSONObject();
		title.put("type", "STRING");

		JSONObject metricType = new JSONObject();
		metricType.put("type", "STRING");
		JSONArray metricEnum = new JSONArray();
		metricEnum.add("AMOUNT");
		metricEnum.add("COUNT");
		metricType.put("enum", metricEnum);

		JSONObject targetValue = new JSONObject();
		targetValue.put("type", "INTEGER");

		JSONObject periodDays = new JSONObject();
		periodDays.put("type", "INTEGER");

		JSONObject properties = new JSONObject();
		properties.put("found", found);
		properties.put("category", category);
		properties.put("title", title);
		properties.put("metricType", metricType);
		properties.put("targetValue", targetValue);
		properties.put("periodDays", periodDays);

		JSONObject schema = new JSONObject();
		schema.put("type", "OBJECT");
		schema.put("properties", properties);
		JSONArray required = new JSONArray();
		required.add("found");
		schema.put("required", required);
		return schema;
	}

	private int toInt(Object value) {
		if (value instanceof Number) {
			return ((Number) value).intValue();
		}
		try {
			return Integer.parseInt(String.valueOf(value));
		} catch (Exception e) {
			return 0;
		}
	}

}
