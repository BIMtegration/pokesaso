import { useState, useRef, useEffect } from 'react';

const genMap = {
  gen1: [1, 151],
  gen2: [152, 251],
  gen3: [252, 386],
  gen4: [387, 493],
  gen5: [494, 649],
  gen6: [650, 721],
  gen7: [722, 809],
  gen8: [810, 898],
  gen9: [899, 1025],
};

const App = () => {
  const confettiRef = useRef<HTMLCanvasElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const startButtonRef = useRef<HTMLButtonElement | null>(null);
  const continueButtonRef = useRef<HTMLButtonElement | null>(null);
  const startGameButtonRef = useRef<HTMLButtonElement | null>(null);
  const easterEggButtonRef = useRef<HTMLButtonElement | null>(null);
  const nextPokemonButtonRef = useRef<HTMLButtonElement | null>(null);
  const [gameState, setGameState] = useState<'init' | 'config' | 'playing' | 'reveal' | 'guessed'>('init');
  const [currentCard, setCurrentCard] = useState<any>(null);
  const [cards, setCards] = useState<any[] | null>(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [userGuess, setUserGuess] = useState('');
  const [feedback, setFeedback] = useState('');
  const [guessedCards, setGuessedCards] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(true);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showCorrectModal, setShowCorrectModal] = useState(false);
  const [showEasterEggModal, setShowEasterEggModal] = useState(false);
  const [showWrongGuessModal, setShowWrongGuessModal] = useState(false);
  const [difficulty, setDifficulty] = useState('easy');
  const [pulse, setPulse] = useState(false);
  const [selectedGens, setSelectedGens] = useState<string[]>(['gen1']);
  const [timeLeft, setTimeLeft] = useState(0);
  const [revealedCard, setRevealedCard] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [expandedHint, setExpandedHint] = useState<number | null>(0);
  const [lastPointsGained, setLastPointsGained] = useState(0);

  const difficultyOptions = [
    { key: 'easy', label: 'Fácil', time: 5 * 60 },
    { key: 'medium', label: 'Intermedio', time: 3 * 60 },
    { key: 'hard', label: 'Difícil', time: 1 * 60 },
    { key: 'unlimited', label: 'Ilimitado', time: 0 },
  ];

  const genOptions = Object.keys(genMap).map((k, idx) => ({ key: k, label: `Gen ${idx + 1}` }));

  useEffect(() => {
    let id: ReturnType<typeof setInterval> | null = null;
    if (revealedCard) {
      id = setInterval(() => setPulse(p => !p), 800);
    } else {
      setPulse(false);
    }
    return () => { if (id) clearInterval(id); };
  }, [revealedCard]);

  // Timer del juego
  useEffect(() => {
    let id: ReturnType<typeof setInterval> | null = null;
    if (gameState === 'playing' && timeLeft > 0) {
      id = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            setGameState('reveal');
            setShowResultsModal(true);
            setRevealedCard(false);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (id) clearInterval(id); };
  }, [gameState, timeLeft]);

  // Focus en el input al iniciar el juego
  useEffect(() => {
    if (gameState === 'playing') {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [gameState]);

  // Focus en el botón de inicio del modal
  useEffect(() => {
    if (showModal && gameState === 'init') {
      setTimeout(() => {
        startButtonRef.current?.focus();
      }, 100);
    }
  }, [showModal, gameState]);

  // Focus en el botón continuar cuando se acierta
  useEffect(() => {
    if (showCorrectModal) {
      setTimeout(() => {
        continueButtonRef.current?.focus();
      }, 100);
    }
  }, [showCorrectModal]);

  // Focus en el botón "Empezar Juego" del modal de configuración
  useEffect(() => {
    if (gameState === 'config') {
      setTimeout(() => {
        startGameButtonRef.current?.focus();
      }, 100);
    }
  }, [gameState]);

  // Focus en el botón del easter egg cuando se abre
  useEffect(() => {
    if (showEasterEggModal) {
      setTimeout(() => {
        easterEggButtonRef.current?.focus();
      }, 100);
    }
  }, [showEasterEggModal]);

  // Focus en el botón "Siguiente Pokémon" cuando sale el modal de No adivinaste
  useEffect(() => {
    if (showWrongGuessModal) {
      setTimeout(() => {
        nextPokemonButtonRef.current?.focus();
      }, 100);
    }
  }, [showWrongGuessModal]);

  const leftVisible = Boolean(currentCard && (revealedCard || showWrongGuessModal));

  const handleNextCard = () => {
    setFeedback('');
    setRound(r => r + 1);
    setRevealedCard(false);
    setHintLevel(0);
    setExpandedHint(0);
    if (cards && cards.length > 0) {
      const filtered = cards.filter(card => {
        if (!card.numPokedex) return false;
        const num = Number(card.numPokedex);
        for (const gKey of selectedGens) {
          const [from, to] = (genMap as any)[gKey];
          if (num >= from && num <= to) return true;
        }
        return false;
      });
      if (filtered.length > 0) {
        const choice = filtered[Math.floor(Math.random() * filtered.length)];
        setCurrentCard(choice);
      }
    }
  };

  const handleResetGame = () => {
    setScore(0);
    setGuessedCards([]);
    setGameState('init');
    setShowModal(true);
    setRevealedCard(false);
    setHintLevel(0);
    setExpandedHint(0);
    setFeedback('¡Juego reiniciado!');
  };

  const handleGuess = () => {
    const g = (userGuess || '').trim().toLowerCase();
    
    // Caso especial: palabra clave "lumberjack"
    if (g === 'lumberjack') {
      // Si el panel ya está visible, lo ocultamos
      if (revealedCard) {
        setRevealedCard(false);
        setUserGuess('');
        setFeedback('¡Panel oculto!');
      } else {
        // Si el panel está oculto, lo mostramos
        setRevealedCard(true);
        setUserGuess('');
        setFeedback('¡Secreto revelado!');
      }
      inputRef.current?.focus();
      return;
    }
    
    // Easter egg: detectar "sara"
    if (g === 'sara') {
      setShowEasterEggModal(true);
      setUserGuess('');
      inputRef.current?.focus();
      return;
    }
    
    // Validar si el nombre del Pokémon es correcto
    if (currentCard && g === currentCard.name.toLowerCase()) {
      // Sistema de puntos dinámicos según el hintLevel (6 intentos: 0-5)
      const pointsMap = [100, 80, 60, 40, 20, 5]; // pista 0, 1, 2, 3, 4, 5
      const points = pointsMap[hintLevel] || 0;
      setScore(s => s + points);
      setLastPointsGained(points);
      setUserGuess('');
      setRevealedCard(true); // Mostrar el panel
      setShowCorrectModal(true);
    } else {
      // Error: incrementar nivel de pista (máximo 6 intentos)
      if (hintLevel < 4) {
        // Mostrar siguientes pistas (1 a 4)
        setHintLevel(h => h + 1);
        setExpandedHint(hintLevel + 1); // Auto-abrir la nueva pista
        setUserGuess('');
        setFeedback('✗ Intenta de nuevo...');
      } else if (hintLevel === 4) {
        // Última pista (pista 5 - imagen)
        setHintLevel(h => h + 1);
        setExpandedHint(4); // Auto-abrir la pista 5 (imagen)
        setUserGuess('');
        setFeedback('✗ ¡Último intento!');
      } else {
        // Se agotaron todas las pistas - Game over
        setUserGuess('');
        setFeedback('✗ ¡No adivinaste!');
        // Mostrar modal de "No adivinaste"
        setRevealedCard(true); // Mostrar imagen en el panel izquierdo
        setShowWrongGuessModal(true);
      }
    }
    
    // Devolver focus al input
    inputRef.current?.focus();
  };

  const handleStartGame = () => {
    setShowModal(false);
    setGameState('playing');
    setRound(1);
    setScore(0);
    setRevealedCard(false);
    setHintLevel(0);
    setLastPointsGained(0);
    
    // Obtener tiempo según dificultad
    const diffOpt = difficultyOptions.find(d => d.key === difficulty);
    const timeInSeconds = diffOpt?.time || 300;
    setTimeLeft(timeInSeconds);
    
    if (cards && cards.length > 0) {
      const filtered = cards.filter(card => {
        if (!card.numPokedex) return false;
        const num = Number(card.numPokedex);
        for (const gKey of selectedGens) {
          const [from, to] = (genMap as any)[gKey];
          if (num >= from && num <= to) return true;
        }
        return false;
      });
      if (filtered.length > 0) {
        const choice = filtered[Math.floor(Math.random() * filtered.length)];
        setCurrentCard(choice);
      }
    }
  };

  useEffect(() => {
    let mounted = true;
    // Usar import.meta.url para resolver la ruta correcta en GitHub Pages
    const basePath = import.meta.env.BASE_URL || '/';
    const cardsPath = `${basePath}localCards.enriched.filled.json`;
    
    fetch(cardsPath)
      .then(r => r.json())
      .then((j) => {
        if (!mounted) return;
        if (Array.isArray(j)) {
          setCards(j);
        } else if (j && Array.isArray(j.cards)) {
          setCards(j.cards);
        }
      })
      .catch(err => {
        console.warn('Error loading cards:', err);
      });
    return () => { mounted = false; };
  }, []);

  void confettiRef;
  void handleResetGame;
  void guessedCards;
  void pulse;
  void lastPointsGained;
  void setLastPointsGained;

  return (
    <>
      <div
        style={{
          position: 'fixed',
          left: 12,
          top: 12,
          width: 14,
          height: 14,
          borderRadius: 999,
          background: 'transparent',
          display: 'none'
        }}
      />
      
      <div
        className="main-layout"
        style={{
          display: 'flex',
          width: '100vw',
          height: '100vh',
          alignItems: 'stretch',
          gap: 0,
          padding: 0,
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        <div
          className="side-panel"
          style={{
            flex: leftVisible ? '0 0 25%' : '0 0 0%',
            background: '#0b1220',
            color: '#f1f5f9',
            padding: leftVisible ? 8 : 0,
            borderRadius: 0,
            overflow: 'hidden',
            visibility: leftVisible ? 'visible' : 'hidden',
            transition: 'all 300ms ease',
            minWidth: 0,
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {currentCard && (
            <div style={{
              background: '#0b1220',
              borderRadius: '8px',
              border: '2px solid #4ade80',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              fontSize: '12px',
              lineHeight: '1.2',
              width: '100%',
              maxHeight: '100vh',
              height: 'fit-content',
              margin: '16px'
            }}>
              {/* Número Pokédex */}
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fbbf24' }}>
                Nº Pokédex: {currentCard.numPokedex}
              </div>

              {/* Imagen */}
              {currentCard.imageUrl && (
                <div style={{
                  textAlign: 'center',
                  minHeight: '160px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <img
                    src={currentCard.imageUrl}
                    alt={currentCard.name}
                    style={{
                      maxWidth: '100%',
                      height: 'auto',
                      maxHeight: '160px',
                      objectFit: 'contain'
                    }}
                  />
                </div>
              )}

              {/* Nombre, Tipo, Apodo */}
              <div>
                <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#e2e8f0' }}>
                  Nombre: <span style={{ color: '#4ade80' }}>{currentCard.name}</span>
                </div>
                <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
                  Apodo: <span style={{ color: '#fbbf24' }}>{currentCard.apodo}</span>
                </div>
                <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
                  Tipo: <span style={{ color: '#60a5fa' }}>{currentCard.type}</span>
                </div>
              </div>

              {/* Descripción y Flavor */}
              <div style={{
                fontSize: '12px',
                color: '#cbd5e1',
                lineHeight: '1.4',
                borderTop: '1px solid #334155',
                borderBottom: '1px solid #334155',
                paddingTop: '6px',
                paddingBottom: '6px'
              }}>
                <div style={{ marginBottom: '4px' }}>{currentCard.description}</div>
                {currentCard.flavorText && (
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                    "{currentCard.flavorText}"
                  </div>
                )}
              </div>

              {/* Habilidad y Stats en grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                fontSize: '11px'
              }}>
                {/* Habilidad */}
                <div>
                  <div style={{ color: '#94a3b8', fontSize: '10px', marginBottom: '2px' }}>HABILIDAD</div>
                  <div style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: '12px' }}>{currentCard.ability}</div>
                </div>

                {/* Stats compacto */}
                {currentCard.base && (
                  <div>
                    <div style={{ color: '#94a3b8', fontSize: '10px', marginBottom: '2px' }}>STATS</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '3px' }}>
                      {Object.entries(currentCard.base).slice(0, 3).map(([stat, value]: [string, any]) => (
                        <div key={stat} style={{ textAlign: 'center', fontSize: '10px' }}>
                          <div style={{ color: '#94a3b8', fontSize: '8px' }}>{stat.substring(0, 3)}</div>
                          <div style={{ color: '#4ade80', fontWeight: 'bold' }}>{String(value)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Ataques */}
              {currentCard.attacks && currentCard.attacks.length > 0 && (
                <div style={{ fontSize: '12px' }}>
                  <div style={{ color: '#94a3b8', fontSize: '10px', marginBottom: '3px' }}>ATAQUES</div>
                  {currentCard.attacks.map((attack: string) => (
                    <div key={attack} style={{ color: '#cbd5e1', fontSize: '11px' }}>
                      • {attack}
                    </div>
                  ))}
                </div>
              )}

              {/* Evolución, Dimensiones, Hábitat */}
              <div style={{
                fontSize: '12px',
                color: '#cbd5e1',
                borderTop: '1px solid #334155',
                paddingTop: '6px'
              }}>
                {currentCard.preEvolution && (
                  <div style={{ marginBottom: '2px' }}>
                    <span style={{ color: '#94a3b8' }}>Prev:</span> {currentCard.preEvolution}
                  </div>
                )}
                {currentCard.evolution && (
                  <div style={{ marginBottom: '2px' }}>
                    <span style={{ color: '#94a3b8' }}>Próx:</span> {currentCard.evolution}
                  </div>
                )}
                {currentCard.height && (
                  <div style={{ marginBottom: '2px' }}>
                    <span style={{ color: '#94a3b8' }}>Alt:</span> {currentCard.height}dm
                  </div>
                )}
                {currentCard.weight && (
                  <div style={{ marginBottom: '2px' }}>
                    <span style={{ color: '#94a3b8' }}>Peso:</span> {currentCard.weight}hg
                  </div>
                )}
                {currentCard.habitat && (
                  <div>
                    <span style={{ color: '#94a3b8' }}>Hábitat:</span> {currentCard.habitat}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            flex: '1 1 auto',
            display: 'flex',
            flexDirection: 'row',
            background: '#1e293b',
            color: '#f1f5f9',
            padding: 0,
            gap: 0,
          }}
        >
          {/* Panel Central */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', alignItems: 'center', padding: '20px', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
            {showCorrectModal ? (
              /* Modal de Acierto */
              <div style={{
                background: '#0f172a',
                border: '3px solid #4ade80',
                borderRadius: '12px',
                padding: '50px',
                maxWidth: '500px',
                width: '100%',
                boxShadow: '0 0 30px rgba(74, 222, 128, 0.3)',
                textAlign: 'center'
              }}>
                <h2 style={{ marginTop: 0, marginBottom: '30px', textAlign: 'center', fontSize: '48px', color: '#4ade80' }}>
                  ✨ ¡Acertaste!
                </h2>
                
                <div style={{ marginBottom: '30px', fontSize: '20px' }}>
                  <p style={{ marginBottom: '10px', color: '#e2e8f0' }}>
                    Pokémon:
                  </p>
                  <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#fbbf24', marginTop: 0, marginBottom: 0 }}>
                    {currentCard?.name}
                  </p>
                </div>

                <div style={{ marginBottom: '25px', padding: '16px', backgroundColor: '#1e293b', borderRadius: '8px', border: '2px solid #fbbf24' }}>
                  <p style={{ marginTop: 0, marginBottom: '8px', fontSize: '16px', color: '#94a3b8' }}>
                    Puntos ganados:
                  </p>
                  <p style={{ marginTop: 0, marginBottom: 0, fontSize: '32px', fontWeight: 'bold', color: '#fbbf24' }}>
                    +{lastPointsGained}
                  </p>
                </div>

                <button
                  ref={continueButtonRef}
                  onClick={() => {
                    setShowCorrectModal(false);
                    setRevealedCard(false);
                    handleNextCard();
                    setTimeout(() => {
                      inputRef.current?.focus();
                    }, 100);
                  }}
                  style={{
                    padding: '14px 40px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#4ade80',
                    color: '#0f172a',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 200ms'
                  }}
                >
                  ▶ Continuar
                </button>
              </div>
            ) : showWrongGuessModal ? (
              /* Modal de "No adivinaste" - Muestra respuesta correcta */
              <div style={{
                background: '#0f172a',
                border: '3px solid #ef4444',
                borderRadius: '12px',
                padding: '50px',
                maxWidth: '500px',
                width: '100%',
                boxShadow: '0 0 30px rgba(239, 68, 68, 0.3)',
                textAlign: 'center'
              }}>
                <h2 style={{ marginTop: 0, marginBottom: '20px', textAlign: 'center', fontSize: '48px', color: '#ef4444' }}>
                  ❌ ¡No adivinaste!
                </h2>
                
                <div style={{ marginBottom: '30px', fontSize: '18px', color: '#e2e8f0', lineHeight: '1.6' }}>
                  <p style={{ marginTop: 0, marginBottom: '15px' }}>
                    La respuesta era:
                  </p>
                  <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#fbbf24', marginTop: 0, marginBottom: 0 }}>
                    {currentCard?.name}
                  </p>
                </div>

                <div style={{ marginBottom: '25px', padding: '16px', backgroundColor: '#1e293b', borderRadius: '8px', border: '2px solid #334155' }}>
                  <p style={{ marginTop: 0, marginBottom: '8px', fontSize: '14px', color: '#94a3b8' }}>
                    🎓 Recuerda este Pokémon:
                  </p>
                  <p style={{ marginTop: 0, marginBottom: 0, fontSize: '13px', color: '#cbd5e1', lineHeight: '1.5' }}>
                    <strong>Apodo:</strong> {currentCard?.apodo}<br />
                    <strong>Tipo:</strong> {currentCard?.type}
                  </p>
                </div>

                <button
                  ref={nextPokemonButtonRef}
                  onClick={() => {
                    setShowWrongGuessModal(false);
                    setRevealedCard(false);
                    handleNextCard();
                    setTimeout(() => {
                      inputRef.current?.focus();
                    }, 100);
                  }}
                  style={{
                    padding: '14px 40px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#ef4444',
                    color: '#ffffff',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 200ms'
                  }}
                >
                  ▶ Siguiente Pokémon
                </button>
              </div>
            ) : showResultsModal ? (
              /* Modal de Resultados */
              <div style={{
                background: '#0f172a',
                border: '2px solid #4ade80',
                borderRadius: '12px',
                padding: '40px',
                maxWidth: '500px',
                width: '100%',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                textAlign: 'center'
              }}>
                <h2 style={{ marginTop: 0, marginBottom: '30px', textAlign: 'center', fontSize: '28px', color: '#4ade80' }}>
                  🎮 ¡Juego Terminado!
                </h2>
                
                <div style={{ marginBottom: '30px', fontSize: '18px' }}>
                  <p style={{ marginBottom: '15px', color: '#e2e8f0' }}>
                    <strong>Pokémon Adivinados:</strong>
                  </p>
                  <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#4ade80', marginTop: 0, marginBottom: 0 }}>
                    {score}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setShowResultsModal(false);
                    setShowModal(true);
                    setScore(0);
                    setRound(0);
                    setGuessedCards([]);
                    setUserGuess('');
                    setFeedback('');
                  }}
                  style={{
                    padding: '12px 30px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#4ade80',
                    color: '#0f172a',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 200ms'
                  }}
                >
                  🔄 Reiniciar
                </button>
              </div>
            ) : showEasterEggModal ? (
              /* Modal Easter Egg - Sara */
              <div style={{
                background: '#0f172a',
                border: '3px solid #a78bfa',
                borderRadius: '12px',
                padding: '50px',
                maxWidth: '500px',
                width: '100%',
                boxShadow: '0 0 30px rgba(167, 139, 250, 0.5)',
                textAlign: 'center'
              }}>
                <h2 style={{ marginTop: 0, marginBottom: '20px', textAlign: 'center', fontSize: '48px', color: '#a78bfa' }}>
                  ✨ ¡Easter Egg! ✨
                </h2>
                
                <div style={{ marginBottom: '30px', fontSize: '18px', color: '#e2e8f0', lineHeight: '1.6' }}>
                  <p style={{ marginTop: 0, marginBottom: '10px' }}>
                    Este juego es para mi
                  </p>
                  <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#fbbf24', marginTop: 0, marginBottom: '10px' }}>
                    ¡Bella hija, Sara Muñoz!
                  </p>
                  <p style={{ marginTop: 0, marginBottom: 0 }}>
                    💜 Espero que te diviertas adivinando Pokémons! 💜
                  </p>
                </div>

                <button
                  ref={easterEggButtonRef}
                  onClick={() => {
                    setShowEasterEggModal(false);
                    setUserGuess('');
                    setTimeout(() => {
                      inputRef.current?.focus();
                    }, 100);
                  }}
                  style={{
                    padding: '14px 40px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#a78bfa',
                    color: '#0f172a',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 200ms'
                  }}
                >
                  💜 Continuar
                </button>
              </div>
            ) : showModal ? (
              /* Modal de Pantalla de Inicio */
              <div style={{
                background: '#0f172a',
                border: '2px solid #4ade80',
                borderRadius: '12px',
                padding: '40px',
                maxWidth: '500px',
                width: '100%',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                textAlign: 'center'
              }}>
                <h1 style={{ marginTop: 0, marginBottom: '40px', textAlign: 'center', fontSize: '36px', color: '#ff6b6b', textShadow: '0 0 10px rgba(255, 107, 107, 0.5)' }}>
                  ¡¿Quién es ese Pokémon?!
                </h1>

                <button
                  ref={startButtonRef}
                  onClick={() => {
                    setShowModal(false);
                    setGameState('config');
                  }}
                  style={{
                    padding: '14px 40px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#4ade80',
                    color: '#0f172a',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 200ms'
                  }}
                >
                  🎮 Empezar
                </button>
              </div>
            ) : gameState === 'config' ? (
              /* Modal de Configuración */
              <div style={{
                background: '#0f172a',
                border: '2px solid #64748b',
                borderRadius: '12px',
                padding: '30px',
                maxWidth: '600px',
                width: '100%',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
              }}>
                <h2 style={{ marginTop: 0, marginBottom: '25px', textAlign: 'center', fontSize: '24px' }}>
                  ⚙️ Configuración del Juego
                </h2>

                {/* Selección de Dificultad */}
                <div style={{ marginBottom: '25px' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '16px', color: '#cbd5e1' }}>
                    📊 Nivel de Dificultad
                  </h3>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {difficultyOptions.map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => setDifficulty(opt.key)}
                        style={{
                          padding: '10px 16px',
                          borderRadius: '8px',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          transition: 'all 200ms',
                          background: difficulty === opt.key ? '#4ade80' : '#334155',
                          color: difficulty === opt.key ? '#0f172a' : '#cbd5e1',
                          fontSize: '14px',
                          flex: '1 1 auto',
                          minWidth: '100px'
                        }}
                      >
                        {opt.key === 'unlimited' ? `${opt.label} (∞)` : `${opt.label} (${opt.time / 60}m)`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selección de Generaciones */}
                <div style={{ marginBottom: '25px' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '16px', color: '#cbd5e1' }}>
                    🎮 Generaciones de Pokémon
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    {genOptions.map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => {
                          setSelectedGens(prev =>
                            prev.includes(opt.key)
                              ? prev.filter(g => g !== opt.key)
                              : [...prev, opt.key]
                          );
                        }}
                        style={{
                          padding: '10px',
                          borderRadius: '8px',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          transition: 'all 200ms',
                          background: selectedGens.includes(opt.key) ? '#3b82f6' : '#334155',
                          color: selectedGens.includes(opt.key) ? '#ffffff' : '#cbd5e1',
                          fontSize: '13px'
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px', marginBottom: 0 }}>
                    Seleccionadas: {selectedGens.length} de {genOptions.length}
                  </p>
                </div>

                {/* Botones de Control */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
                  <button
                    onClick={() => {
                      setSelectedGens(genOptions.map(g => g.key));
                    }}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: '1px solid #64748b',
                      background: 'transparent',
                      color: '#cbd5e1',
                      cursor: 'pointer',
                      fontSize: '14px',
                      transition: 'all 200ms',
                      flex: '1'
                    }}
                  >
                    Todas
                  </button>
                  <button
                    onClick={() => setSelectedGens([])}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: '1px solid #64748b',
                      background: 'transparent',
                      color: '#cbd5e1',
                      cursor: 'pointer',
                      fontSize: '14px',
                      transition: 'all 200ms',
                      flex: '1'
                    }}
                  >
                    Ninguna
                  </button>
                  <button
                    ref={startGameButtonRef}
                    onClick={handleStartGame}
                    disabled={selectedGens.length === 0}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      background: selectedGens.length === 0 ? '#64748b' : '#10b981',
                      color: '#ffffff',
                      cursor: selectedGens.length === 0 ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      transition: 'all 200ms',
                      flex: '1.5',
                      opacity: selectedGens.length === 0 ? 0.5 : 1
                    }}
                  >
                    🎮 Empezar Juego
                  </button>
                </div>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: '0',
                width: '100%',
                maxWidth: '700px',
                height: '100vh',
                overflowY: 'auto',
                overflowX: 'hidden',
                paddingTop: '20px',
                boxSizing: 'border-box'
              }}>
                {/* Título */}
                <h1 style={{
                  fontSize: '36px',
                  fontWeight: 'bold',
                  color: '#ff6b6b',
                  textShadow: '0 0 10px rgba(255, 107, 107, 0.5)',
                  marginTop: 0,
                  marginBottom: '20px',
                  textAlign: 'center',
                  flexShrink: 0
                }}>
                  ¡¿Quién es ese Pokémon?!
                </h1>

                {/* Pistas Acordeón - Crece con su contenido */}
                {currentCard && (
                  <div style={{
                    background: '#0f172a',
                    border: '2px solid #4ade80',
                    borderRadius: '12px',
                    padding: '16px',
                    width: '100%',
                    maxWidth: '700px',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    flex: '1 1 auto',
                    maxHeight: 'calc(100vh - 120px)',
                    overflowY: 'auto',
                    scrollBehavior: 'smooth',
                    marginBottom: '12px'
                  }}
                  className="pistas-scrollable"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '12px' }}>
                      <h3 style={{ marginTop: 0, marginBottom: 0, fontSize: '16px', color: '#4ade80', textAlign: 'center', flex: 1 }}>
                        💡 PISTAS
                      </h3>
                      {feedback && (
                        <div style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid ' + (feedback.includes('correcto') ? '#4ade80' : '#ef4444'),
                          backgroundColor: feedback.includes('correcto') ? 'rgba(74, 222, 128, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: feedback.includes('correcto') ? '#4ade80' : '#ef4444',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          textAlign: 'center',
                          whiteSpace: 'nowrap',
                          minHeight: 'auto',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {feedback}
                        </div>
                      )}
                    </div>

                    {/* Pista 1: Apodo, Descripción, Flavor */}
                    {hintLevel >= 0 && (
                      <div style={{
                        background: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        overflow: 'hidden'
                      }}>
                        <button
                          onClick={() => setExpandedHint(expandedHint === 0 ? null : 0)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            background: expandedHint === 0 ? '#334155' : '#0f172a',
                            border: 'none',
                            color: '#e2e8f0',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 200ms'
                          }}
                        >
                          🔸 Pista 1: Apodo & Descripción {expandedHint === 0 ? '▼' : '▶'}
                        </button>
                        {expandedHint === 0 && (
                          <div style={{ padding: '12px', background: '#0f172a', borderTop: '1px solid #334155', fontSize: '12px', color: '#cbd5e1' }}>
                            <p style={{ marginTop: 0, marginBottom: '6px', fontWeight: 'bold', color: '#fbbf24' }}>{currentCard.apodo}</p>
                            <p style={{ marginTop: 0, marginBottom: '6px', lineHeight: '1.4' }}>{currentCard.description}</p>
                            <p style={{ marginTop: 0, marginBottom: 0, fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>"{currentCard.flavorText}"</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Pista 2: Tipo */}
                    {hintLevel >= 1 && (
                      <div style={{
                        background: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        overflow: 'hidden'
                      }}>
                        <button
                          onClick={() => setExpandedHint(expandedHint === 1 ? null : 1)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            background: expandedHint === 1 ? '#334155' : '#0f172a',
                            border: 'none',
                            color: '#60a5fa',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 200ms'
                          }}
                        >
                          🔵 Pista 2: Tipo {expandedHint === 1 ? '▼' : '▶'}
                        </button>
                        {expandedHint === 1 && (
                          <div style={{ padding: '12px', background: '#0f172a', borderTop: '1px solid #334155', fontSize: '13px', color: '#e2e8f0' }}>
                            <span style={{ color: '#60a5fa', fontWeight: 'bold' }}>{currentCard.type}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Pista 3: Evolución */}
                    {hintLevel >= 2 && (
                      <div style={{
                        background: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        overflow: 'hidden'
                      }}>
                        <button
                          onClick={() => setExpandedHint(expandedHint === 2 ? null : 2)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            background: expandedHint === 2 ? '#334155' : '#0f172a',
                            border: 'none',
                            color: '#ff6b6b',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 200ms'
                          }}
                        >
                          🔴 Pista 3: Evolución {expandedHint === 2 ? '▼' : '▶'}
                        </button>
                        {expandedHint === 2 && (
                          <div style={{ padding: '12px', background: '#0f172a', borderTop: '1px solid #334155', fontSize: '13px', color: '#e2e8f0' }}>
                            {currentCard.preEvolution && <div>← {currentCard.preEvolution}</div>}
                            {currentCard.evolution && <div>→ {currentCard.evolution}</div>}
                            {!currentCard.preEvolution && !currentCard.evolution && <div>Sin evoluciones</div>}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Pista 4: Primera Sílaba */}
                    {hintLevel >= 3 && (
                      <div style={{
                        background: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        overflow: 'hidden'
                      }}>
                        <button
                          onClick={() => setExpandedHint(expandedHint === 3 ? null : 3)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            background: expandedHint === 3 ? '#334155' : '#0f172a',
                            border: 'none',
                            color: '#4ade80',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 200ms'
                          }}
                        >
                          🟢 Pista 4: Primera Sílaba {expandedHint === 3 ? '▼' : '▶'}
                        </button>
                        {expandedHint === 3 && (
                          <div style={{ padding: '12px', background: '#0f172a', borderTop: '1px solid #334155', fontSize: '13px', color: '#e2e8f0' }}>
                            Empieza con: <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#fbbf24' }}>"{currentCard.name.split('')[0]}{currentCard.name.split('')[1] || ''}"</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Pista 5: Imagen del Pokémon */}
                    {hintLevel >= 4 && (
                      <div style={{
                        background: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        overflow: 'hidden'
                      }}>
                        <button
                          onClick={() => setExpandedHint(expandedHint === 4 ? null : 4)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            background: expandedHint === 4 ? '#334155' : 'transparent',
                            border: 'none',
                            color: '#a78bfa',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 200ms'
                          }}
                        >
                          🟣 Pista 5: Imagen Parcial {expandedHint === 4 ? '▼' : '▶'}
                        </button>
                        {expandedHint === 4 && (
                          <div style={{ padding: '12px', background: '#0f172a', borderTop: '1px solid #334155', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'auto', maxHeight: 'none' }}>
                            {currentCard.imageUrl && (
                              <img
                                src={currentCard.imageUrl}
                                alt="Pokemon"
                                style={{
                                  maxWidth: '100%',
                                  height: 'auto',
                                  maxHeight: '200px',
                                  objectFit: 'contain'
                                }}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Input y Botones - Sticky */}
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  width: '100%',
                  maxWidth: '700px',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                  padding: '16px',
                  backgroundColor: '#1e293b',
                  borderTop: '1px solid #334155',
                  position: 'sticky',
                  bottom: 0,
                  zIndex: 10,
                  boxSizing: 'border-box',
                  flexShrink: 0
                }}>
                  <input
                    ref={inputRef}
                    type="text"
                    value={userGuess}
                    onChange={(e) => setUserGuess(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleGuess()}
                    placeholder="Escribe el nombre del Pokémon..."
                    style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#0f172a',
                      color: '#f1f5f9',
                      fontSize: '14px',
                      minWidth: '300px',
                      outline: 'none',
                      borderBottom: '2px solid #4ade80'
                    }}
                  />
                  <button
                    onClick={handleGuess}
                    style={{
                      padding: '12px 20px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#4ade80',
                      color: '#0f172a',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 200ms',
                      minWidth: '120px'
                    }}
                  >
                    ✓ Adivinar!
                  </button>
                  <button
                    onClick={handleNextCard}
                    style={{
                      padding: '12px 20px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#60a5fa',
                      color: '#0f172a',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 200ms',
                      minWidth: '140px'
                    }}
                  >
                    🔄 Cambiar Pokémon
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Panel Derecho - Contador de Puntos */}
          {gameState === 'playing' && (
            <div style={{
              width: '200px',
              background: '#0b1220',
              borderLeft: '3px solid #4ade80',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '30px',
              padding: '20px',
              boxSizing: 'border-box'
            }}>
              {/* Puntos grandes */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px'
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  Puntos
                </div>
                <div style={{
                  fontSize: '64px',
                  fontWeight: 'bold',
                  color: '#4ade80',
                  textShadow: '0 0 20px rgba(74, 222, 128, 0.5)',
                  textAlign: 'center'
                }}>
                  {score}
                </div>
              </div>

              {/* Timer */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px'
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  Tiempo
                </div>
                <div style={{
                  fontSize: '44px',
                  fontWeight: 'bold',
                  color: timeLeft <= 30 ? '#ef4444' : '#4ade80',
                  textShadow: timeLeft <= 30 ? '0 0 20px rgba(239, 68, 68, 0.5)' : '0 0 20px rgba(74, 222, 128, 0.5)',
                  transition: 'color 200ms, text-shadow 200ms',
                  textAlign: 'center'
                }}>
                  {difficulty === 'unlimited' ? '∞' : `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`}
                </div>
              </div>

              {/* Ronda */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px'
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  Ronda
                </div>
                <div style={{
                  fontSize: '48px',
                  fontWeight: 'bold',
                  color: '#60a5fa',
                  textShadow: '0 0 20px rgba(96, 165, 250, 0.5)'
                }}>
                  {round}
                </div>
              </div>

              {/* Dificultad */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                paddingTop: '20px',
                borderTop: '1px solid #334155'
              }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  Dificultad
                </div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#fbbf24',
                  textAlign: 'center'
                }}>
                  {difficultyOptions.find(d => d.key === difficulty)?.label}
                </div>
              </div>

              {/* Botón Reiniciar */}
              <button
                onClick={handleResetGame}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 200ms',
                  marginTop: '20px',
                  width: '90%'
                }}
              >
                🏠 Reiniciar
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default App;