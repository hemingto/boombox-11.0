/**
 * @fileoverview Retro block wall resembling Mario-style ground bricks.
 * Renders two rows of 3D blocks using pure CSS with highlight/shadow edges.
 */

import React from 'react';

function Block() {
  return (
    <div
      className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0"
      style={{
        background: '#52525b',
        borderTop: '3px solid #a1a1aa',
        borderLeft: '3px solid #a1a1aa',
        borderRight: '3px solid #27272a',
        borderBottom: '3px solid #27272a',
        boxShadow: 'inset 1px 1px 0 #71717a, inset -1px -1px 0 #3f3f46',
        imageRendering: 'pixelated',
      }}
    />
  );
}

export function BlockWall({ className = '' }: { className?: string }) {
  const blockCount = 40;

  return (
    <div className={`w-full overflow-hidden ${className}`} aria-hidden="true">
      {[0, 1].map((row) => (
        <div key={row} className="flex" style={{ marginTop: row === 0 ? 0 : -1 }}>
          {Array.from({ length: blockCount }).map((_, i) => (
            <Block key={`${row}-${i}`} />
          ))}
        </div>
      ))}
    </div>
  );
}
