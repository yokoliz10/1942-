const HISCORE_KEY = '1942_hiscore';

export class ScoreManager {
  constructor() {
    this.score     = 0;
    this.hiscore   = this._loadHiscore();
    this.stage     = 1;
    this._combo    = 0;
    this._comboTimer = 0;
    this.COMBO_WINDOW = 1.5; // seconds
  }

  addScore(value) {
    const multiplier = this._combo > 0 ? 1 + this._combo * 0.1 : 1;
    const earned     = Math.floor(value * multiplier);
    this.score      += earned;
    this._combo++;
    this._comboTimer = this.COMBO_WINDOW;

    if (this.score > this.hiscore) {
      this.hiscore = this.score;
      this._saveHiscore();
    }
    return earned;
  }

  update(dt) {
    if (this._comboTimer > 0) {
      this._comboTimer -= dt;
      if (this._comboTimer <= 0) this._combo = 0;
    }
  }

  nextStage() {
    this.stage++;
    // Stage clear bonus
    const bonus = this.stage * 1000;
    this.score += bonus;
    if (this.score > this.hiscore) {
      this.hiscore = this.score;
      this._saveHiscore();
    }
    return bonus;
  }

  reset() {
    this.score  = 0;
    this.stage  = 1;
    this._combo = 0;
  }

  _loadHiscore() {
    try {
      return parseInt(localStorage.getItem(HISCORE_KEY) ?? '0', 10) || 0;
    } catch { return 0; }
  }

  _saveHiscore() {
    try { localStorage.setItem(HISCORE_KEY, String(this.hiscore)); } catch {}
  }

  get combo() { return this._combo; }
}
