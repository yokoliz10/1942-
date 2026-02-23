/**
 * TouchControls — 가상 조이스틱 + 액션 버튼
 *
 * 조이스틱: 왼쪽 영역(#leftControl)에 손가락을 댄 위치를 원점으로
 *           플로팅 베이스가 생기고, 손가락을 움직이면 ArrowKey를 주입.
 * 버튼:
 *   FIRE  (#btnFire)  — 누르는 동안 Space 유지
 *   LOOP  (#btnLoop)  — 탭 시 KeyZ 한 프레임 주입
 *   PAUSE (#btnPause) — 탭 시 KeyP 한 프레임 주입
 */

const MAX_TRAVEL = 42; // 조이스틱 노브 최대 이동 거리 (CSS px)
const DEAD_ZONE  = 0.18; // 방향 인식 데드 존 (0 ~ 1)

export class TouchControls {
  constructor(input) {
    this._input = input;

    this._joyId     = null;          // 추적 중인 터치 ID
    this._joyOrigin = { x: 0, y: 0 }; // 터치 시작 지점 (clientX/Y)

    this._leftZone = document.getElementById('leftControl');
    this._base     = document.getElementById('joystickBase');
    this._knob     = document.getElementById('joystickKnob');
    this._btnFire  = document.getElementById('btnFire');
    this._btnLoop  = document.getElementById('btnLoop');
    this._btnPause = document.getElementById('btnPause');

    // 터치 컨트롤 DOM이 없으면 (데스크톱) 아무 것도 하지 않음
    if (!this._leftZone) return;

    this._setupJoystick();
    this._setupHoldButton(this._btnFire, 'Space');
    this._setupTapButton(this._btnLoop,  'KeyZ');
    this._setupTapButton(this._btnPause, 'KeyP');
  }

  // ── 플로팅 조이스틱 ─────────────────────────────────────────────────────
  _setupJoystick() {
    const zone = this._leftZone;

    zone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this._joyId !== null) return; // 이미 추적 중

      const t = e.changedTouches[0];
      this._joyId     = t.identifier;
      this._joyOrigin = { x: t.clientX, y: t.clientY };

      // 베이스를 터치 위치에 나타냄
      if (this._base) {
        const rect = zone.getBoundingClientRect();
        this._base.style.left = (t.clientX - rect.left) + 'px';
        this._base.style.top  = (t.clientY - rect.top)  + 'px';
        this._base.classList.add('active');
      }

      this._applyJoy(t.clientX, t.clientY);
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (this._joyId === null) return;
      for (const t of e.changedTouches) {
        if (t.identifier === this._joyId) {
          e.preventDefault();
          this._applyJoy(t.clientX, t.clientY);
          return;
        }
      }
    }, { passive: false });

    const onEnd = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === this._joyId) {
          this._joyId = null;
          this._resetJoy();
          return;
        }
      }
    };
    window.addEventListener('touchend',    onEnd);
    window.addEventListener('touchcancel', onEnd);
  }

  _applyJoy(cx, cy) {
    const dx   = cx - this._joyOrigin.x;
    const dy   = cy - this._joyOrigin.y;
    const dist = Math.hypot(dx, dy);
    const cap  = Math.min(dist, MAX_TRAVEL);
    const ang  = Math.atan2(dy, dx);

    // 노브 위치 업데이트
    if (this._knob) {
      const kx = Math.cos(ang) * cap;
      const ky = Math.sin(ang) * cap;
      this._knob.style.transform =
        `translate(calc(-50% + ${kx}px), calc(-50% + ${ky}px))`;
    }

    // 방향 키 주입 (단위 벡터 기준)
    const nx = dist > 0 ? dx / dist : 0;
    const ny = dist > 0 ? dy / dist : 0;
    this._input.setVirtualKey('ArrowLeft',  nx < -DEAD_ZONE);
    this._input.setVirtualKey('ArrowRight', nx >  DEAD_ZONE);
    this._input.setVirtualKey('ArrowUp',    ny < -DEAD_ZONE);
    this._input.setVirtualKey('ArrowDown',  ny >  DEAD_ZONE);
  }

  _resetJoy() {
    if (this._base) this._base.classList.remove('active');
    if (this._knob) this._knob.style.transform = 'translate(-50%, -50%)';
    this._input.setVirtualKey('ArrowLeft',  false);
    this._input.setVirtualKey('ArrowRight', false);
    this._input.setVirtualKey('ArrowUp',    false);
    this._input.setVirtualKey('ArrowDown',  false);
  }

  // ── 홀드 버튼 (누르는 동안 키를 계속 유지) ────────────────────────────
  _setupHoldButton(el, code) {
    if (!el) return;
    el.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this._input.setVirtualKey(code, true);
    }, { passive: false });
    el.addEventListener('touchend', (e) => {
      e.preventDefault();
      this._input.setVirtualKey(code, false);
    }, { passive: false });
    el.addEventListener('touchcancel', () => {
      this._input.setVirtualKey(code, false);
    });
  }

  // ── 탭 버튼 (한 프레임만 눌림으로 처리) ──────────────────────────────
  _setupTapButton(el, code) {
    if (!el) return;
    el.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this._input.setVirtualKey(code, true);
      // 다음 RAF에서 해제 → isPressed 가 딱 한 프레임만 true
      requestAnimationFrame(() => this._input.setVirtualKey(code, false));
    }, { passive: false });
    el.addEventListener('touchend', (e) => e.preventDefault(), { passive: false });
  }
}
