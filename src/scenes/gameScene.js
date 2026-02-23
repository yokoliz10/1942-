import { Scene }       from './scene.js';
import { Player }      from '../entities/player.js';
import { Bullet }      from '../entities/bullet.js';
import { Powerup, POWERUP_TYPE, randomPowerupType } from '../entities/powerup.js';
import { WEAPON } from '../entities/player.js';
import { Fighter }     from '../entities/enemies/fighter.js';
import { Bomber }      from '../entities/enemies/bomber.js';
import { DiveBomber }  from '../entities/enemies/diveBomber.js';
import { Boss }        from '../entities/enemies/boss.js';
import { Scroller }    from '../background/scroller.js';
import { OceanLayer }  from '../background/ocean.js';
import { CloudLayer }  from '../background/cloudLayer.js';
import { PoolManager } from '../systems/poolManager.js';
import { WaveManager } from '../systems/waveManager.js';
import { HUD }         from '../ui/hud.js';
import { checkBulletsVsTargets, entitiesOverlap } from '../engine/collision.js';
import { BULLET_POOL_SIZE, NATIVE_WIDTH, NATIVE_HEIGHT } from '../config.js';

// 점수 획득 팝업 텍스트 (위로 떠오르며 페이드아웃)
class ScorePopup {
  constructor(points, x, y) {
    this.x      = x;
    this.y      = y;
    this.vy     = -28;        // 위로 이동 px/s
    this.t      = 0;
    this.dur    = 0.9;
    this.active = true;
    // 점수에 따라 색상 변화
    this.color  = points >= 3000 ? '#ff8800'
                : points >= 300  ? '#ffcc00'
                :                  '#ffff88';
    this.text   = `+${points}`;
  }
  update(dt) {
    this.t  += dt;
    this.y  += this.vy * dt;
    if (this.t >= this.dur) this.active = false;
  }
  render(renderer) {
    const alpha = Math.max(0, 1 - this.t / this.dur);
    const a     = Math.floor(alpha * 255).toString(16).padStart(2, '0');
    renderer.drawText(this.text, this.x, this.y,
      { fontSize: 5, color: this.color + a, align: 'center' });
  }
}

// Explosion particle (simple, no pool needed at low counts)
class Explosion {
  constructor(x, y, size = 1) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.t    = 0;
    this.dur  = 0.4 + size * 0.2;
    this.active = true;
  }
  update(dt) {
    this.t += dt;
    if (this.t >= this.dur) this.active = false;
  }
  render(renderer) {
    const p  = this.t / this.dur;
    const s  = this.size;
    const cx = Math.round(this.x);
    const cy = Math.round(this.y);
    const a  = Math.floor((1 - p) * 240).toString(16).padStart(2, '0');

    // 확장 반지름
    const r  = Math.ceil(s * 8 * p);
    const r2 = Math.ceil(r * 0.65); // 대각선 파편

    // 단계별 색상: 섬광 → 화염 → 연기
    const core  = p < 0.3 ? `#ffffff${a}` : p < 0.6 ? `#ffee44${a}` : `#ff8800${a}`;
    const mid   = p < 0.3 ? `#ffee44${a}` : p < 0.6 ? `#ff8800${a}` : `#cc3300${a}`;
    const outer = p < 0.3 ? `#ff8800${a}` : p < 0.6 ? `#cc3300${a}` : `#663300${a}`;

    // 중심 코어
    renderer.fillRect(cx - s, cy - s, s * 2, s * 2, core);

    // 십자(+) 폭발 팔
    if (r > s) {
      renderer.fillRect(cx - r,   cy - s, r - s, s * 2, mid);   // 좌
      renderer.fillRect(cx + s,   cy - s, r - s, s * 2, mid);   // 우
      renderer.fillRect(cx - s, cy - r,   s * 2, r - s, mid);   // 상
      renderer.fillRect(cx - s, cy + s,   s * 2, r - s, mid);   // 하
    }

    // 대각선 파편 (×)
    if (r2 > s) {
      renderer.fillRect(cx - r2 - s, cy - r2 - s, s * 2, s * 2, outer);
      renderer.fillRect(cx + r2 - s, cy - r2 - s, s * 2, s * 2, outer);
      renderer.fillRect(cx - r2 - s, cy + r2 - s, s * 2, s * 2, outer);
      renderer.fillRect(cx + r2 - s, cy + r2 - s, s * 2, s * 2, outer);
    }
  }
}

