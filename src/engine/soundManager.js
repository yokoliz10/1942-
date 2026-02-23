/**
 * SoundManager — Web Audio API 절차적 사운드 합성
 * 외부 오디오 파일 없이 SFX + 8비트 스타일 BGM을 실시간 생성
 */

// ── 음표 주파수 상수 (Hz) ─────────────────────────────────────────────────
const F = {
  E2: 82.41,  A2: 110.00,
  C3: 130.81, D3: 146.83, G3: 196.00,
  A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, G4: 392.00,
  A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 784.00,
  A5: 880.00,
};

// 음표 헬퍼: d = 16분음표 단위 길이 (기본값 2 = 8분음표)
const n = (f, d = 2) => ({ f, d });
const r = (d = 2)    => ({ f: 0, d }); // 쉼표

// ── BGM 트랙 정의 ─────────────────────────────────────────────────────────
// 멜로디 64스텝 = 4마디 (4×4=16 비트 = 베이스 16개)
// 베이스: 4스텝(1비트)마다 1개, 모두 d=4(4분음표)

const BGM_STAGE = {
  tempo: 128, // BPM
  melody: [
    // 마디 1 — A단조 행진 (8분음표 8개 = 16스텝)
    n(F.E5), n(F.D5), n(F.C5), n(F.A4),
    n(F.G4), n(F.A4), n(F.C5), n(F.E5),
    // 마디 2 — 발전
    n(F.D5), n(F.C5), n(F.B4), n(F.G4),
    n(F.A4), n(F.B4), n(F.C5), n(F.A4),
    // 마디 3 — 클라이맥스
    n(F.E5), n(F.G5), n(F.A5), n(F.G5),
    n(F.E5), n(F.D5), n(F.C5), n(F.B4),
    // 마디 4 — 해결 (4분음표 + 8분음표 6개 = 4+12 = 16스텝)
    n(F.A4, 4), n(F.C5), n(F.E5), n(F.D5), n(F.C5), n(F.B4), n(F.A4),
  ],
  bass: [
    n(F.A2, 4), n(F.E2, 4), n(F.C3, 4), n(F.E2, 4),
    n(F.A2, 4), n(F.G3, 4), n(F.D3, 4), n(F.E2, 4),
    n(F.A2, 4), n(F.E2, 4), n(F.C3, 4), n(F.G3, 4),
    n(F.A2, 4), n(F.E2, 4), n(F.A2, 4), n(F.E2, 4),
  ],
};

const BGM_BOSS = {
  tempo: 152, // 빠른 BPM
  melody: [
    // 마디 1 — 16분음표 스타카토 질주 (4+4+4+4=16)
    n(F.E5, 1), n(F.D5, 1), n(F.B4, 1), n(F.A4, 1),
    n(F.G4, 1), n(F.E4, 1), n(F.G4, 1), n(F.A4, 1),
    n(F.B4, 2),              n(F.G4, 2),
    n(F.E4, 2),              r(2),
    // 마디 2 — 긴장 (8+8=16)
    n(F.E5), n(F.D5), n(F.B4), n(F.G4),
    n(F.A4, 4),              n(F.B4, 4),
    // 마디 3 — 격화 (4+4+4+4=16)
    n(F.E5, 1), n(F.D5, 1), n(F.B4, 1), n(F.A4, 1),
    n(F.G4, 1), n(F.A4, 1), n(F.B4, 1), n(F.A4, 1),
    n(F.G4, 2), n(F.A4, 2),
    n(F.B4, 2), n(F.D5, 2),
    // 마디 4 — 해결 (2+2+2+2+2+2+4=16)
    n(F.E5), n(F.D5), n(F.B4), n(F.A4),
    n(F.G4), n(F.E4),
    n(F.A4, 4),
  ],
  bass: [
    n(F.A2, 4), n(F.E2, 4), n(F.A2, 4), n(F.E2, 4),
    n(F.A2, 4), n(F.E2, 4), n(F.A2, 4), n(F.E2, 4),
    n(F.G3, 4), n(F.G3, 4), n(F.D3, 4), n(F.D3, 4),
    n(F.A2, 4), n(F.E2, 4), n(F.A2, 4), n(F.E2, 4),
  ],
};

