import { NATIVE_WIDTH } from '../config.js';

/**
 * FormationGroup — 편대 내 격추 카운팅 + 전멸 보너스
 * Fighter에 formationGroup 참조를 심어두면 게임 씬에서
 * enemy.formationGroup.notifyKill()을 호출해 보너스를 처리한다.
 */
export class FormationGroup {
  constructor(count) {
    this.total  = count;
    this.kills  = 0;
    this.bonus  = count * 200; // 기체당 200pt 보너스
  }

  /** 격추 1건을 등록한다. 마지막 기체일 때 true 반환 */
  notifyKill() {
    this.kills++;
    return this.kills >= this.total;
  }

  get allDestroyed() { return this.kills >= this.total; }
}

export class WaveManager {
  constructor() {
    this._timer          = 0;
    this._waveIndex      = 0;
    this._eventIndex     = 0;
    this._events         = [];
    this._fighterPool    = null;
    this._bomberPool     = null;
    this._diveBomberPool = null;
    this._boss           = null;
    this._bossActive     = false;
    this.onBossSpawned   = null;
    this.onWaveComplete  = null;

    this._waves = this._buildWaves();
  }

  setPools({ fighterPool, bomberPool, diveBomberPool, boss }) {
    this._fighterPool    = fighterPool;
    this._bomberPool     = bomberPool;
    this._diveBomberPool = diveBomberPool;
    this._boss           = boss;
  }

  getActiveEnemies() {
    const all = [];
    for (const pool of [this._fighterPool, this._bomberPool, this._diveBomberPool]) {
      if (pool) all.push(...pool.getAll().filter(e => e.active));
    }
    if (this._boss?.active) all.push(this._boss);
    return all;
  }

  loadWave(index) {
    this._waveIndex  = index % this._waves.length;
    this._events     = this._waves[this._waveIndex] ?? [];
    this._eventIndex = 0;
    this._timer      = 0;
    this._bossActive = false;
  }

  update(dt, bulletPool, playerX = NATIVE_WIDTH / 2) {
    this._timer += dt;

    while (
      this._eventIndex < this._events.length &&
      this._events[this._eventIndex].time <= this._timer
    ) {
      this._spawn(this._events[this._eventIndex++], bulletPool, playerX);
    }

    if (this._eventIndex >= this._events.length && !this._bossActive) {
      if (this.getActiveEnemies().length === 0 && this.onWaveComplete) {
        this.onWaveComplete();
      }
    }
  }

  _spawn(ev, bulletPool, playerX) {
    const x = ev.x ?? NATIVE_WIDTH / 2;
    const y = ev.y ?? -16;

    switch (ev.type) {
      case 'fighter': {
        if (!this._fighterPool) break;
        const e = this._fighterPool.get();
        e.spawn(x, y, ev.pattern ?? 'straight');
        e.formationGroup = ev.fg ?? null; // 편대 그룹 참조 주입
        break;
      }
      case 'bomber': {
        if (!this._bomberPool) break;
        this._bomberPool.get().spawn(x, y);
        break;
      }
      case 'divebomber': {
        if (!this._diveBomberPool) break;
        this._diveBomberPool.get().spawn(x, y, playerX, 180);
        break;
      }
      case 'boss': {
        if (!this._boss) break;
        this._boss.spawn(NATIVE_WIDTH / 2 - 24, -50);
        this._bossActive = true;
        this.onBossSpawned?.(this._boss);
        break;
      }
    }
  }

  // ── 포메이션 헬퍼 ──────────────────────────────────────────────────────

  /**
   * V자 포메이션 (5대) — 리더 앞, 좌우 날개가 뒤에
   *
   *       ★          (leader, y=-10)
   *     ★   ★        (y=-22)
   *   ★       ★      (y=-34)
   */
  _vFormation(t, cx, pattern = 'straight') {
    const fg = new FormationGroup(5);
    return [
      { time: t, type: 'fighter', x: cx,      y: -10, pattern, fg },
      { time: t, type: 'fighter', x: cx - 18, y: -22, pattern, fg },
      { time: t, type: 'fighter', x: cx + 18, y: -22, pattern, fg },
      { time: t, type: 'fighter', x: cx - 34, y: -34, pattern, fg },
      { time: t, type: 'fighter', x: cx + 34, y: -34, pattern, fg },
    ];
  }

