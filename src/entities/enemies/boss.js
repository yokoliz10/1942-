import { Enemy } from './enemy.js';
import { BOSS_SCORE, NATIVE_WIDTH, NATIVE_HEIGHT } from '../../config.js';
import { BULLET_OWNER } from '../bullet.js';

const MOVE = { ENTER: 'enter', PATROL: 'patrol', CHARGE: 'charge' };
const ATK  = { STRAIGHT: 0, FAN: 1, AIMED: 2 };

// 공격 순서: _hpPhase 반환값 0/1/2 에 맞는 인덱스
//   0 = 분노(rage, HP≤33%), 1 = 중간(HP≤66%), 2 = 풀피
const ATK_SEQ  = [
  [ATK.FAN, ATK.AIMED, ATK.AIMED],    // 0: rage — 부채꼴 + 조준 위주
  [ATK.STRAIGHT, ATK.FAN, ATK.AIMED], // 1: mid  — 3패턴 순환
  [ATK.STRAIGHT, ATK.FAN],            // 2: full — 직선+부채꼴만
];
const ATK_RATE = [0.50, 0.72, 1.05];  // 0=빠름(rage), 2=느림(full)

export class Boss extends Enemy {
  constructor() {
    super(48, 40);
    this.maxHp      = 80;
    this.hp         = 80;
    this.scoreValue = BOSS_SCORE;

    this._movePhase   = MOVE.ENTER;
    this._patrolTimer = 0;
    this._shootTimer  = 0;
    this._atkIdx      = 0;
    this._hitFlash    = 0;   // 피격 백색 플래시 카운트다운
    this._phaseFlash  = 0;   // 페이즈 전환 플래시 카운트다운
    this._prevPhase   = 2;   // 이전 HP 페이즈 (전환 감지용)
    this._playerX     = NATIVE_WIDTH / 2;
    this._playerY     = NATIVE_HEIGHT - 40;
  }

  get _hpPhase() {
    const r = this.hp / this.maxHp;
    return r > 0.66 ? 2 : r > 0.33 ? 1 : 0;
  }

  spawn(x, y) {
    super.spawn(x, y);
    this.vy           = 28;
    this.vx           = 0;
    this._movePhase   = MOVE.ENTER;
    this._patrolTimer = 0;
    this._shootTimer  = 1.5;
    this._atkIdx      = 0;
    this._hitFlash    = 0;
    this._phaseFlash  = 0;
    this._prevPhase   = 2;
  }

  // Enemy.update() 를 완전 오버라이드 — playerX/Y 수신
  update(dt, bulletPool, playerX = NATIVE_WIDTH / 2, playerY = NATIVE_HEIGHT - 40) {
    if (!this.active) return;
    this._t       += dt;
    this._playerX  = playerX;
    this._playerY  = playerY;

    // HP 페이즈 전환 감지
    const phase = this._hpPhase;
    if (phase < this._prevPhase) {
      this._phaseFlash = 0.9;   // 전환 플래시
      this._prevPhase  = phase;
      this._atkIdx     = 0;     // 공격 사이클 리셋
    }

    if (this._hitFlash   > 0) this._hitFlash   -= dt;
    if (this._phaseFlash > 0) this._phaseFlash -= dt;

    this._doMove(dt);

    // 진입 중에는 발사 안 함
    if (bulletPool && this._movePhase !== MOVE.ENTER) {
      this._shootTimer -= dt;
      if (this._shootTimer <= 0) this._executeShot(bulletPool);
    }
  }

