import React from 'react';

interface GuessInputProps {
  userGuess: string;
  onGuessChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
}

const GuessInput: React.FC<GuessInputProps> = ({ userGuess, onGuessChange, onSubmit, disabled, placeholder }) => (
  <form onSubmit={e => { e.preventDefault(); onSubmit(); }} className="guess-input" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
    <input
      type="text"
      value={userGuess}
      onChange={e => onGuessChange(e.target.value)}
      placeholder={placeholder || "Adivina el Pokémon..."}
      disabled={disabled}
      style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', minWidth: 240 }}
    />
    <button
      type="submit"
      disabled={disabled}
      style={{
        background: '#06b6d4',
        color: '#042A2B',
        fontWeight: 700,
        padding: '8px 14px',
        borderRadius: 8,
        border: 'none',
        cursor: 'pointer',
      }}
    >
      Adivinar
    </button>
  </form>
);

export default GuessInput;
