import React, { useState } from 'react';

interface PokemonCard {
  name: string;
  imageUrl?: string;
  type?: string;
  description?: string;
  attacks?: string[];
  evolution?: string;
  ability?: string;
  history?: string;
}

interface HistoryProps {
  guessedCards: PokemonCard[];
  totalAttempts?: number;
}


const History: React.FC<HistoryProps> = ({ guessedCards, totalAttempts }) => {
  const [selected, setSelected] = useState<PokemonCard | null>(null);

  const acertadas = guessedCards.length;
  const intentos = totalAttempts ?? acertadas;
  const porcentaje = intentos > 0 ? Math.round((acertadas / intentos) * 100) : 100;

  if (acertadas === 0) {
    return <div className="history-panel">Aún no has adivinado ningún Pokémon.</div>;
  }

  return (
    <div className="history-panel">
      <h2>Pokémons en tu Pokédex</h2>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 8 }}>
        <span style={{ fontWeight: 600, color: '#009688', fontSize: '1.05em' }}>Adivinados: {acertadas}</span>
        <span style={{ fontWeight: 600, color: '#5f27cd', fontSize: '1.05em' }}>Acierto: {porcentaje}%</span>
      </div>
      <div className="history-list">
        {guessedCards.map((card, idx) => (
          <div className="history-card" key={idx} style={{ cursor: 'pointer' }} onClick={() => setSelected(card)}>
            {card.imageUrl && (
              <img src={card.imageUrl} alt={card.name} className="history-img" />
            )}
            <div className="history-name">{card.name}</div>
          </div>
        ))}
      </div>
      {selected && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.32)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }} onClick={() => setSelected(null)}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 4px 32px #2225',
            padding: '2.2rem 2.2rem 1.2rem 2.2rem',
            minWidth: 320,
            maxWidth: 380,
            color: '#232946',
            position: 'relative',
            cursor: 'auto',
          }} onClick={e => e.stopPropagation()}>
            <button style={{
              position: 'absolute',
              top: 10,
              right: 16,
              background: '#e53935',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontWeight: 700,
              fontSize: 18,
              padding: '0.2rem 0.7rem',
              cursor: 'pointer',
              boxShadow: '0 1px 4px #e5393533',
            }} onClick={() => setSelected(null)}>&times;</button>
            {selected.imageUrl && (
              <img src={selected.imageUrl} alt={selected.name} style={{ width: 120, height: 168, objectFit: 'contain', borderRadius: 8, margin: '0 auto 1rem auto', display: 'block', background: '#f5f5f5', border: '1px solid #b388ff' }} />
            )}
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#5f27cd', marginBottom: 8 }}>{selected.name}</div>
            <div style={{ fontSize: '0.98em', marginBottom: 2 }}><b>Tipo:</b> {selected.type || '-'}</div>
            <div style={{ fontSize: '0.98em', marginBottom: 2 }}><b>Descripción:</b> {selected.description || '-'}</div>
            <div style={{ fontSize: '0.98em', marginBottom: 2 }}><b>Ataques:</b> {selected.attacks?.join(', ') || '-'}</div>
            <div style={{ fontSize: '0.98em', marginBottom: 2 }}><b>Evolución:</b> {selected.evolution || '-'}</div>
            <div style={{ fontSize: '0.98em', marginBottom: 2 }}><b>Habilidad:</b> {selected.ability || '-'}</div>
            <div style={{ fontSize: '0.98em', marginBottom: 2 }}><b>Historia:</b> {selected.history || '-'}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
