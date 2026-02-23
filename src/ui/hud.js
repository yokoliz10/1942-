import { NATIVE_WIDTH, SCALE, PLAYER_LOOP_USES } from '../config.js';

const WEAPON_LABEL = { single: 'SINGLE', double: 'DOUBLE', shotgun: 'SHOTGUN' };
const WEAPON_COLOR = { single: '#999999', double: '#00eeff', shotgun: '#ff8800' };

export class HUD {
  render(renderer, scoreManager, player, boss = null, muted = false) {
    const { score, hiscore, stage } = scoreManager;
    const lives      = player?.lives      ?? 0;
    const weaponType = player?.weaponType ?? 'single';
    const speedLevel = player?.speedLevel ?? 0;
    const loopUses   = player?.loopUses   ?? 0;
    const ctx        = renderer.context;
    const S          = SCALE;
    const W          = NATIVE_WIDTH;

    // ── 상단 반투명 띠 ────────────────────────────────────────────────
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, W * S, 17 * S);
    ctx.restore();

    // SCORE (좌)
    renderer.drawText('SCORE', 2, 2,  { fontSize: 5, color: '#888888' });
    renderer.drawText(String(score).padStart(8, '0'), 2, 9,
      { fontSize: 6, color: '#ffffff' });

    // HI (중앙)
    renderer.drawText('HI', W / 2, 2,
      { fontSize: 5, color: '#888888', align: 'center' });
    renderer.drawText(String(hiscore).padStart(8, '0'), W / 2, 9,
      { fontSize: 6, color: '#ffff44', align: 'center' });

    // STAGE (우)
    renderer.drawText(`STG ${String(stage).padStart(2, '0')}`, W - 2, 2,
      { fontSize: 5, color: '#aaaaaa', align: 'right' });
    renderer.drawText(muted ? '[MUTE]' : 'STAGE', W - 2, 9,
      { fontSize: 4, color: muted ? '#ff4444' : '#555555', align: 'right' });

    // ── 하단 반투명 띠 ────────────────────────────────────────────────
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 244 * S, W * S, 12 * S);
    ctx.restore();

    // 잔기 — 미니 비행기 아이콘
    this._drawLives(renderer, lives);

    // 루프 남은 횟수 — 작은 사각 아이콘 3개
    this._drawLoopUses(renderer, loopUses);

    // 무기 타입
    const wColor = WEAPON_COLOR[weaponType] ?? '#999999';
    const wLabel = WEAPON_LABEL[weaponType] ?? 'SINGLE';
    renderer.drawText(`[${wLabel}]`, W / 2, 248,
      { fontSize: 5, color: wColor, align: 'center' });

    // 속도 레벨
    if (speedLevel > 0) {
      renderer.drawText('▶'.repeat(speedLevel), W - 2, 248,
        { fontSize: 5, color: '#44ff88', align: 'right' });
    }

    // 콤보
    if (scoreManager.combo > 2) {
      renderer.drawText(`×${scoreManager.combo} COMBO`, W - 2, 237,
        { fontSize: 5, color: '#ffaa00', align: 'right' });
    }

    // 보스 HP 바 (보스 활성 시에만)
    if (boss?.active) {
      this._drawBossHPBar(renderer, boss, W);
    }
  }

  // 잔기를 미니 P-38 실루엣으로 표시 (최대 5기까지 아이콘, 그 이상은 숫자)
  _drawLives(renderer, lives) {
    if (lives <= 0) return;

    if (lives <= 5) {
      for (let i = 0; i < lives; i++) {
        this._drawMiniPlane(renderer, 3 + i * 11, 245);
      }
    } else {
      // 아이콘 1개 + ×숫자
      this._drawMiniPlane(renderer, 3, 245);
      renderer.drawText(`×${lives}`, 16, 248,
        { fontSize: 5, color: '#ffffff' });
    }
  }

  // 보스 HP 바 — HUD 상단 스트립 바로 아래 (y=17 ~ y=25)
  _drawBossHPBar(renderer, boss, W) {
    const ratio = Math.max(0, boss.hp / boss.maxHp);
    const phase = ratio > 0.66 ? 2 : ratio > 0.33 ? 1 : 0;

    // 반투명 배경
    const ctx = renderer.context;
    const S   = SCALE;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.70)';
    ctx.fillRect(0, 17 * S, W * S, 9 * S);
    ctx.restore();

    // 트랙 (어두운 배경)
    renderer.fillRect(18, 19, W - 22, 5, '#330000');

    // HP 바 (페이즈별 색상)
    const barColor = phase === 2 ? '#22dd44' : phase === 1 ? '#ffcc00' : '#ff2222';
    renderer.fillRect(18, 19, Math.floor((W - 22) * ratio), 5, barColor);

    // 바 테두리
    renderer.fillRect(17, 18, W - 20, 1, '#553311');
    renderer.fillRect(17, 24, W - 20, 1, '#553311');

    // BOSS 레이블
    renderer.drawText('BOSS', 2, 18, { fontSize: 5, color: '#ff7744' });

    // HP 숫자
    renderer.drawText(`${boss.hp}/${boss.maxHp}`, W - 2, 18,
      { fontSize: 4, color: '#cccccc', align: 'right' });
  }

  // 루프 남은 횟수: 작은 사각 아이콘 (활성=파랑, 소진=어두운 회색)
  // 잔기 아이콘 아래(y=252) 좌측에 배치
  _drawLoopUses(renderer, uses) {
    for (let i = 0; i < PLAYER_LOOP_USES; i++) {
      const color = i < uses ? '#5599ff' : '#1c2c3c';
      // 6×4 사각형, 중앙에 2×2 밝은 점 (사용 가능일 때)
      renderer.fillRect(3 + i * 8, 252, 6, 4, color);
      if (i < uses) {
        renderer.fillRect(5 + i * 8, 253, 2, 2, '#aaccff');
      }
    }
    // 'Z' 키 레이블 (맨 오른쪽 아이콘 옆)
    renderer.drawText('[Z]', 3 + PLAYER_LOOP_USES * 8 + 1, 252,
      { fontSize: 4, color: '#446688' });
  }

  // 8×8 미니 P-38 실루엣
  _drawMiniPlane(renderer, x, y) {
    renderer.fillRect(x + 3, y,     2, 7, '#c0c0c0'); // 동체
    renderer.fillRect(x + 1, y + 2, 1, 4, '#909090'); // 좌 붐
    renderer.fillRect(x + 6, y + 2, 1, 4, '#909090'); // 우 붐
    renderer.fillRect(x,     y + 3, 8, 2, '#a0a0d0'); // 날개
  }
}