export class GameScene extends Scene {
  constructor(game) {
    super(game);
    this._hud          = new HUD();
    this._explosions   = [];
    this._powerups     = [];
    this._paused       = false;
    this._stageTimer   = 0;
    this._bossRef      = null;
  }

  enter() {
    const sm = this.game.scoreManager;

    // Reset player
    this._player = new Player();
    this._player.lives = 3;

    // Bullet pools
    this._playerBulletPool = new PoolManager(() => new Bullet(), BULLET_POOL_SIZE);
    this._enemyBulletPool  = new PoolManager(() => new Bullet(), BULLET_POOL_SIZE);

    // 타입별 전용 풀 (타입 혼재 버그 방지)
    this._fighterPool    = new PoolManager(() => new Fighter(),    20);
    this._bomberPool     = new PoolManager(() => new Bomber(),     8);
    this._diveBomberPool = new PoolManager(() => new DiveBomber(), 8);

    // Boss single instance
    this._boss = new Boss();
    this._boss.active = false;

    // ── 스테이지 테마 설정 ────────────────────────────────────────────────
    const themeIdx    = (sm.stage - 1) % 3; // 0=day,1=sunset,2=night
    const oceanTheme  = ['day', 'sunset', 'night'][themeIdx];
    const cloudColor  = ['#e8eaf0', '#d49070', '#353558'][themeIdx];
    const cloudOp1    = [0.50, 0.42, 0.22][themeIdx];
    const cloudOp2    = [0.35, 0.28, 0.15][themeIdx];
    const baseSpeed   = [40, 54, 68][themeIdx];
    const cycleBonus  = Math.floor((sm.stage - 1) / 3) * 6; // 사이클마다 +6
    const scrollSpeed = Math.min(baseSpeed + cycleBonus, 120);

    // Background
    this._scroller = new Scroller();
    this._scroller.addLayer(new OceanLayer(oceanTheme));
    this._scroller.addLayer(new CloudLayer(20, cloudOp1, 10, cloudColor));
    this._scroller.addLayer(new CloudLayer(35, cloudOp2,  8, cloudColor));
    this._scroller.setSpeed(scrollSpeed);

    // Wave manager
    this._waveManager = new WaveManager();
    this._waveManager.setPools({
      fighterPool:    this._fighterPool,
      bomberPool:     this._bomberPool,
      diveBomberPool: this._diveBomberPool,
      boss:           this._boss,
    });
    this._waveManager.loadWave(sm.stage - 1);
    this._waveManager.onBossSpawned = (boss) => {
      this._bossRef = boss;
      // 스테이지별 보스 HP 강화
      boss.maxHp += this._bossHpBonus;
      boss.hp     = boss.maxHp;
      this.game.soundManager?.stopBGM();
      this.game.soundManager?.play('boss_warning');
      setTimeout(() => this.game.soundManager?.play('bgm_boss'), 2800);
    };
    this._waveManager.onWaveComplete = () => {
      setTimeout(() => this.game.switchScene('stageComplete'), 1500);
    };

    this._stageTimer  = 0;
    this._paused      = false;
    this._explosions  = [];
    this._powerups    = [];
    this._scorePopups = [];
    this._pickupMsg   = '';
    this._pickupColor = '#ffffff';
    this._pickupTimer = 0;

    // 스테이지 진입 안내 (플레이어는 인트로 동안 무적)
    this._introTimer  = 2.8;
    this._player._invincible      = true;
    this._player._invincibleTimer = 3.2;

    // 보스 HP 스테이지 스케일링 (onBossSpawned 에서 적용)
    this._bossHpBonus = Math.min(sm.stage - 1, 12) * 8; // 최대 +96

    this.game.soundManager?.play('bgm_stage', { loop: true });
  }

