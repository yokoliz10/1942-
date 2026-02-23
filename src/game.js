import { Renderer }           from './engine/renderer.js';
import { Input }              from './engine/input.js';
import { SoundManager }       from './engine/soundManager.js';
import { ScoreManager }       from './systems/scoreManager.js';
import { TitleScene }         from './scenes/titleScene.js';
import { GameScene }          from './scenes/gameScene.js';
import { StageCompleteScene } from './scenes/stageCompleteScene.js';
import { GameOverScene }      from './scenes/gameOverScene.js';
import { FIXED_TIMESTEP }     from './config.js';

export class Game {
  constructor(canvas) {
    this.renderer     = new Renderer(canvas);
    this.input        = new Input();
    this.soundManager = new SoundManager();
    this.scoreManager = new ScoreManager();

    this._scenes = {
      title:         new TitleScene(this),
      game:          new GameScene(this),
      stageComplete: new StageCompleteScene(this),
      gameOver:      new GameOverScene(this),
    };

    this._currentScene = null;
    this._accumulator  = 0;
    this._lastTime     = 0;
    this._rafId        = null;
    this._running      = false;
  }

  start() {
    this.switchScene('title');
    this._running  = true;
    this._lastTime = performance.now();
    this._loop(this._lastTime);
  }

  switchScene(name) {
    if (this._currentScene) this._currentScene.exit();
    const next = this._scenes[name];
    if (!next) throw new Error(`Unknown scene: "${name}"`);
    this._currentScene = next;
    next.enter();
  }

  _loop(timestamp) {
    if (!this._running) return;

    const dt = Math.min((timestamp - this._lastTime) / 1000, 0.1); // cap at 100ms
    this._lastTime = timestamp;

    this._accumulator += dt * 1000; // convert to ms

    // Fixed-timestep update (consume accumulated time in chunks)
    while (this._accumulator >= FIXED_TIMESTEP) {
      // M키 — 전역 음소거 토글 (모든 씬에서 동작)
      if (this.input.isPressed('KeyM')) {
        this.soundManager.toggleMute();
      }
      this._currentScene?.update(FIXED_TIMESTEP / 1000);
      this.input.update(); // flush per-frame keys AFTER scene update
      this._accumulator -= FIXED_TIMESTEP;
    }

    // Render at display frame rate
    this.renderer.clear('#000000');
    this._currentScene?.render(this.renderer);

    this._rafId = requestAnimationFrame((ts) => this._loop(ts));
  }

  stop() {
    this._running = false;
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this.input.destroy();
  }
}