  /**
   * 역V / 화살촉 포메이션 (5대) — 좌우 선두, 중앙 후미
   *
   *   ★       ★      (y=-10)
   *     ★   ★        (y=-22)
   *       ★          (y=-34)
   */
  _arrowFormation(t, cx, pattern = 'straight') {
    const fg = new FormationGroup(5);
    return [
      { time: t, type: 'fighter', x: cx - 34, y: -10, pattern, fg },
      { time: t, type: 'fighter', x: cx + 34, y: -10, pattern, fg },
      { time: t, type: 'fighter', x: cx - 18, y: -22, pattern, fg },
      { time: t, type: 'fighter', x: cx + 18, y: -22, pattern, fg },
      { time: t, type: 'fighter', x: cx,      y: -34, pattern, fg },
    ];
  }

  /**
   * 횡렬(가로 한 줄) 포메이션
   *  ★ ★ ★ ★ ★ ★
   */
  _lineFormation(t, cx, count = 6, gap = 18, pattern = 'straight') {
    const fg = new FormationGroup(count);
    return Array.from({ length: count }, (_, i) => ({
      time:    t,
      type:    'fighter',
      x:       cx + (i - Math.floor(count / 2)) * gap,
      y:       -16,
      pattern,
      fg,
    }));
  }

  /**
   * 종대(세로 한 줄) 포메이션 — 일열로 위에서 아래로 낙하
   *  ★
   *  ★
   *  ★
   *  ★
   *  ★
   */
  _columnFormation(t, cx, count = 5, gap = 16, pattern = 'straight') {
    const fg = new FormationGroup(count);
    return Array.from({ length: count }, (_, i) => ({
      time:    t,
      type:    'fighter',
      x:       cx,
      y:       -10 - i * gap,  // 화면 위에 수직으로 쌓임
      pattern,
      fg,
    }));
  }

  /**
   * 좌측 곡선 진입 포메이션 — 화면 왼쪽에서 호를 그리며 진입
   * 수직 오프셋을 주어 열(列) 대형을 유지
   *
   *   (left edge) → arc right-and-down
   */
  _swoopLeft(t, count = 5) {
    const fg = new FormationGroup(count);
    return Array.from({ length: count }, (_, i) => ({
      time:    t,
      type:    'fighter',
      x:       -18,           // 화면 왼쪽 바깥
      y:       20 + i * 15,   // 수직 간격으로 열 구성
      pattern: 'swoop_left',
      fg,
    }));
  }

  /**
   * 우측 곡선 진입 포메이션 — 화면 오른쪽에서 호를 그리며 진입
   */
  _swoopRight(t, count = 5) {
    const fg = new FormationGroup(count);
    return Array.from({ length: count }, (_, i) => ({
      time:    t,
      type:    'fighter',
      x:       NATIVE_WIDTH + 18,
      y:       20 + i * 15,
      pattern: 'swoop_right',
      fg,
    }));
  }

  /**
   * 좌우 협공 (양쪽에서 동시 곡선 진입)
   */
  _swoopBoth(t, count = 4) {
    return [
      ...this._swoopLeft(t, count),
      ...this._swoopRight(t, count),
    ];
  }

  /**
   * 다이아몬드 포메이션 (5대)
   */
  _diamondFormation(t, cx, pattern = 'straight') {
    const fg = new FormationGroup(5);
    return [
      { time: t, type: 'fighter', x: cx,      y: -10, pattern, fg },
      { time: t, type: 'fighter', x: cx - 20, y: -22, pattern, fg },
      { time: t, type: 'fighter', x: cx + 20, y: -22, pattern, fg },
      { time: t, type: 'fighter', x: cx,      y: -34, pattern, fg },
      { time: t, type: 'fighter', x: cx,      y: -48, pattern, fg },
    ];
  }

  // ── 웨이브 스크립트 ────────────────────────────────────────────────────

