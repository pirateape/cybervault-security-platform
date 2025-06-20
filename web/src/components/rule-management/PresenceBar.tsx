import React from 'react';

export interface PresenceBarProps {
  peers: string[];
}

/**
 * PresenceBar displays avatars of users currently present in the editor.
 * @param peers List of peer names
 */
export const PresenceBar: React.FC<PresenceBarProps> = ({ peers }) => (
  <div className="flex items-center gap-2 mb-2" aria-label="Presence Bar">
    {peers.length > 1 && (
      <span className="text-success font-bold animate-pulse">Live editing</span>
    )}
    {peers.map((p, i) => (
      <div key={i} className="avatar placeholder">
        <div className="bg-primary text-primary-content rounded-full w-8 h-8 flex items-center justify-center">
          {p.slice(0, 2).toUpperCase()}
        </div>
      </div>
    ))}
  </div>
);

export default PresenceBar;
