# 1942 — HTML5 Arcade Recreation

캡콤의 1942(1984) 아케이드 게임을 HTML5 Canvas + ES Modules로 재현한 프로젝트.

## 실행 방법

```bash
# Node.js / npx
npx serve .

# Python 3
python3 -m http.server 8080
```

브라우저에서 `http://localhost:8080` (또는 serve가 출력하는 포트) 열기.

## 조작키

| 키 | 동작 |
|----|------|
| 화살표 / WASD | 이동 |
| Space / Z | 발사 |
| X / Shift | 루프 기동 (무적 + 회전) |
| P / ESC | 일시 정지 |

## 프로젝트 구조

```
src/
  config.js          — 전역 상수
  main.js            — 진입점
  game.js            — 게임 루프 & 씬 전환
  engine/            — 렌더러, 입력, 충돌, 사운드
  entities/          — 플레이어, 적기, 총알, 파워업
  background/        — 스크롤 엔진, 바다, 구름
  systems/           — 오브젝트 풀, 점수, 웨이브
  scenes/            — 타이틀·게임·클리어·게임오버
  ui/                — HUD, 텍스트 유틸
assets/              — 이미지/사운드 (placeholder)
```

## 사운드 추가

`assets/sounds/` 디렉토리에 아래 OGG 파일을 배치하면 자동으로 로드됩니다.
파일이 없어도 게임은 무음으로 정상 실행됩니다.

- `bgm_stage.ogg` — 스테이지 BGM
- `bgm_boss.ogg`  — 보스전 BGM
- `shoot.ogg`     — 발사음
- `explosion.ogg` — 폭발음
- `powerup.ogg`   — 파워업 획득음
- `loop.ogg`      — 루프 기동음

## 개발 현황

- [x] Phase 1 — 뼈대 (index, config, game loop, renderer, input)
- [x] Phase 2 — 플레이어 (이동, 발사, 루프 기동)
- [x] Phase 3 — 배경 (종스크롤, 바다, 구름 시차)
- [x] Phase 4 — 적군 (Fighter, Bomber, DiveBomber, Boss)
- [x] Phase 5 — 시스템 (충돌, 오브젝트 풀, 점수)
- [x] Phase 6 — 씬 & UI (Title, Game, StageComplete, GameOver, HUD)
- [x] Phase 7 — 폴리시 (파워업 4종, 루프 기동 애니메이션, 폭발 이펙트)
