package com.suin.fincoach.coaching.model.service;

import java.util.List;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.suin.fincoach.coaching.model.dao.CoachingDao;
import com.suin.fincoach.coaching.model.vo.CoachingMessage;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class CoachingServiceImpl implements CoachingService {

	@Autowired
	private CoachingDao dao;

	@Autowired
	private SqlSessionTemplate sqlSession;

	// Gemini는 무료 티어라도 호출 실패/한도 초과가 있을 수 있어, 꺼져 있거나 오류일 때는 Mock으로 우아하게 대체한다.
	@Value("${coaching.llm.enabled:false}")
	private boolean llmEnabled;

	@Value("${gemini.api.key:CHANGE_ME}")
	private String geminiApiKey;

	@Value("${gemini.model:gemini-2.5-flash}")
	private String geminiModel;

	private static final String GEMINI_URL =
			"https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s";

	private static final String NUDGE_SYSTEM_PROMPT =
			"당신은 이제 막 취업한 사회초년생을 위한 개인 재무 코치입니다. 다정하지만 직설적인 톤으로 말합니다. "
			+ "단순히 지출이 늘었다고 통보하지 말고, 왜 그런 소비가 생겼을지 맥락을 짚어주고 이번 주에 바로 실천할 수 있는 "
			+ "구체적이고 작은 대안을 하나 제안하세요. 잔소리나 죄책감을 주는 말투는 피하고 응원하는 느낌으로. "
			+ "모바일 넛지 카드에 들어갈 내용이므로 반드시 2~3문장, 한국어로만 답하세요.";

	private static final String CHAT_SYSTEM_PROMPT =
			"당신은 사회초년생을 위한 개인 재무 코치입니다. 방금 보낸 소비 넛지에서 이어지는 대화를 진행합니다. "
			+ "사용자의 목표(줄이고 싶은 카테고리, 저축 목표 등)를 파악하고, 한 번에 하나씩 질문하거나 함께 "
			+ "구체적이고 작은 실행 계획을 정하도록 돕습니다. 설교하지 말고, 사용자가 스스로 결정하도록 이끄세요. "
			+ "다정하지만 직설적으로, 2~4문장, 한국어로만 답하세요.";

	private final RestTemplate restTemplate = new RestTemplate();
	private final JSONParser jsonParser = new JSONParser();

	@Override
	public CoachingMessage generateNudge(int userId, String category, int amount, int avgAmount) {
		String content = null;
		if (llmEnabled) {
			JSONArray contents = new JSONArray();
			contents.add(userTurn(buildNudgePrompt(category, amount, avgAmount)));
			content = callGemini(NUDGE_SYSTEM_PROMPT, contents);
		}
		if (content == null) {
			content = mockNudge(category, amount, avgAmount);
		}

		CoachingMessage nudge = CoachingMessage.builder()
				.userId(userId)
				.threadId(0) // 0 → mapper가 SEQ_COACHING.CURRVAL(=자기 messageId)로 채움
				.role("NUDGE")
				.content(content)
				.category(category)
				.originalAmount(amount)
				.avgAmount(avgAmount)
				.build();

		dao.insertMessage(sqlSession, nudge);
		nudge.setThreadId(nudge.getMessageId()); // 반환 객체에도 self-thread 반영
		return nudge;
	}

	@Override
	public CoachingMessage continueChat(int threadId, int userId, String userMessage) {
		List<CoachingMessage> history = dao.selectThread(sqlSession, threadId);

		String reply = null;
		if (llmEnabled) {
			JSONArray contents = new JSONArray();
			for (CoachingMessage msg : history) {
				// NUDGE와 COACH는 model 턴, USER는 user 턴으로 매핑
				String geminiRole = "USER".equals(msg.getRole()) ? "user" : "model";
				contents.add(turn(geminiRole, msg.getContent()));
			}
			contents.add(userTurn(userMessage));
			reply = callGemini(CHAT_SYSTEM_PROMPT, contents);
		}
		if (reply == null) {
			reply = mockChatReply();
		}

		CoachingMessage userRow = CoachingMessage.builder()
				.userId(userId).threadId(threadId).role("USER").content(userMessage).build();
		dao.insertMessage(sqlSession, userRow);

		CoachingMessage coachRow = CoachingMessage.builder()
				.userId(userId).threadId(threadId).role("COACH").content(reply).build();
		dao.insertMessage(sqlSession, coachRow);

		return coachRow;
	}

	@Override
	public List<CoachingMessage> getGrowthReport(int userId) {
		return dao.selectRecentNudges(sqlSession, userId);
	}

	@Override
	public int respondToNudge(int messageId, boolean accepted) {
		CoachingMessage message = CoachingMessage.builder()
				.messageId(messageId)
				.accepted(accepted ? "Y" : "N")
				.build();
		return dao.updateAccepted(sqlSession, message);
	}

	// ---- Gemini ----

	private String callGemini(String systemPrompt, JSONArray contents) {
		try {
			JSONObject systemInstruction = new JSONObject();
			JSONArray sysParts = new JSONArray();
			sysParts.add(textPart(systemPrompt));
			systemInstruction.put("parts", sysParts);

			JSONObject body = new JSONObject();
			body.put("systemInstruction", systemInstruction);
			body.put("contents", contents);

			HttpHeaders headers = new HttpHeaders();
			headers.setContentType(MediaType.APPLICATION_JSON);
			HttpEntity<String> entity = new HttpEntity<>(body.toString(), headers);

			String url = String.format(GEMINI_URL, geminiModel, geminiApiKey);
			ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

			if (response.getStatusCode() == HttpStatus.OK) {
				return parseGeminiText(response.getBody());
			}
			log.warn("Gemini 응답 상태 이상: {}", response.getStatusCode());
		} catch (Exception e) {
			// 무료 티어 한도 초과/네트워크 오류 등 — Mock 대체를 위해 null 반환
			log.warn("Gemini 호출 실패, Mock 코칭으로 대체합니다: {}", e.getMessage());
		}
		return null;
	}

	private String parseGeminiText(String responseBody) {
		try {
			JSONObject root = (JSONObject) jsonParser.parse(responseBody);
			JSONArray candidates = (JSONArray) root.get("candidates");
			if (candidates == null || candidates.isEmpty()) {
				return null;
			}
			JSONObject content = (JSONObject) ((JSONObject) candidates.get(0)).get("content");
			if (content == null) {
				return null;
			}
			JSONArray parts = (JSONArray) content.get("parts");
			if (parts == null || parts.isEmpty()) {
				return null;
			}
			String text = (String) ((JSONObject) parts.get(0)).get("text");
			return (text == null || text.isBlank()) ? null : text.trim();
		} catch (Exception e) {
			log.warn("Gemini 응답 파싱 실패: {}", e.getMessage());
			return null;
		}
	}

	private JSONObject textPart(String text) {
		JSONObject part = new JSONObject();
		part.put("text", text);
		return part;
	}

	private JSONObject turn(String role, String text) {
		JSONObject turn = new JSONObject();
		turn.put("role", role);
		JSONArray parts = new JSONArray();
		parts.add(textPart(text));
		turn.put("parts", parts);
		return turn;
	}

	private JSONObject userTurn(String text) {
		return turn("user", text);
	}

	private String buildNudgePrompt(String category, int amount, int avgAmount) {
		String cat = (category == null || category.isBlank()) ? "이 카테고리" : category;
		return String.format(
				"사용자의 '%s' 지출이 %,d원으로, 평소 평균 %,d원보다 높게 감지됐어요. "
				+ "이 상황에 맞는 넛지 코칭 한마디를 건네주세요.",
				cat, amount, avgAmount);
	}

	// ---- Mock (비활성/오류/무료 티어 한도 초과 시 우아한 대체) ----

	private String mockNudge(String category, int amount, int avgAmount) {
		String cat = (category == null || category.isBlank()) ? "이번 소비" : category;
		if (avgAmount > 0 && amount > avgAmount) {
			int pct = (int) Math.round((amount - avgAmount) * 100.0 / avgAmount);
			return String.format(
					"이번 %s 지출이 %,d원으로 평소 평균(%,d원)보다 %d%% 많아요. "
					+ "다음 결제 전에 딱 한 번만 '이게 지금 꼭 필요한가?' 되물어보는 것부터 시작해볼까요? "
					+ "이번 주 목표를 같이 정해봐요.",
					cat, amount, avgAmount, pct);
		}
		return String.format(
				"이번 %s 지출은 %,d원이에요. 지금 페이스면 이번 달 예산 관리는 순조로워요. "
				+ "이 흐름을 유지할 작은 목표를 하나 같이 세워볼까요?",
				cat, amount);
	}

	private String mockChatReply() {
		return "좋아요, 그렇게 마음먹은 것만으로도 첫걸음이에요. "
				+ "이번 주에 딱 한 가지만 바꿔본다면 무엇부터 시작해볼까요? "
				+ "예를 들어 배달 앱을 주 2회로 줄이는 것처럼 작고 구체적인 목표가 오래 가요.";
	}

}