const BGM_TITLE = {
  tempo: 90, // 느린 BPM — 장중한 분위기
  melody: [
    // 모두 4분음표 (16개 × d=4 = 64스텝)
    n(F.A4, 4), r(4),        n(F.C5, 4), n(F.E5, 4),
    n(F.A5, 4), n(F.G5, 4), n(F.E5, 4), n(F.D5, 4),
    n(F.C5, 4), r(4),        n(F.A4, 4), n(F.G4, 4),
    n(F.A4, 4), n(F.C5, 4), n(F.E5, 4), r(4),
  ],
  bass: [
    n(F.A2, 4), n(F.A2, 4), n(F.A2, 4), n(F.E2, 4),
    n(F.A2, 4), n(F.G3, 4), n(F.C3, 4), n(F.E2, 4),
    n(F.A2, 4), n(F.A2, 4), n(F.E2, 4), n(F.E2, 4),
    n(F.A2, 4), n(F.A2, 4), n(F.A2, 4), n(F.E2, 4),
  ],
};

const BGM_TRACKS = { stage: BGM_STAGE, boss: BGM_BOSS, title: BGM_TITLE };

// ── SoundManager ──────────────────────────────────────────────────────────
export class SoundManager {
  constructor() {
    try {
      this._ctx        = new (window.AudioContext || window.webkitAudioContext)();
      this._masterGain = this._ctx.createGain();
      this._masterGain.gain.value = 0.28;
      this._masterGain.connect(this._ctx.destination);
      this._enabled = true;
    } catch {
      this._enabled = false;
    }
    this._muted        = false;
    this._bgmKey       = null;
    this._bgmGain      = null;     // BGM 전용 서브게인 노드
    this._bgmScheduler = null;     // setTimeout 핸들
    this._bgmNextTime  = 0;        // 다음 예약 시각 (AudioContext 시간)
    this._bgmStepIdx   = 0;        // 현재 멜로디 스텝 인덱스
    this._bgmBassIdx   = 0;        // 현재 베이스 스텝 인덱스
    this._bgmStepTime  = 0;        // 베이스 트리거용 누적 스텝 수
  }

  // ── 공개 API ─────────────────────────────────────────────────────────────

  /** 브라우저 자동재생 정책 대응 — 첫 사용자 제스처 후 호출 */
  resume() {
    if (this._enabled && this._ctx.state === 'suspended') this._ctx.resume();
  }

  /** M키 음소거 토글. 현재 음소거 상태(boolean) 반환 */
  toggleMute() {
    if (!this._enabled) return false;
    this._muted = !this._muted;
    this._masterGain.gain.setTargetAtTime(
      this._muted ? 0 : 0.28,
      this._ctx.currentTime, 0.06,
    );
    return this._muted;
  }

  get muted() { return this._muted; }

  /**
   * 사운드 재생
   *   SFX: 'shoot' | 'explosion' | 'player_hit' | 'boss_warning'
   *        'powerup' | 'loop' | 'stage_clear'
   *   BGM: 'bgm_stage' | 'bgm_boss' | 'bgm_title'
   */
  play(key, _opts = {}) {
    if (!this._enabled) return;
    if (this._ctx.state === 'suspended') this._ctx.resume();
    switch (key) {
      case 'shoot':        return this._sfxShoot();
      case 'explosion':    return this._sfxExplosion();
      case 'player_hit':   return this._sfxPlayerHit();
      case 'boss_warning': return this._sfxBossWarning();
      case 'powerup':      return this._sfxPowerup();
      case 'loop':         return this._sfxLoop();
      case 'stage_clear':  return this._sfxStageClear();
      case 'bgm_stage':    return this._startBGM('stage');
      case 'bgm_boss':     return this._startBGM('boss');
      case 'bgm_title':    return this._startBGM('title');
    }
  }

