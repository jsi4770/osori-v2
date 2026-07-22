package com.suin.fincoach.coaching.model.service;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import lombok.extern.slf4j.Slf4j;

// Gemini generateContent 호출 공통 인프라. 대화형 코칭(자유 텍스트)과 챌린지 추출(구조화 JSON)이
// 함께 사용하므로, systemInstruction/contents 조립과 HTTP 호출/응답 파싱을 여기 한 곳에 모은다.
@Component
@Slf4j
public class GeminiClient {

	@Value("${gemini.api.key:CHANGE_ME}")
	private String geminiApiKey;

	@Value("${gemini.model:gemini-2.5-flash}")
	private String geminiModel;

	private static final String GEMINI_URL =
			"https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s";

	private final RestTemplate restTemplate = new RestTemplate();
	private final JSONParser jsonParser = new JSONParser();

	// 자유 텍스트 응답(넛지/채팅/트렌드 코칭 멘트 등)
	public String generateText(String systemPrompt, JSONArray contents) {
		String responseBody = call(systemPrompt, contents, null);
		return responseBody == null ? null : parseText(responseBody);
	}

	// 구조화된 JSON 응답(챌린지 추출 등) — responseSchema로 응답 형식을 강제한다.
	public JSONObject generateStructured(String systemPrompt, JSONArray contents, JSONObject responseSchema) {
		String responseBody = call(systemPrompt, contents, responseSchema);
		if (responseBody == null) {
			return null;
		}
		String text = parseText(responseBody);
		if (text == null) {
			return null;
		}
		try {
			return (JSONObject) jsonParser.parse(text);
		} catch (Exception e) {
			log.warn("Gemini 구조화 응답 파싱 실패: {}", e.getMessage());
			return null;
		}
	}

	private String call(String systemPrompt, JSONArray contents, JSONObject responseSchema) {
		try {
			JSONObject systemInstruction = new JSONObject();
			JSONArray sysParts = new JSONArray();
			sysParts.add(textPart(systemPrompt));
			systemInstruction.put("parts", sysParts);

			JSONObject body = new JSONObject();
			body.put("systemInstruction", systemInstruction);
			body.put("contents", contents);

			if (responseSchema != null) {
				JSONObject generationConfig = new JSONObject();
				generationConfig.put("responseMimeType", "application/json");
				generationConfig.put("responseSchema", responseSchema);
				body.put("generationConfig", generationConfig);
			}

			HttpHeaders headers = new HttpHeaders();
			headers.setContentType(MediaType.APPLICATION_JSON);
			HttpEntity<String> entity = new HttpEntity<>(body.toString(), headers);

			String url = String.format(GEMINI_URL, geminiModel, geminiApiKey);
			ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

			if (response.getStatusCode() == HttpStatus.OK) {
				return response.getBody();
			}
			log.warn("Gemini 응답 상태 이상: {}", response.getStatusCode());
		} catch (Exception e) {
			log.warn("Gemini 호출 실패: {}", e.getMessage());
		}
		return null;
	}

	private String parseText(String responseBody) {
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

	public JSONObject textPart(String text) {
		JSONObject part = new JSONObject();
		part.put("text", text);
		return part;
	}

	public JSONObject turn(String role, String text) {
		JSONObject turn = new JSONObject();
		turn.put("role", role);
		JSONArray parts = new JSONArray();
		parts.add(textPart(text));
		turn.put("parts", parts);
		return turn;
	}

	public JSONObject userTurn(String text) {
		return turn("user", text);
	}

}
