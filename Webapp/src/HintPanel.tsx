import React from 'react';

interface HintPanelProps {
  hints: string[];
  round: number;
}


const HintPanel: React.FC<HintPanelProps> = ({ hints, round }) => (
  <div className="hint-panel" style={{
    maxWidth: '700px',
    width: '90%',
    margin: '0 auto',
    boxSizing: 'border-box',
    background: '#fff',
    borderRadius: '12px',
    border: '2px solid #e0e2e8',
    boxShadow: '0 2px 12px #0001',
    padding: '18px 22px',
    marginTop: 18,
    marginBottom: 18,
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
    color: '#232946',
    fontSize: '1.08rem',
    fontWeight: 500,
    lineHeight: 1.7,
    minWidth: 0
  }}>
    <h2>Pistas reveladas</h2>
    {hints.length === 0 ? (
      <p style={{color: 'red'}}>No hay pistas disponibles para este Pokémon.</p>
    ) : (
      <ul style={{
        paddingLeft: 0,
        maxWidth: '100%',
        wordBreak: 'break-word',
        whiteSpace: 'pre-line',
        margin: 0,
        listStyle: 'none',
      }}>
        {hints.slice(0, round + 1).map((hint, idx) => (
          <li key={idx} style={{
            marginBottom: 14,
            lineHeight: 1.7,
            wordBreak: 'break-word',
            whiteSpace: 'pre-line',
            maxWidth: '100%',
            overflowWrap: 'break-word',
            background: idx === 0 ? '#f3f6fa' : 'transparent',
            border: idx === 0 ? '1.5px solid #bfc8e6' : 'none',
            borderRadius: idx === 0 ? 8 : 0,
            padding: idx === 0 ? '12px 14px' : 0,
            fontSize: idx === 0 ? '1.13rem' : '1rem',
            fontWeight: idx === 0 ? 600 : 500,
            color: idx === 0 ? '#232946' : '#232946',
            boxShadow: idx === 0 ? '0 2px 8px #bfc8e622' : 'none',
            marginTop: idx === 0 ? 0 : 0
          }}>
            <b>Pista {idx + 1}:</b> {hint}
          </li>
        ))}
      </ul>
    )}
  </div>
);

export default HintPanel;
