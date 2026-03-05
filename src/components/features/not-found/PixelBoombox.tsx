/**
 * @fileoverview Pixel art boombox rendered entirely with CSS box-shadows.
 * Each "pixel" is a 1px box-shadow scaled up via transform.
 */

import React from 'react';

const PIXEL = 4;

const C = {
  body: '#27272a',     // zinc-800
  bodyLt: '#3f3f46',   // zinc-700
  bodyDk: '#18181b',   // zinc-900
  speaker: '#52525b',  // zinc-600
  cone: '#a1a1aa',     // zinc-400
  coneInner: '#71717a',// zinc-500
  handle: '#3f3f46',   // zinc-700
  btn: '#ef4444',      // red-500 accent
  btnGreen: '#22c55e', // green-500 accent
  highlight: '#d4d4d8',// zinc-300
  black: '#09090b',    // zinc-950
};

function px(x: number, y: number, c: string) {
  return `${x}px ${y}px 0 0 ${c}`;
}

function buildShadows(): string {
  const s: string[] = [];

  // Handle (top of boombox)
  for (let x = 8; x <= 17; x++) s.push(px(x, 0, C.handle));
  for (let x = 7; x <= 18; x++) s.push(px(x, 1, C.handle));

  // Main body top edge
  for (let x = 1; x <= 24; x++) s.push(px(x, 2, C.bodyDk));

  // Body rows 3-4 (top border)
  for (let y = 3; y <= 4; y++) {
    s.push(px(0, y, C.bodyDk));
    for (let x = 1; x <= 24; x++) s.push(px(x, y, C.body));
    s.push(px(25, y, C.bodyDk));
  }

  // Left speaker area (rows 5-12)
  for (let y = 5; y <= 12; y++) {
    s.push(px(0, y, C.bodyDk));
    s.push(px(1, y, C.body));

    // Left speaker circle (cols 2-8)
    for (let x = 2; x <= 8; x++) {
      const dx = x - 5;
      const dy = y - 8.5;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1.5) {
        s.push(px(x, y, C.coneInner));
      } else if (dist < 3) {
        s.push(px(x, y, C.cone));
      } else if (dist < 4) {
        s.push(px(x, y, C.speaker));
      } else {
        s.push(px(x, y, C.body));
      }
    }

    // Middle section (cols 9-16) — tape deck / buttons
    for (let x = 9; x <= 16; x++) {
      if (y >= 5 && y <= 7) {
        // Tape deck window
        if (x >= 10 && x <= 15 && y >= 5 && y <= 7) {
          s.push(px(x, y, C.black));
        } else {
          s.push(px(x, y, C.body));
        }
      } else if (y === 9) {
        // Button row
        if (x === 10) s.push(px(x, y, C.btn));
        else if (x === 12) s.push(px(x, y, C.btnGreen));
        else if (x === 14) s.push(px(x, y, C.highlight));
        else s.push(px(x, y, C.body));
      } else if (y >= 10 && y <= 12) {
        // Equalizer bars
        if (x >= 10 && x <= 15 && y >= 10) {
          const barHeight = ((x - 10) * 3 + y) % 3;
          s.push(px(x, y, barHeight === 0 ? C.btnGreen : C.bodyLt));
        } else {
          s.push(px(x, y, C.body));
        }
      } else {
        s.push(px(x, y, C.body));
      }
    }

    // Right speaker circle (cols 17-23)
    for (let x = 17; x <= 23; x++) {
      const dx = x - 20;
      const dy = y - 8.5;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1.5) {
        s.push(px(x, y, C.coneInner));
      } else if (dist < 3) {
        s.push(px(x, y, C.cone));
      } else if (dist < 4) {
        s.push(px(x, y, C.speaker));
      } else {
        s.push(px(x, y, C.body));
      }
    }

    s.push(px(24, y, C.body));
    s.push(px(25, y, C.bodyDk));
  }

  // Body bottom edge (rows 13-14)
  for (let y = 13; y <= 14; y++) {
    s.push(px(0, y, C.bodyDk));
    for (let x = 1; x <= 24; x++) s.push(px(x, y, y === 13 ? C.bodyLt : C.bodyDk));
    s.push(px(25, y, C.bodyDk));
  }

  // Feet
  for (const fx of [3, 4, 21, 22]) {
    s.push(px(fx, 15, C.bodyDk));
  }

  return s.join(',');
}

const shadows = buildShadows();

export function PixelBoombox({ className = '' }: { className?: string }) {
  return (
    <div
      className={className}
      aria-hidden="true"
      style={{
        width: 26 * PIXEL,
        height: 16 * PIXEL,
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${PIXEL}px`,
          height: `${PIXEL}px`,
          boxShadow: shadows,
          transform: `scale(${PIXEL})`,
          transformOrigin: 'top left',
          imageRendering: 'pixelated',
        }}
      />
    </div>
  );
}
