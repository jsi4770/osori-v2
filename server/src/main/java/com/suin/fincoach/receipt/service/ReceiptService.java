package com.suin.fincoach.receipt.service;

import java.net.URI;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import com.suin.fincoach.receipt.model.vo.ReceiptDTO;

@Service
public class ReceiptService {

    @Value("${naver.ocr.invoke-url}")
    private String clovaOcrUrl;

    @Value("${naver.ocr.secret}")
    private String clovaOcrSecret;

    @Value("${kakao.rest-api-key}")
    private String kakaoRestApiKey;

    private static final int STORE_NAME_SEARCH_LIMIT = 15;
    private static final int STORE_NAME_MAX_LENGTH = 20;
    private static final String DEFAULT_CATEGORY = "기타";

    private static final String[] EXCLUDED_KEYWORDS = {
        "주문", "결제", "승인", "영수증", "매출", "표", "전표",
        "TEL", "전화", "FAX", "팩스", "일시", "금액", "합계", "No.",
        "팜페이", "Pharm", "Pay", "KICC", "NICE", "나이스", "체크", "카드",
        "페이", "카카오페이", "네이버페이", "토스페이", "삼성페이", "Payment",
        "신용", "현금", "할부", "가맹번호", "사업자번호", "매장", "가맹"
    };

    private static final String[] EXCLUDED_SINGLE_WORDS = {
        "CO", "LTD", "INC", "(주)", "(유)", "주식회사"
    };

    private static final String[] ADDRESS_KEYWORDS = {
        "주소", "번지", "도", "시", "구", "동", "로", "길",
        "서울", "경기", "인천", "부산", "대구", "광주", "대전",
        "울산", "세종", "층", "호"
    };

    private static final Map<String, String> MANUAL_CATEGORY_MAP = new HashMap<>();
    private static final Map<String, String> BRAND_EXPANSION_MAP = new HashMap<>();
    private static final Map<String, String> KEYWORD_CATEGORY_MAP = new HashMap<>();
    private static final Map<String, String> ENGLISH_TO_KOREAN_MAP = new HashMap<>();
    private static final Map<String, String> FAMOUS_BRAND_MAP = new HashMap<>();

    static {
        FAMOUS_BRAND_MAP.put("현대백화점", "현대백화점");
        FAMOUS_BRAND_MAP.put("이마트", "이마트");
        FAMOUS_BRAND_MAP.put("코스트코", "코스트코");
        FAMOUS_BRAND_MAP.put("스타벅스", "스타벅스");
        FAMOUS_BRAND_MAP.put("투썸", "투썸플레이스");
        FAMOUS_BRAND_MAP.put("다이소", "다이소");
        FAMOUS_BRAND_MAP.put("올리브영", "올리브영");
        FAMOUS_BRAND_MAP.put("롯데백화점", "롯데백화점");
        FAMOUS_BRAND_MAP.put("신세계백화점", "신세계백화점");
        FAMOUS_BRAND_MAP.put("홈플러스", "홈플러스");
        FAMOUS_BRAND_MAP.put("CU", "CU");
        FAMOUS_BRAND_MAP.put("GS25", "GS25");
        FAMOUS_BRAND_MAP.put("세븐일레븐", "세븐일레븐");

        ENGLISH_TO_KOREAN_MAP.put("THEHYUNDAI", "현대백화점");
        ENGLISH_TO_KOREAN_MAP.put("HYUNDAI", "현대백화점");
        ENGLISH_TO_KOREAN_MAP.put("COSTCO", "코스트코");
        ENGLISH_TO_KOREAN_MAP.put("EMART", "이마트");
        ENGLISH_TO_KOREAN_MAP.put("STARBUCKS", "스타벅스");

        KEYWORD_CATEGORY_MAP.put("카페", "카페");
        KEYWORD_CATEGORY_MAP.put("커피", "카페");
        KEYWORD_CATEGORY_MAP.put("약국", "약국");
        KEYWORD_CATEGORY_MAP.put("병원", "병원");
        KEYWORD_CATEGORY_MAP.put("의원", "병원");
        KEYWORD_CATEGORY_MAP.put("한의원", "병원");
        KEYWORD_CATEGORY_MAP.put("내과", "병원");
        KEYWORD_CATEGORY_MAP.put("외과", "병원");
        KEYWORD_CATEGORY_MAP.put("베이커리", "베이커리");
        KEYWORD_CATEGORY_MAP.put("빵", "베이커리");
        KEYWORD_CATEGORY_MAP.put("백화점", "백화점");
        KEYWORD_CATEGORY_MAP.put("마트", "마트");
        KEYWORD_CATEGORY_MAP.put("슈퍼", "마트");
        KEYWORD_CATEGORY_MAP.put("편의점", "편의점");
        KEYWORD_CATEGORY_MAP.put("헤어", "미용실");
        KEYWORD_CATEGORY_MAP.put("주유소", "주유소");
        KEYWORD_CATEGORY_MAP.put("서점", "서점");
        KEYWORD_CATEGORY_MAP.put("식당", "음식점");

        MANUAL_CATEGORY_MAP.put("스타벅스", "카페");
        MANUAL_CATEGORY_MAP.put("투썸", "카페");
        MANUAL_CATEGORY_MAP.put("현대백화점", "백화점");
        MANUAL_CATEGORY_MAP.put("이마트", "마트");

        BRAND_EXPANSION_MAP.put("농협", "NH농협은행");
        BRAND_EXPANSION_MAP.put("국민", "KB국민은행");
        BRAND_EXPANSION_MAP.put("신한", "신한은행");
        BRAND_EXPANSION_MAP.put("우리", "우리은행");
    }