  _doMove(dt) {
    switch (this._movePhase) {
      case MOVE.ENTER:
        this.y += this.vy * dt;
        if (this.y >= 20) {
          this.y          = 20;
          this.vy         = 0;
          this._movePhase = MOVE.PATROL;
        }
        break;

      case MOVE.PATROL: {
        this._patrolTimer += dt;
        const freq  = this._hpPhase === 0 ? 1.15 : 0.68;
        this.x = NATIVE_WIDTH / 2 - this.width / 2 +
                 Math.sin(this._patrolTimer * freq) * 72;

        // 중간·분노 페이즈에서 랜덤 돌격
        if (this._hpPhase < 2 && this._patrolTimer > 5 && Math.random() < 0.004) {
          this._movePhase   = MOVE.CHARGE;
          this.vy           = this._hpPhase === 0 ? 135 : 92;
          this._patrolTimer = 0;
        }
        break;
      }

      case MOVE.CHARGE:
        this.y += this.vy * dt;
        if (this.y > NATIVE_HEIGHT * 0.55 && this.vy > 0) this.vy = -80;
        if (this.y < 20 && this.vy < 0) {
          this.y          = 20;
          this.vy         = 0;
          this._movePhase = MOVE.PATROL;
        }
        break;
    }
  }

  // ── 공격 패턴 선택 & 실행 ───────────────────────────────────────────────

  _executeShot(bulletPool) {
    const phase   = this._hpPhase;
    const seq     = ATK_SEQ[phase];
    const pattern = seq[this._atkIdx % seq.length];
    this._atkIdx++;
    this._shootTimer = ATK_RATE[phase];

    switch (pattern) {
      case ATK.STRAIGHT: this._fireStraight(bulletPool); break;
      case ATK.FAN:      this._fireFan(bulletPool);      break;
      case ATK.AIMED:    this._fireAimed(bulletPool);    break;
    }
  }

  /** 직선탄: 보스 너비에 걸쳐 5발 동시 수직 발사 */
  _fireStraight(bulletPool) {
    const cols = 5;
    for (let i = 0; i < cols; i++) {
      const bx = this.x + 4 + (i / (cols - 1)) * (this.width - 8);
      const b  = bulletPool.get();
      if (b) b.fire(bx, this.y + this.height, BULLET_OWNER.ENEMY, Math.PI / 2);
    }
  }