  exit() {}

  update(dt) {
    if (this._paused) return;

    const input = this.game.input;
    const sm    = this.game.scoreManager;

    // Pause toggle
    if (input.isPressed('KeyP') || input.isPressed('Escape')) {
      this._paused = !this._paused;
      return;
    }

    // 스테이지 인트로 카운트다운
    if (this._introTimer > 0) this._introTimer -= dt;

    this._stageTimer += dt;
    sm.update(dt);

    // Background
    this._scroller.update(dt);

    // Player
    this._player.update(dt, input, this._playerBulletPool, this.game.soundManager);

    // Player bullets
    for (const b of this._playerBulletPool.getAll()) b.update(dt);

    // Enemy bullets
    for (const b of this._enemyBulletPool.getAll()) b.update(dt);

    // Enemies (타입별 풀 순회)
    for (const pool of [this._fighterPool, this._bomberPool, this._diveBomberPool]) {
      for (const e of pool.getAll()) {
        if (!e.active) continue;
        e.update(dt, this._enemyBulletPool);
      }
    }

    // Boss
    if (this._boss.active) {
      this._boss.update(dt, this._enemyBulletPool, this._player.cx, this._player.cy);
    }

    // Wave manager
    this._waveManager.update(dt, this._enemyBulletPool, this._player.cx);

    // Powerups
    for (const p of this._powerups) p.update(dt);
    this._powerups = this._powerups.filter(p => p.active);

    // Explosions
    for (const ex of this._explosions) ex.update(dt);
    this._explosions = this._explosions.filter(ex => ex.active);

    // 픽업 메시지 타이머
    if (this._pickupTimer > 0) this._pickupTimer -= dt;

    // 점수 팝업
    for (const p of this._scorePopups) p.update(dt);
    this._scorePopups = this._scorePopups.filter(p => p.active);

    // ── Collision detection ──────────────────────────────────────────────

    // Player bullets vs enemies (전체 활성 적 목록)
    const playerBullets = this._playerBulletPool.getAll().filter(b => b.active);
    const enemies       = this._waveManager.getActiveEnemies().filter(e => e !== this._boss);

    checkBulletsVsTargets(playerBullets, enemies, (bullet, enemy) => {
      bullet.active = false;
      const destroyed = enemy.hit(bullet.damage);
      if (destroyed) {
        this._onEnemyDestroyed(enemy, sm);
      }
    });

    // Player bullets vs boss
    if (this._boss.active) {
      for (const b of playerBullets) {
        if (!b.active) continue;
        if (entitiesOverlap(b, this._boss)) {
          b.active = false;
          const destroyed = this._boss.hit(b.damage);
          if (destroyed) {
            this._onBossDestroyed(sm);
          }
        }
      }
    }

    // Enemy bullets vs player
    if (!this._player.isInvincible) {
      const enemyBullets = this._enemyBulletPool.getAll().filter(b => b.active);
      for (const b of enemyBullets) {
        if (entitiesOverlap(b, this._player)) {
          b.active = false;
          const died = this._player.hit();
          if (died) {
            this._spawnExplosion(this._player.cx, this._player.cy, 2);
            this.game.soundManager?.play('explosion');
            if (this._player.lives <= 0) {
              setTimeout(() => this.game.switchScene('gameOver'), 1800);
            }
          } else {
            this._spawnExplosion(this._player.cx, this._player.cy, 1);
            this.game.soundManager?.play('player_hit');
          }
        }
      }
    }

    // Enemy bodies vs player (ram damage)
    if (!this._player.isLooping && !this._player.isInvincible) {
      for (const e of this._waveManager.getActiveEnemies().filter(e => e !== this._boss)) {
        if (entitiesOverlap(e, this._player)) {
          e.active = false;
          this._spawnExplosion(e.cx, e.cy, 1);
          const died = this._player.hit();
          if (died) {
            this._spawnExplosion(this._player.cx, this._player.cy, 2);
            this.game.soundManager?.play('explosion');
            if (this._player.lives <= 0) {
              setTimeout(() => this.game.switchScene('gameOver'), 1800);
            }
          } else {
            this.game.soundManager?.play('player_hit');
          }
        }
      }
    }

    // Powerup vs player
    for (const pu of this._powerups) {
      if (entitiesOverlap(pu, this._player)) {
        pu.active = false;
        this._applyPowerup(pu.type);
        this.game.soundManager?.play('powerup');
      }
    }
  }

