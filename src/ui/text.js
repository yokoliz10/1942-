/**
 * Pixel/bitmap text helpers using Canvas fillText.
 * Provides common pre-styled text drawing utilities.
 */

export const TEXT_STYLE = {
  TITLE:   { fontSize: 16, color: '#ffffff', align: 'center' },
  HEADING: { fontSize: 10, color: '#ffff44', align: 'center' },
  BODY:    { fontSize: 7,  color: '#cccccc', align: 'center' },
  SCORE:   { fontSize: 8,  color: '#ffffff', align: 'left' },
  WARNING: { fontSize: 8,  color: '#ff4444', align: 'center' },
};

export function drawCenteredText(renderer, text, y, style = TEXT_STYLE.BODY) {
  const { NATIVE_WIDTH } = import.meta.resolve
    ? { NATIVE_WIDTH: 224 }
    : { NATIVE_WIDTH: 224 };
  renderer.drawText(text, 112, y, { ...style, align: 'center' });
}

export function drawBlinkingText(renderer, text, x, y, style, t, period = 0.8) {
  if (Math.floor(t / period) % 2 === 0) {
    renderer.drawText(text, x, y, style);
  }
}
