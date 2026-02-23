// Original arcade resolution
export const NATIVE_WIDTH  = 224;
export const NATIVE_HEIGHT = 256;

// Display scale factor
export const SCALE = 3;

export const CANVAS_WIDTH  = NATIVE_WIDTH  * SCALE; // 672
export const CANVAS_HEIGHT = NATIVE_HEIGHT * SCALE; // 768

// Game loop
export const TARGET_FPS       = 60;
export const FIXED_TIMESTEP   = 1000 / TARGET_FPS; // ms per frame

// Player
export const PLAYER_SPEED        = 120; // pixels/sec (native scale)
export const PLAYER_SPEED_BOOST  = 35;  // added per speed-up level
export const PLAYER_MAX_SPEED_LV = 2;
export const PLAYER_BULLET_SPEED = 280;
export const PLAYER_FIRE_RATE    = 0.15; // seconds between shots
export const PLAYER_LIVES        = 3;
export const PLAYER_LOOP_DURATION = 2.0; // seconds for loop manoeuvre
export const PLAYER_LOOP_USES     = 3;   // uses per stage

// Bullets
export const BULLET_POOL_SIZE     = 64;
export const ENEMY_BULLET_SPEED   = 100;

// Enemies
export const FIGHTER_SCORE     = 150;
export const BOMBER_SCORE      = 300;
export const DIVE_BOMBER_SCORE = 200;
export const BOSS_SCORE        = 3000;

// Scrolling
export const SCROLL_SPEED     = 40;  // pixels/sec (native scale)
export const CLOUD_SPEED_1    = 20;
export const CLOUD_SPEED_2    = 35;

// Wave / Stage
export const TOTAL_STAGES = 32;

// Colours (CSS strings used by canvas context)
export const COLOR_BG       = '#1a1a2e';
export const COLOR_OCEAN    = '#0f4c81';
export const COLOR_HUD_TEXT = '#ffffff';
export const COLOR_SCORE    = '#ffff00';