  /** 부채꼴 탄막: 하방 180° 범위에 9발 */
  _fireFan(bulletPool) {
    const count = 9;
    const span  = Math.PI; // 180°
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI / 2 - span / 2) + (i / (count - 1)) * span;
      const b = bulletPool.get();
      if (b) b.fire(this.cx - 1.5, this.y + this.height * 0.6, BULLET_OWNER.ENEMY, angle);
    }
  }

  /** 플레이어 조준탄: 플레이어 방향 기준 ±0.22 rad 3발 */
  _fireAimed(bulletPool) {
    const dx   = this._playerX - this.cx;
    const dy   = this._playerY - this.cy;
    const base = Math.atan2(dy, dx);
    for (const off of [-0.22, 0, 0.22]) {
      const b = bulletPool.get();
      if (b) b.fire(this.cx - 1.5, this.y + this.height, BULLET_OWNER.ENEMY, base + off);
    }
  }

  // ── 피격 / 렌더링 ─────────────────────────────────────────────────────

  hit(damage = 1) {
    this._hitFlash = 0.12;
    return super.hit(damage);
  }

  render(renderer) {
    if (!this.active) return;
    this._draw(renderer);
  }

  _draw(renderer) {
    const { x, y, width, height } = this;
    const phase = this._hpPhase;

    // 페이즈 전환 플래시 (깜빡임)
    if (this._phaseFlash > 0 && Math.floor(this._phaseFlash * 16) % 2 === 1) {
      renderer.fillRect(x - 1, y - 1, width + 2, height + 2, '#ff440088');
    }

    // ── 대형 폭격기 픽셀아트 (48×40) ────────────────────────────────────
    const fl   = this._hitFlash > 0;
    const body = fl ? '#ffffff' : '#3a1a5c';
    const wing = fl ? '#ffffff' : '#5c2a8c';
    const pod  = fl ? '#ffffff' : '#4a2060';
    const ckpt = fl ? '#ffffff' : '#ffcc44';
    const nose = fl ? '#ffffff' : '#6a3ab0';
    const dark = fl ? '#cccccc' : '#1e0a38'; // 그림자
    const hl   = fl ? '#ffffff' : '#7a4acc'; // 하이라이트
    const prop = fl ? '#aaaaaa' : '#888866'; // 프로펠러 디스크

    // 날개 그림자
    renderer.fillRect(x + 1,  y + 15, 46, 10, dark);
    // 날개 몸체
    renderer.fillRect(x,      y + 14, 48, 12, wing);
    renderer.fillRect(x + 2,  y + 14, 44,  1, hl);   // 앞전 하이라이트
    renderer.fillRect(x + 4,  y + 25, 40,  1, dark); // 후연 그림자

    // 좌 외측 엔진 나셀
    renderer.fillRect(x + 2,  y + 13, 8, 14, pod);
    renderer.fillRect(x + 2,  y + 13, 2, 12, hl);
    // 좌 내측 엔진 나셀
    renderer.fillRect(x + 12, y + 12, 8, 15, pod);
    renderer.fillRect(x + 12, y + 12, 2, 13, hl);
    // 우 내측 엔진 나셀
    renderer.fillRect(x + 28, y + 12, 8, 15, pod);
    renderer.fillRect(x + 28, y + 12, 2, 13, hl);
    // 우 외측 엔진 나셀
    renderer.fillRect(x + 38, y + 13, 8, 14, pod);
    renderer.fillRect(x + 38, y + 13, 2, 12, hl);

    // 프로펠러 디스크 (4개)
    renderer.fillRect(x + 1,  y + 12, 10, 1, prop);
    renderer.fillRect(x + 11, y + 11, 10, 1, prop);
    renderer.fillRect(x + 27, y + 11, 10, 1, prop);
    renderer.fillRect(x + 37, y + 12, 10, 1, prop);

    // 동체 메인
    renderer.fillRect(x + 14, y + 3,  20, 34, body);
    renderer.fillRect(x + 14, y + 3,   2, 32, hl);   // 좌 하이라이트
    renderer.fillRect(x + 32, y + 3,   2, 32, dark); // 우 그림자

    // 기수
    renderer.fillRect(x + 18, y + 1,  12,  3, nose);
    renderer.fillRect(x + 20, y + 0,   8,  2, nose);
    renderer.fillRect(x + 22, y + 0,   4,  1, hl);   // 기수 끝 하이라이트

    // 조종석 유리
    renderer.fillRect(x + 18, y + 4,  12,  8, ckpt);
    renderer.fillRect(x + 18, y + 4,   2,  6, '#ffeebb'); // 반사광

    // 폭탄창
    renderer.fillRect(x + 18, y + 22, 12,  8, dark);
    renderer.fillRect(x + 20, y + 23,  8,  6, '#220000');

    // 꼬리 몸체
    renderer.fillRect(x + 16, y + 33, 16,  5, body);
    renderer.fillRect(x + 14, y + 35, 20,  2, wing); // 수평 미익
    // 수직 꼬리 핀
    renderer.fillRect(x + 17, y + 29,  4,  6, dark);
    renderer.fillRect(x + 27, y + 29,  4,  6, dark);

    // 포탑 (기총 터렛)
    renderer.fillRect(x + 20, y + 11,  8,  4, dark);  // 터렛 받침
    renderer.fillRect(x + 22, y + 9,   4,  4, pod);   // 터렛 돔
    renderer.fillRect(x + 23, y + 6,   2,  5, dark);  // 포신

    // 분노 페이즈 엔진 글로우 (phase 0)
    if (phase === 0 && !fl) {
      const g   = Math.floor((Math.sin(this._t * 14) * 0.5 + 0.5) * 200);
      const hex = g.toString(16).padStart(2, '0');
      renderer.fillRect(x + 2,  y + 14, 8, 4, `#ff${hex}00`); // 좌 외측
      renderer.fillRect(x + 12, y + 13, 8, 4, `#ff${hex}00`); // 좌 내측
      renderer.fillRect(x + 28, y + 13, 8, 4, `#ff${hex}00`); // 우 내측
      renderer.fillRect(x + 38, y + 14, 8, 4, `#ff${hex}00`); // 우 외측
    }

    // 중간 페이즈 날개 강조 (phase 1)
    if (phase === 1 && !fl) {
      renderer.fillRect(x + 8, y + 14, 32, 3, '#aa44cc');
    }
  }
}