  /** BGM 정지 (씬 전환 시 외부에서 호출) */
  stopBGM() {
    if (this._bgmScheduler) {
      clearTimeout(this._bgmScheduler);
      this._bgmScheduler = null;
    }
    if (this._bgmGain && this._enabled) {
      const t       = this._ctx.currentTime;
      const oldGain = this._bgmGain;
      oldGain.gain.setTargetAtTime(0, t, 0.08);           // 페이드 아웃
      setTimeout(() => { try { oldGain.disconnect(); } catch {} }, 700);
      this._bgmGain = null;
    }
    this._bgmKey = null;
  }

  // ── BGM 내부 ─────────────────────────────────────────────────────────────

  _startBGM(key) {
    if (this._bgmKey === key) return; // 동일 트랙 → 무시
    this.stopBGM();
    if (!this._enabled) return;

    this._bgmKey      = key;
    this._bgmGain     = this._ctx.createGain();
    this._bgmGain.gain.value = 1;
    this._bgmGain.connect(this._masterGain);

    this._bgmStepIdx  = 0;
    this._bgmBassIdx  = 0;
    this._bgmStepTime = 0;
    this._bgmNextTime = this._ctx.currentTime + 0.12;
    this._scheduleBGM();
  }

  _scheduleBGM() {
    const AHEAD = 0.50; // 0.5초 앞서 예약
    const TICK  = 150;  // 150ms마다 재호출
    const track = BGM_TRACKS[this._bgmKey];
    if (!track) return;

    const spb = 60 / track.tempo;  // seconds per beat (4분음표)
    const sps = spb / 4;           // seconds per step (16분음표)
    const mel = track.melody;
    const bas = track.bass;

    // 컨텍스트 시간이 크게 앞서 있으면 (탭 전환 등) 재동기화
    if (this._bgmNextTime < this._ctx.currentTime - 0.1) {
      this._bgmNextTime = this._ctx.currentTime + 0.05;
    }

    while (this._bgmNextTime < this._ctx.currentTime + AHEAD) {
      const mi  = this._bgmStepIdx % mel.length;
      const mn  = mel[mi];
      const dur = sps * mn.d;

      // 베이스: 4스텝(1비트)마다 트리거 — 현재 스텝 시작 시 누적=0이면 발화
      if (this._bgmStepTime === 0) {
        const bn = bas[this._bgmBassIdx % bas.length];
        if (bn.f > 0) {
          this._bgmNote(bn.f, this._bgmNextTime, spb * 0.88, 0.09, 'triangle');
        }
        this._bgmBassIdx++;
      }

      // 멜로디 음표
      if (mn.f > 0) {
        this._bgmNote(mn.f, this._bgmNextTime, dur * 0.84, 0.14, 'square');
      }

      // 스텝 누적 + 비트 경계 초기화
      this._bgmStepTime += mn.d;
      if (this._bgmStepTime >= 4) this._bgmStepTime -= 4;

      this._bgmNextTime += dur;
      this._bgmStepIdx++;
    }

    this._bgmScheduler = setTimeout(() => {
      if (this._bgmKey) this._scheduleBGM();
    }, TICK);
  }

  _bgmNote(freq, when, dur, vol, type) {
    if (!this._bgmGain) return;
    const osc  = this._ctx.createOscillator();
    const gain = this._ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(vol, when + 0.008);
    gain.gain.setValueAtTime(vol, when + dur * 0.75);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    osc.connect(gain);
    gain.connect(this._bgmGain);
    osc.start(when);
    osc.stop(when + dur + 0.01);
  }

  // ── SFX 구현 ─────────────────────────────────────────────────────────────

  _sfxShoot() {
    const t = this._ctx.currentTime;
    const osc = this._ctx.createOscillator();
    const g   = this._ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.07);
    g.gain.setValueAtTime(0.18, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    osc.connect(g); g.connect(this._masterGain);
    osc.start(t); osc.stop(t + 0.08);
  }

