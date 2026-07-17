# OSORI v2 — AI 재무 코칭 가계부

사회초년생을 위한 넛지형 AI 재무 코칭 가계부. [오소리(OSoRi)](https://github.com/jsi4770/OSoRi) 팀 프로젝트를 개인 프로젝트로 재해석한 버전으로, 개인 가계부 코어는 재사용하고 **AI 재무 코칭**을 새로운 차별화 기능으로 추가했습니다.

- 프론트엔드: https://fincoach-app-beta.vercel.app
- 백엔드 API: https://fincoach-api-production.up.railway.app
- 제품 요구사항: [`docs/PRD.md`](docs/PRD.md)

## 무엇이 다른가 (vs 팀 프로젝트)

원본 오소리는 개인/그룹 가계부, 챌린지, 뱃지, 실시간 알림까지 포함한 4인 팀 프로젝트입니다. 이 버전은 **개인 가계부 코어만** 가져오고 그룹 가계부·챌린지·뱃지·실시간 알림은 스코프에서 제외했습니다. 대신 사후 리포트에 그치지 않는 **AI 코칭**(소비 이상치 감지 → 맥락 있는 넛지 → 목표 기반 대화형 코칭 → 성장 리포트)을 새로 만들었습니다. 자세한 배경은 [`docs/PRD.md`](docs/PRD.md) 참고.

## 기술 스택

| | |
|---|---|
| 프론트엔드 | React 19 (Vite) · Axios · React Router · Chart.js |
| 백엔드 | Spring Boot 3 · Java 17 · MyBatis · PostgreSQL |
| AI 코칭 | Google Gemini API (무료 티어, `gemini-2.5-flash`) — Mock 폴백 내장 |
| 영수증 OCR | Naver CLOVA OCR (종량제, 기본 비활성화) |
| 배포 | 백엔드: Railway · 프론트엔드: Vercel |

## 프로젝트 구조

```
personalPRD/
├─ docs/PRD.md   제품 요구사항
├─ app/          프론트엔드 (React + Vite)
└─ server/       백엔드 (Spring Boot)
```

## 로컬 실행

### 사전 준비: PostgreSQL

```bash
brew install postgresql@16
brew services start postgresql@16
createdb fincoach
```

### 백엔드

```bash
cd server
cp src/main/resources/application.properties.example src/main/resources/application-local.properties
# application-local.properties에 실제 DB 비밀번호/JWT 시크릿/외부 API 키를 채워넣는다
SPRING_PROFILES_ACTIVE=local ./mvnw spring-boot:run   # http://localhost:8080/fincoach
```

`application.properties`(커밋됨, 안전한 기본값)와 `application-local.properties`(gitignore, 실제 로컬 시크릿)는 Spring 프로필로 분리되어 있습니다. `application-local.properties`에 넣은 값이 기본값을 덮어씁니다.

### 프론트엔드

```bash
cd app
npm install
npm run dev   # http://localhost:5174 (또는 다른 포트, vite가 자동 배정)
```

`app/src/api/axios.jsx`, `http.js`는 `VITE_API_BASE_URL`이 없으면 `/fincoach` 상대 경로(Vite 프록시 경유)로 로컬 백엔드를 호출합니다.

## 배포

- **백엔드(Railway)**: `railway up -s fincoach-api` — 환경변수로 `DB_HOST`/`DB_PORT`/`DB_NAME`/`DB_USER`/`DB_PASSWORD`(Railway Postgres 서비스 참조), `JWT_SECRET`, `NAVER_OCR_*`, `RECEIPT_OCR_ENABLED`, `COACHING_LLM_ENABLED`, `GEMINI_API_KEY` 등을 주입합니다.
- **프론트엔드(Vercel)**: `app/.env.production`의 `VITE_API_BASE_URL`이 배포된 Railway 백엔드 URL을 가리키도록 빌드 시 고정합니다.

## 현재 스코프: 무엇이 진짜고 무엇이 Mock인가

- **AI 코칭**: `coaching.llm.enabled=false`(기본값)면 미리 정의된 Mock 코칭 문구로 동작합니다. Gemini API 키를 발급받아 `true`로 바꾸면 실제 LLM 응답으로 전환됩니다. 무료 티어 한도 초과/오류 시에도 자동으로 Mock으로 우아하게 대체됩니다.
- **영수증 OCR**: `receipt.ocr.enabled=false`(기본값)면 비활성화 메시지와 함께 수동 입력으로 유도합니다. CLOVA OCR은 종량제라 기본적으로 꺼져 있습니다.
- **소셜 로그인(카카오)**: 키 미설정 시 동작하지 않습니다.
- 그룹 가계부·챌린지·뱃지·실시간 알림은 이 버전에 없습니다(팀 프로젝트에만 존재).

## 다음 단계

- 실제 사용자 인터뷰로 AI 코칭 넛지 문구/타이밍 검증
- 성장 리포트에 카테고리별 지출 추이 차트 보강
