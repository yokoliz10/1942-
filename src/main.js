import { Game } from './game.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  const game   = new Game(canvas);
  game.start();

  // Expose for debugging in DevTools
  window.__game = game;
});