  _sfxExplosion() {
    const t   = this._ctx.currentTime;
    const dur = 0.45;
    // 화이트 노이즈 + 저역 필터
    const len  = Math.floor(this._ctx.sampleRate * dur);
    const buf  = this._ctx.createBuffer(1, len, this._ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = this._ctx.createBufferSource();
    src.buffer = buf;
    const lpf = this._ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.setValueAtTime(900, t);
    lpf.frequency.exponentialRampToValueAtTime(80, t + dur);
    const g1 = this._ctx.createGain();
    g1.gain.setValueAtTime(0.4, t);
    g1.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(lpf); lpf.connect(g1); g1.connect(this._masterGain);
    src.start(t); src.stop(t + dur);
    // 저음 충격파
    const osc = this._ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.22);
    const g2 = this._ctx.createGain();
    g2.gain.setValueAtTime(0.35, t);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    osc.connect(g2); g2.connect(this._masterGain);
    osc.start(t); osc.stop(t + 0.26);
  }

  _sfxPlayerHit() {
    const t   = this._ctx.currentTime;
    const osc = this._ctx.createOscillator();
    const g   = this._ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.setValueAtTime(440, t + 0.06);
    osc.frequency.setValueAtTime(165, t + 0.14);
    g.gain.setValueAtTime(0.35, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    osc.connect(g); g.connect(this._masterGain);
    osc.start(t); osc.stop(t + 0.29);
  }

  _sfxBossWarning() {
    const t = this._ctx.currentTime;
    // 880Hz / 440Hz 교대 경보음 6회
    [0, 0.22, 0.44, 0.66, 0.88, 1.10].forEach((off, i) => {
      const osc = this._ctx.createOscillator();
      const g   = this._ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = (i % 2 === 0) ? 880 : 440;
      const s = t + off;
      g.gain.setValueAtTime(0, s);
      g.gain.linearRampToValueAtTime(0.28, s + 0.02);
      g.gain.setValueAtTime(0.28, s + 0.14);
      g.gain.linearRampToValueAtTime(0, s + 0.20);
      osc.connect(g); g.connect(this._masterGain);
      osc.start(s); osc.stop(s + 0.22);
    });
  }

  _sfxPowerup() {
    const t = this._ctx.currentTime;
    // 상행 아르페지오: C4 → E4 → G4 → C5
    [261.63, 329.63, 392.00, 523.25].forEach((f, i) => {
      const osc = this._ctx.createOscillator();
      const g   = this._ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = f;
      const s = t + i * 0.09;
      g.gain.setValueAtTime(0.28, s);
      g.gain.exponentialRampToValueAtTime(0.0001, s + 0.16);
      osc.connect(g); g.connect(this._masterGain);
      osc.start(s); osc.stop(s + 0.17);
    });
  }

  _sfxLoop() {
    const t   = this._ctx.currentTime;
    const osc = this._ctx.createOscillator();
    const g   = this._ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(330, t);
    osc.frequency.exponentialRampToValueAtTime(1320, t + 0.18);
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.20);
    osc.connect(g); g.connect(this._masterGain);
    osc.start(t); osc.stop(t + 0.21);
  }

  _sfxStageClear() {
    const t = this._ctx.currentTime;
    // C장조 상행 아르페지오 팡파레: C4 E4 G4 C5 E5 G5 C6
    [261.63, 329.63, 392.00, 523.25, 659.25, 784.00, 1046.50].forEach((f, i) => {
      const osc = this._ctx.createOscillator();
      const g   = this._ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = f;
      const s = t + i * 0.13;
      g.gain.setValueAtTime(0.20, s);
      g.gain.exponentialRampToValueAtTime(0.0001, s + 0.24);
      osc.connect(g); g.connect(this._masterGain);
      osc.start(s); osc.stop(s + 0.25);
    });
  }
}
