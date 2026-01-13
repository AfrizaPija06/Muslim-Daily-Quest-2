
import React from 'react';

interface BackgroundOrnamentProps {
  colorClass: string;
}

const BackgroundOrnament: React.FC<BackgroundOrnamentProps> = ({ colorClass }) => (
  <div className={`fixed inset-0 pointer-events-none opacity-5 overflow-hidden ${colorClass}`}>
    <svg width="100%" height="100%">
      <pattern id="pattern-hex" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
        <path d="M25 0L50 12.5V37.5L25 50L0 37.5V12.5L25 0Z" fill="none" stroke="currentColor" strokeWidth="1" />
      </pattern>
      <rect width="100%" height="100%" fill="url(#pattern-hex)" />
    </svg>
  </div>
);

export default BackgroundOrnament;