  _buildWaves() {
    const W = NATIVE_WIDTH;
    const waves = [];

    // ─────────────────────────────────────────────────────────────────────
    // Wave 0: 기초 — V자·종대·폭격기
    // 포메이션 유형: V자 2개(좌우), 횡렬 1개, 폭격기 소대
    // ─────────────────────────────────────────────────────────────────────
    waves.push([
      // V자 포메이션 — 좌측
      ...this._vFormation(1.0, W * 0.28, 'straight'),
      // V자 포메이션 — 우측
      ...this._vFormation(1.0, W * 0.72, 'straight'),
      // 종대 — 중앙 직선 낙하
      ...this._columnFormation(5.5, W * 0.50, 6, 16, 'straight'),
      // 폭격기 소대
      { time: 9.0,  type: 'bomber', x: W * 0.20, y: -22 },
      { time: 9.0,  type: 'bomber', x: W * 0.50, y: -22 },
      { time: 9.0,  type: 'bomber', x: W * 0.80, y: -22 },
      // 횡렬 — 파동
      ...this._lineFormation(13.0, W * 0.50, 7, 18, 'sine'),
      // 보스
      { time: 20.0, type: 'boss' },
    ]);

    // ─────────────────────────────────────────────────────────────────────
    // Wave 1: 곡선 진입 — swoop 좌·우, 화살촉
    // ─────────────────────────────────────────────────────────────────────
    waves.push([
      // 좌측 곡선 진입
      ...this._swoopLeft(1.0, 5),
      // 우측 곡선 진입
      ...this._swoopRight(1.0, 5),
      // 화살촉 (중앙 위에서)
      ...this._arrowFormation(6.0, W * 0.50, 'dive'),
      // 급강하 폭격기
      { time: 9.5,  type: 'divebomber', x: W * 0.25, y: -16 },
      { time: 9.5,  type: 'divebomber', x: W * 0.75, y: -16 },
      { time: 9.7,  type: 'divebomber', x: W * 0.50, y: -16 },
      // 종대 좌우 동시
      ...this._columnFormation(14.0, W * 0.30, 5, 15, 'straight'),
      ...this._columnFormation(14.0, W * 0.70, 5, 15, 'straight'),
      // 보스
      { time: 22.0, type: 'boss' },
    ]);

    // ─────────────────────────────────────────────────────────────────────
    // Wave 2: 협공 — 양쪽 동시 swoop + 다이아몬드 + 중앙 V자
    // ─────────────────────────────────────────────────────────────────────
    waves.push([
      // 좌우 협공 (swoop_left + swoop_right 동시)
      ...this._swoopBoth(1.0, 4),
      // V자 (중앙)
      ...this._vFormation(5.5, W * 0.50, 'sine'),
      // 폭격기
      { time: 9.0,  type: 'bomber', x: W * 0.33, y: -22 },
      { time: 9.0,  type: 'bomber', x: W * 0.67, y: -22 },
      // 다이아몬드 (좌/우)
      ...this._diamondFormation(12.0, W * 0.30, 'sine'),
      ...this._diamondFormation(12.0, W * 0.70, 'sine'),
      // 마지막 — 좌우 협공 + 종대 중앙
      ...this._swoopBoth(16.5, 3),
      ...this._columnFormation(17.0, W * 0.50, 5, 14, 'straight'),
      // 보스
      { time: 24.0, type: 'boss' },
    ]);

    // 스테이지 2·3: 기본 웨이브보다 빠른 페이스로 진행
    waves[1] = waves[1].map(ev => ({ ...ev, time: +(ev.time * 0.88).toFixed(2) }));
    waves[2] = waves[2].map(ev => ({ ...ev, time: +(ev.time * 0.78).toFixed(2) }));

    // 이후 스테이지: 3개 패턴 순환 + 점진 가속
    for (let i = 3; i < 32; i++) {
      const base  = waves[i % 3];
      const scale = Math.max(0.52, 1 - (i - 3) * 0.016);
      waves.push(base.map(ev => ({ ...ev, time: +(ev.time * scale).toFixed(2) })));
    }

    return waves;
  }

  get bossActive() { return this._bossActive; }
  notifyBossDefeated() { this._bossActive = false; }
}