    private final RestTemplate restTemplate = new RestTemplate();
    private final JSONParser jsonParser = new JSONParser();

    public ReceiptDTO processReceipt(MultipartFile file) {
        try {

            String base64Image = Base64.getEncoder().encodeToString(file.getBytes());

            JSONObject jsonBody = new JSONObject();
            jsonBody.put("version", "V2");
            jsonBody.put("requestId", "project-req-" + System.currentTimeMillis());
            jsonBody.put("timestamp", System.currentTimeMillis());

            JSONObject image = new JSONObject();
            image.put("format", "jpg");
            image.put("name", "receipt_scan");
            image.put("data", base64Image);

            JSONArray images = new JSONArray();
            images.add(image);
            jsonBody.put("images", images);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-OCR-SECRET", clovaOcrSecret);

            HttpEntity<String> entity = new HttpEntity<>(jsonBody.toString(), headers);
            ResponseEntity<String> response = restTemplate.postForEntity(clovaOcrUrl, entity, String.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                JSONObject ocrJson = (JSONObject) jsonParser.parse(response.getBody());
                JSONArray imagesArr = (JSONArray) ocrJson.get("images");

                if (imagesArr != null && !imagesArr.isEmpty()) {
                    JSONObject imageObj = (JSONObject) imagesArr.get(0);
                    JSONArray fields = (JSONArray) imageObj.get("fields");

                    if (fields != null) {
                        // 1. 가게명 추출
                        String storeName = extractStoreName(fields);

                        // 2. 날짜 추출
                        String transDate = extractDate(fields);

                        // 3. 금액 추출
                        String amount = extractTotalPrice(fields);

                        // 4. 상세 카테고리
                        String detailedCategory = getStoreCategory(storeName);

                        // 5. 최종 카테고리
                        String category = getFormattedCategory(detailedCategory);

                        return new ReceiptDTO(storeName, transDate, amount, category);
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null; // 실패 시 null 반환
    }

    private String extractDate(JSONArray fields) {
        Pattern standardPattern = Pattern.compile("20\\d{2}[-./년\\s]+(0?[1-9]|1[0-2])[-./月월\\s]+(0?[1-9]|[12]\\d|3[01])");

        Pattern loosePattern = Pattern.compile("20\\d{2}\\s+\\d{1,2}\\s+\\d{1,2}");

        for (int i = 0; i < fields.size(); i++) {
            JSONObject field = (JSONObject) fields.get(i);
            String text = (String) field.get("inferText");
            
            if (text != null) {
                Matcher matcher = standardPattern.matcher(text);
                if (matcher.find()) {
                    String rawDate = matcher.group();
                    return formatDateString(rawDate);
                }

                Matcher looseMatcher = loosePattern.matcher(text);
                if (looseMatcher.find()) {
                    String rawDate = looseMatcher.group();
                    return formatDateString(rawDate);
                }
            }
        }
        return null; 
    }
    

    private String formatDateString(String rawDate) {
        String numbers = rawDate.replaceAll("[^0-9]", "");
        if (numbers.length() >= 8) {
            return numbers.substring(0, 4) + "-" + 
                   numbers.substring(4, 6) + "-" + 
                   numbers.substring(6, 8);
        }
        return rawDate; // 변환 실패시 원본 반환
    }

    private String extractStoreName(JSONArray fields) {
        String storeName = "";
        String candidateName = "";
        
        for (int i = 0; i < Math.min(fields.size(), STORE_NAME_SEARCH_LIMIT); i++) {
            JSONObject field = (JSONObject) fields.get(i);
            String text = (String) field.get("inferText");
            if (text == null) continue;
            for (Map.Entry<String, String> entry : FAMOUS_BRAND_MAP.entrySet()) {
                if (text.contains(entry.getKey())) {
                    return entry.getValue();
                }
            }
        }

        for (int i = 0; i < Math.min(fields.size(), STORE_NAME_SEARCH_LIMIT); i++) {
            JSONObject field = (JSONObject) fields.get(i);
            String text = (String) field.get("inferText");

            if (shouldSkipText(text) || containsAddressKeyword(text)) continue;

            if (text.trim().equalsIgnoreCase("THE")) {
                if (i + 1 < fields.size()) {
                    String nextText = (String) ((JSONObject) fields.get(i + 1)).get("inferText");
                    String combined = (text + nextText).replaceAll("\\s+", "").toUpperCase();
                    if (ENGLISH_TO_KOREAN_MAP.containsKey(combined)) return ENGLISH_TO_KOREAN_MAP.get(combined);
                    if (!shouldSkipText(nextText) && !containsAddressKeyword(nextText)) {
                        storeName = text + " " + nextText;
                        return cleanStoreName(storeName);
                    }
                }
                continue;
            }

            if (text.contains("카페") || text.contains("커피")) {
                return cleanStoreName(text);
            }

            boolean hasKeyword = false;
            for (String key : KEYWORD_CATEGORY_MAP.keySet()) {
                if (text.contains(key)) {
                    hasKeyword = true;
                    break;
                }
            }

            if (hasKeyword) {
                storeName = text;
                return cleanStoreName(storeName);
            }

            if (candidateName.isEmpty()) {
                candidateName = text;
            }
        }

        if (!candidateName.isEmpty()) {
            storeName = candidateName;
        } else if (fields.size() > 0) {
            storeName = (String) ((JSONObject) fields.get(0)).get("inferText");
        }
        return cleanStoreName(storeName);
    }

    private boolean shouldSkipText(String text) {
        if (text == null) return true;
        for (String keyword : EXCLUDED_KEYWORDS) {
            if (text.contains(keyword)) return true;
        }
        String trimmed = text.trim();
        for (String word : EXCLUDED_SINGLE_WORDS) {
            if (trimmed.equalsIgnoreCase(word)) return true;
        }
        if (text.matches(".*\\d{2,4}-\\d{3,4}-\\d{4}.*")) return true;
        if (text.matches(".*\\d{3}-\\d{2}-\\d{5}.*")) return true;
        if (text.startsWith("#")) return true;
        if (trimmed.length() == 1) return true;
        return false;
    }

    private boolean containsAddressKeyword(String text) {
        if (text == null) return false;
        for (String keyword : ADDRESS_KEYWORDS) {
            if (text.contains(keyword)) return true;
        }
        return false;
    }

    private String cleanStoreName(String storeName) {
        if (storeName == null || storeName.isEmpty()) return "";
        String normalized = storeName.replaceAll("\\s+", "").toUpperCase();
        if (ENGLISH_TO_KOREAN_MAP.containsKey(normalized)) {
            return ENGLISH_TO_KOREAN_MAP.get(normalized);
        }
        storeName = storeName.replaceAll("가맹점명", "").replaceAll("가맹점", "").replaceAll("가맹", "").replaceAll("상호명", "").replaceAll("상호", "").replaceAll("대표자", "").replaceAll("대표", "").replaceAll("사업자", "").trim();
        if (storeName.contains(":")) {
            String[] parts = storeName.split(":");
            if (parts.length > 1) storeName = parts[1].trim();
        }
        if (storeName.contains("/")) storeName = storeName.split("/")[0].trim();
        storeName = storeName.replaceAll("\\([^)]*\\)", "").trim();
        storeName = storeName.replaceAll("[^가-힣a-zA-Z0-9\\s]", "");
        return storeName.trim();
    }

    private String extractTotalPrice(JSONArray fields) {
        String amount = "0";
        for (int i = 0; i < fields.size(); i++) {
            JSONObject field = (JSONObject) fields.get(i);
            String text = (String) field.get("inferText");
            if (text != null && text.matches(".*[0-9]+,[0-9]+.*")) {
                amount = text;
            }
        }
        return amount.replaceAll("[^0-9]", "");
    }

    public String getStoreCategory(String storeName) {
        if (storeName == null || storeName.trim().isEmpty()) return DEFAULT_CATEGORY;
        for (Map.Entry<String, String> entry : KEYWORD_CATEGORY_MAP.entrySet()) {
            if (storeName.contains(entry.getKey())) {
                return entry.getValue();
            }
        }
        for (Map.Entry<String, String> entry : MANUAL_CATEGORY_MAP.entrySet()) {
            if (storeName.contains(entry.getKey())) {
                return entry.getValue();
            }
        }
        String[] searchTerms = generateSearchTerms(storeName);
        for (String term : searchTerms) {
            String category = searchKakao(term);
            if (!category.equals(DEFAULT_CATEGORY)) {
                return category;
            }
        }
        return DEFAULT_CATEGORY;
    }

    private String[] generateSearchTerms(String storeName) {
        List<String> terms = new ArrayList<>();
        String cleaned = storeName.replaceAll("\\(주\\)", "").replaceAll("\\(유\\)", "").replaceAll("(?i)THE\\s+", "").replaceAll("㈜", "").replaceAll("주식회사", "").trim();
        terms.add(cleaned);
        for (Map.Entry<String, String> entry : BRAND_EXPANSION_MAP.entrySet()) {
            if (cleaned.contains(entry.getKey())) terms.add(entry.getValue());
        }
        if (cleaned.contains("백화점")) {
            String simplified = cleaned.split("백화점")[0] + "백화점";
            if (!terms.contains(simplified)) terms.add(simplified);
        }
        String[] words = cleaned.split("\\s+");
        if (words.length > 0 && !terms.contains(words[0])) terms.add(words[0]);
        return terms.toArray(new String[0]);
    }

    private String searchKakao(String storeName) {
        String category = DEFAULT_CATEGORY;
        if (storeName.length() > STORE_NAME_MAX_LENGTH) {
            storeName = storeName.substring(0, STORE_NAME_MAX_LENGTH);
        }
        try {
            String encodedName = URLEncoder.encode(storeName, "UTF-8");
            String reqURL = "https://dapi.kakao.com/v2/local/search/keyword.json?query=" + encodedName;
            URI uri = URI.create(reqURL);
            HttpHeaders headers = new HttpHeaders();
            headers.add("Authorization", "KakaoAK " + kakaoRestApiKey);
            HttpEntity<String> entity = new HttpEntity<>(headers);
            ResponseEntity<String> response = restTemplate.exchange(uri, HttpMethod.GET, entity, String.class);
            if (response.getStatusCode() == HttpStatus.OK) {
                JSONObject jsonObj = (JSONObject) jsonParser.parse(response.getBody());
                JSONArray documents = (JSONArray) jsonObj.get("documents");
                if (documents != null && !documents.isEmpty()) {
                    JSONObject firstResult = (JSONObject) documents.get(0);
                    String groupName = (String) firstResult.get("category_group_name");
                    if (groupName != null && !groupName.isEmpty()) {
                        category = groupName;
                    } else {
                        String fullName = (String) firstResult.get("category_name");
                        if (fullName != null) category = fullName.split(">")[0].trim();
                    }
                }
            }
        } catch (Exception e) { }
        return category;
    }

    private String getFormattedCategory(String detailed) {
        if (detailed == null || detailed.equals(DEFAULT_CATEGORY)) return DEFAULT_CATEGORY;
        String major = "기타";
        if (detailed.contains("음식점") || detailed.contains("식당") || detailed.contains("카페") || detailed.contains("베이커리") || detailed.contains("제과") || detailed.contains("술집") || detailed.contains("치킨") || detailed.contains("피자") || detailed.contains("패스트푸드") || detailed.contains("분식")) {
            major = "식비";
        } else if (detailed.contains("마트") || detailed.contains("슈퍼") || detailed.contains("편의점") || detailed.contains("생활") || detailed.contains("세탁") || detailed.contains("헤어") || detailed.contains("미용") || detailed.contains("뷰티")) {
            major = "생활/마트";
        } else if (detailed.contains("백화점") || detailed.contains("아울렛") || detailed.contains("몰") || detailed.contains("다이소") || detailed.contains("올리브영") || detailed.contains("화장품") || detailed.contains("문구") || detailed.contains("서점") || detailed.contains("의류") || detailed.contains("패션") || detailed.contains("잡화") || detailed.contains("쇼핑")) {
            major = "쇼핑";
        } else if (detailed.contains("병원") || detailed.contains("의원") || detailed.contains("약국") || detailed.contains("한의원") || detailed.contains("내과") || detailed.contains("외과") || detailed.contains("의료") || detailed.contains("건강")) {
            major = "의료/건강";
        } else if (detailed.contains("주유소") || detailed.contains("충전소") || detailed.contains("주차") || detailed.contains("세차") || detailed.contains("교통") || detailed.contains("정비")) {
            major = "교통";
        } else if (detailed.contains("영화") || detailed.contains("시네마") || detailed.contains("노래방") || detailed.contains("PC방") || detailed.contains("문화") || detailed.contains("예술") || detailed.contains("여행") || detailed.contains("숙박") || detailed.contains("호텔") || detailed.contains("모텔")) {
            major = "문화/여가";
        } else if (detailed.contains("학원") || detailed.contains("교육") || detailed.contains("독서실")) {
            major = "교육";
        }
        return major;
    }
}