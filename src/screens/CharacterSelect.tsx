import { useState } from 'react';
import CharacterAvatar from '../components/CharacterAvatar';
import { CHARACTERS } from '../state/character';
import type { CharacterId } from '../state/character';

interface CharacterSelectProps {
  initial: CharacterId;
  onConfirm: (id: CharacterId) => void;
}

export default function CharacterSelect({ initial, onConfirm }: CharacterSelectProps) {
  const [picked, setPicked] = useState<CharacterId>(initial);
  const current = CHARACTERS.find((c) => c.id === picked) ?? CHARACTERS[0];

  return (
    <main className="cs">
      <h1 className="cs-title">CHOOSE YOUR FIGHTER</h1>
      <p className="cs-sub">This legend will fall into the arcade with you.</p>

      <div className="cs-grid" role="radiogroup" aria-label="Characters">
        {CHARACTERS.map((c) => (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={picked === c.id}
            className={`cs-card ${picked === c.id ? 'is-picked' : ''}`}
            onClick={() => setPicked(c.id)}
          >
            <CharacterAvatar id={c.id} className="cs-avatar" />
            <span className="cs-name">{c.name}</span>
            <span className="cs-tag">{c.tagline}</span>
          </button>
        ))}
      </div>

      <button type="button" className="cs-go" onClick={() => onConfirm(picked)}>
        DROP IN AS {current.name.toUpperCase()}
      </button>
    </main>
  );
}