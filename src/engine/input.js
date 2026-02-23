export class Input {
  constructor() {
    this._keys     = new Set();
    this._pressed  = new Set(); // 이번 프레임에 눌린 키
    this._released = new Set();

    // 터치 컨트롤이 주입하는 가상 키 상태
    this._vKeys    = new Set();
    this._vPressed = new Set(); // 이번 프레임에 가상으로 눌린 키

    this._onKeyDown = (e) => {
      if (!this._keys.has(e.code)) this._pressed.add(e.code);
      this._keys.add(e.code);
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
        e.preventDefault();
      }
    };

    this._onKeyUp = (e) => {
      this._keys.delete(e.code);
      this._released.add(e.code);
    };

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup',   this._onKeyUp);
  }

  // TouchControls에서 호출 — 가상 키 상태를 주입
  // down=true 이면 "이번 프레임에 눌림"도 등록 (rising edge만)
  setVirtualKey(code, down) {
    const wasDown = this._vKeys.has(code);
    if (down && !wasDown) this._vPressed.add(code); // rising edge
    if (down) this._vKeys.add(code);
    else      this._vKeys.delete(code);
  }

  // 프레임 끝에 호출 — per-frame 세트 초기화
  update() {
    this._pressed.clear();
    this._released.clear();
    this._vPressed.clear();
  }

  isDown(code)     { return this._keys.has(code) || this._vKeys.has(code); }
  isPressed(code)  { return this._pressed.has(code) || this._vPressed.has(code); }
  isReleased(code) { return this._released.has(code); }

  // ── 편의 게터 ───────────────────────────────────────────────────────────
  get left()  { return this.isDown('ArrowLeft')  || this.isDown('KeyA'); }
  get right() { return this.isDown('ArrowRight') || this.isDown('KeyD'); }
  get up()    { return this.isDown('ArrowUp')    || this.isDown('KeyW'); }
  get down()  { return this.isDown('ArrowDown')  || this.isDown('KeyS'); }
  get fire()  { return this.isDown('Space')      || this.isDown('KeyX'); }
  get loop()  { return this.isPressed('KeyZ'); }

  destroy() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup',   this._onKeyUp);
  }
}
