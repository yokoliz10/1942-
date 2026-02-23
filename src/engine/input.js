export class Input {
  constructor() {
    this._keys    = new Set();
    this._pressed = new Set(); // keys that went down THIS frame
    this._released = new Set();

    this._onKeyDown = (e) => {
      if (!this._keys.has(e.code)) {
        this._pressed.add(e.code);
      }
      this._keys.add(e.code);
      // Prevent arrow keys / space from scrolling the page
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

    // Touch support (virtual d-pad via touch position)
    this._touch = { active: false, x: 0, y: 0 };
    this._setupTouch();
  }

  _setupTouch() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      this._touch = { active: true, x: t.clientX, y: t.clientY, startX: t.clientX, startY: t.clientY };
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      this._touch.x = t.clientX;
      this._touch.y = t.clientY;
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this._touch.active = false;
    }, { passive: false });
  }

  // Call at the END of each frame to clear per-frame sets
  update() {
    this._pressed.clear();
    this._released.clear();
  }

  isDown(code)     { return this._keys.has(code); }
  isPressed(code)  { return this._pressed.has(code); }
  isReleased(code) { return this._released.has(code); }

  // Convenience directional helpers
  get left()  { return this.isDown('ArrowLeft')  || this.isDown('KeyA'); }
  get right() { return this.isDown('ArrowRight') || this.isDown('KeyD'); }
  get up()    { return this.isDown('ArrowUp')    || this.isDown('KeyW'); }
  get down()  { return this.isDown('ArrowDown')  || this.isDown('KeyS'); }
  get fire()  { return this.isDown('Space')      || this.isDown('KeyX'); }
  get loop()  { return this.isPressed('KeyZ'); }

  // Touch-derived directional input (dead-zone ±10 px)
  get touchDX() {
    if (!this._touch.active) return 0;
    const d = this._touch.x - this._touch.startX;
    return Math.abs(d) > 10 ? Math.sign(d) : 0;
  }
  get touchDY() {
    if (!this._touch.active) return 0;
    const d = this._touch.y - this._touch.startY;
    return Math.abs(d) > 10 ? Math.sign(d) : 0;
  }

  destroy() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup',   this._onKeyUp);
  }
}