  _onEnemyDestroyed(enemy, sm) {
    const earned = sm.addScore(enemy.scoreValue);
    this._spawnExplosion(enemy.cx, enemy.cy);
    this.game.soundManager?.play('explosion');
    this._scorePopups.push(new ScorePopup(earned, enemy.cx, enemy.cy - 4));

    // 편대 전멸 보너스
    const fg = enemy.formationGroup;
    if (fg && fg.notifyKill()) {
      sm.addScore(fg.bonus);
      this._scorePopups.push(new ScorePopup(fg.bonus, enemy.cx, enemy.cy - 16));
      this._showPickupText(`FORMATION! +${fg.bonus}`, '#ffff00');
    }

    // Chance to drop powerup
    if (Math.random() < 0.15) {
      this._spawnPowerup(enemy.cx, enemy.cy);
    }
  }

  _onBossDestroyed(sm) {
    const earned = sm.addScore(this._boss.scoreValue);
    this._scorePopups.push(new ScorePopup(earned, this._boss.cx, this._boss.cy));
    this._spawnExplosion(this._boss.cx, this._boss.cy, 3);
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        if (this._boss) {
          this._spawnExplosion(
            this._boss.x + Math.random() * this._boss.width,
            this._boss.y + Math.random() * this._boss.height,
          );
        }
      }, i * 150);
    }
    this.game.soundManager?.stopBGM();
    this.game.soundManager?.play('explosion');
    this._waveManager.notifyBossDefeated();
    setTimeout(() => this.game.switchScene('stageComplete'), 2500);
  }

  _spawnExplosion(x, y, size = 1) {
    this._explosions.push(new Explosion(x, y, size));
  }

  _spawnPowerup(x, y) {
    const pu = new Powerup();
    pu.spawn(x, y, randomPowerupType());
    this._powerups.push(pu);
  }

  _applyPowerup(type) {
    switch (type) {
      case POWERUP_TYPE.DOUBLE:
        this._player.weaponType = WEAPON.DOUBLE;
        this._showPickupText('DOUBLE SHOT!', '#00eeff');
        break;
      case POWERUP_TYPE.SHOTGUN:
        this._player.weaponType = WEAPON.SHOTGUN;
        this._showPickupText('SHOTGUN!', '#ff8800');
        break;
      case POWERUP_TYPE.SPEED:
        this._player.speedLevel = Math.min(2, this._player.speedLevel + 1);
        this._showPickupText('SPEED UP!', '#44ff88');
        break;
      case POWERUP_TYPE.EXTRA_LIFE:
        this._player.lives++;
        this._showPickupText('1UP!!', '#ff44ff');
        break;
      case POWERUP_TYPE.BOMB:
        for (const e of this._waveManager.getActiveEnemies()) {
          if (e !== this._boss) {
            this._onEnemyDestroyed(e, this.game.scoreManager);
            e.active = false;
          }
        }
        for (const b of this._enemyBulletPool.getAll()) b.active = false;
        this._showPickupText('BOMB!', '#ff6600');
        break;
    }
  }

  // 스테이지 진입 안내 오버레이
  _renderStageIntro(renderer, stage) {
    const INTRO_DUR  = 2.8;
    const FADE_IN    = 0.4;
    const FADE_OUT   = 0.7;
    const elapsed    = INTRO_DUR - this._introTimer;
    const alpha      = elapsed < FADE_IN
      ? elapsed / FADE_IN
      : this._introTimer < FADE_OUT
        ? this._introTimer / FADE_OUT
        : 1;

    if (alpha <= 0) return;

    const W  = NATIVE_WIDTH;
    const H  = NATIVE_HEIGHT;
    const a  = Math.floor(alpha * 220).toString(16).padStart(2, '0');
    const ta = Math.floor(alpha * 255).toString(16).padStart(2, '0');

    // 반투명 배경
    renderer.fillRect(0, 0, W, H, `#000000${a}`);

    // 가로 구분선 + 배너 배경
    renderer.fillRect(0, H * 0.34, W, 50, `#00000060`);
    renderer.fillRect(0, H * 0.33, W, 1,  `#ffffff30`);
    renderer.fillRect(0, H * 0.56, W, 1,  `#ffffff30`);

    // "STAGE" 라벨
    renderer.drawText('STAGE', W / 2, H * 0.35, {
      fontSize: 7, color: `#aabbcc${ta}`, align: 'center',
    });

    // 큰 스테이지 번호
    renderer.drawText(String(stage), W / 2, H * 0.39, {
      fontSize: 20, color: `#ffffff${ta}`, align: 'center',
    });

    // 스테이지 부제 (테마별)
    const THEME_NAMES = ['PACIFIC OCEAN', 'CORAL SEA', 'NIGHT MISSION'];
    const cycle       = Math.floor((stage - 1) / 3);
    const base        = THEME_NAMES[(stage - 1) % 3];
    const suffix      = cycle === 0 ? '' : ` ${['II','III','IV','V'][cycle - 1] ?? cycle + 1}`;
    renderer.drawText(base + suffix, W / 2, H * 0.545, {
      fontSize: 6, color: `#88aacc${ta}`, align: 'center',
    });
  }

  // 파워업 획득 메시지 (1초 표시)
  _showPickupText(text, color) {
    this._pickupMsg      = text;
    this._pickupColor    = color;
    this._pickupTimer    = 1.2;
  }

  render(renderer) {
    // Background layers
    this._scroller.render(renderer);

    // Powerups (below player)
    for (const pu of this._powerups) pu.render(renderer);

    // Player bullets
    for (const b of this._playerBulletPool.getAll()) b.render(renderer);

    // Enemies
    for (const pool of [this._fighterPool, this._bomberPool, this._diveBomberPool]) {
      for (const e of pool.getAll()) e.render(renderer);
    }

    // Boss
    if (this._boss.active) this._boss.render(renderer);

    // Enemy bullets
    for (const b of this._enemyBulletPool.getAll()) b.render(renderer);

    // Player
    this._player.render(renderer);

    // Explosions
    for (const ex of this._explosions) ex.render(renderer);

    // HUD (topmost layer)
    this._hud.render(renderer, this.game.scoreManager, this._player, this._boss,
      this.game.soundManager?.muted ?? false);

    // 점수 팝업 렌더
    for (const p of this._scorePopups) p.render(renderer);

    // 파워업 획득 메시지
    if (this._pickupTimer > 0) {
      const alpha = Math.min(1, this._pickupTimer * 2);
      const a     = Math.floor(alpha * 255).toString(16).padStart(2, '0');
      renderer.drawText(this._pickupMsg, 112, 110, {
        fontSize: 8, color: this._pickupColor + a, align: 'center',
      });
    }

    // 스테이지 진입 안내 오버레이
    if (this._introTimer > 0) {
      this._renderStageIntro(renderer, this.game.scoreManager.stage);
    }

    // Pause overlay
    if (this._paused) {
      renderer.fillRect(0, 0, 224, 256, '#00000088');
      renderer.drawText('PAUSED', 112, 120, {
        fontSize: 14, color: '#ffffff', align: 'center',
      });
      renderer.drawText('PRESS P TO RESUME', 112, 140, {
        fontSize: 6, color: '#aaaaaa', align: 'center',
      });
    }
  }
}
