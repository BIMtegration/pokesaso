const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '..', 'src', 'App.tsx');
const backupPath = filePath + '.bak.' + Date.now();

const startPattern = "(showDebug || gameState === 'guessed' || gameState === 'reveal') && (";
const endMarker = '/* Panel central: Juego principal */';

const replacement = `
      {(showDebug || gameState === 'guessed' || gameState === 'reveal') && (
        <div className="side-panel">
          <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 10, color: '#ffb300' }}>
            {currentCard?.numPokedex ? `N.º Pokédex: ${'${currentCard.numPokedex}'}` : 'N.º Pokédex: ---'}
          </div>
          {currentCard?.imageUrl && (
            <div style={{
              width: '100%',
              height: '76%',
              maxHeight: 'calc(76vh - 120px)',
              background: '#181c2b',
              borderRadius: 8,
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}>
              <img
                src={currentCard.imageUrl}
                alt="debug-img"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  display: 'block',
                }}
                className={shake ? 'shake' : ''}
              />
            </div>
          )}
          <div style={{ fontSize: '0.85em', marginBottom: 2 }}><b>Nombre:</b> {currentCard?.name}</div>
          <div style={{ fontSize: '0.85em', marginBottom: 2 }}><b>Apodo:</b> {currentCard?.apodo}</div>
          <div style={{ fontSize: '0.85em', marginBottom: 2 }}><b>Tipo:</b> {currentCard?.type}</div>
          <div style={{ fontSize: '0.85em', marginBottom: 2 }}><b>Descripción:</b> {currentCard?.description}</div>
          <div style={{ fontSize: '0.85em', marginBottom: 2 }}><b>FlavorText:</b> {currentCard?.flavorText}</div>
          <div style={{ fontSize: '0.85em', marginBottom: 2 }}><b>Ataques:</b> {currentCard?.attacks?.join(', ')}</div>
          <div style={{ fontSize: '0.85em', marginBottom: 2 }}><b>Evolución:</b> {currentCard?.evolution}</div>
          <div style={{ fontSize: '0.85em', marginBottom: 2 }}><b>Habilidad:</b> {currentCard?.ability}</div>
          <div style={{ fontSize: '0.85em', marginBottom: 2 }}><b>Historia:</b> {currentCard?.history}</div>
          {currentCard?.base && (
            <div style={{ fontSize: '0.85em', marginTop: 8, marginBottom: 2 }}>
              <b>Estadísticas base:</b>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {currentCard.base.HP !== undefined && <li>PS: {currentCard.base.HP}</li>}
                {currentCard.base.Attack !== undefined && <li>Ataque: {currentCard.base.Attack}</li>}
                {currentCard.base.Defense !== undefined && <li>Defensa: {currentCard.base.Defense}</li>}
                {currentCard.base.SpAttack !== undefined && <li>Ataque Esp.: {currentCard.base.SpAttack}</li>}
                {currentCard.base.SpDefense !== undefined && <li>Defensa Esp.: {currentCard.base.SpDefense}</li>}
                {currentCard.base.Speed !== undefined && <li>Velocidad: {currentCard.base.Speed}</li>}
              </ul>
            </div>
          )}
        </div>
      )}
`;

try {
  const src = fs.readFileSync(filePath, 'utf8');
  const startIdx = src.indexOf(startPattern);
  if (startIdx === -1) {
    console.error('Start pattern not found. Aborting.');
    process.exit(1);
  }
  const endIdx = src.indexOf(endMarker, startIdx);
  if (endIdx === -1) {
    console.error('End marker not found. Aborting.');
    process.exit(1);
  }

  // Find the position just before the endMarker
  const beforeEnd = endIdx;

  const newContent = src.slice(0, startIdx) + replacement + src.slice(beforeEnd);

  // Backup
  fs.writeFileSync(backupPath, src, 'utf8');
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log('Replaced left panel block. Backup saved to:', backupPath);
} catch (err) {
  console.error('Error:', err);
  process.exit(1);
}
