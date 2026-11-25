import { useState, useRef, useEffect } from 'react';

const POINTS_BY_ATTEMPT = [100, 80, 60, 40, 20, 5];

const normalizePokemonText = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

const normalizePokemonGuess = (value: string) => {
  const trimmed = value.trim();
  if (trimmed.includes('♀')) {
    return `${normalizePokemonText(trimmed.replace(/♀/g, ''))}f`;
  }
  if (trimmed.includes('♂')) {
    return `${normalizePokemonText(trimmed.replace(/♂/g, ''))}m`;
  }
  return normalizePokemonText(trimmed);
};

const getNidoranVariantInfo = (card: any) => {
  if (!card) return { isNidoran: false, accepted: [] as string[] };
  const num = Number(card.numPokedex);
  const normName = normalizePokemonText(card.name || '');
  if (num === 29 || normName === 'nidoranf') {
    return {
      isNidoran: true,
      accepted: ['nidoranf', 'nidoranhembra', 'nidoranfemale', 'nidoranmujer'],
    };
  }
  if (num === 32 || normName === 'nidoranm') {
    return {
      isNidoran: true,
      accepted: ['nidoranm', 'nidoranmacho', 'nidoranmale', 'nidoranhombre'],
    };
  }
  return { isNidoran: false, accepted: [] as string[] };
};

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
  const [lastAttemptUsed, setLastAttemptUsed] = useState(1);
  const [askNidoranVariant, setAskNidoranVariant] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  );
  const [inputFocused, setInputFocused] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(() =>
    typeof window !== 'undefined' ? (window.visualViewport?.height || window.innerHeight) : 800
  );
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const updateLayoutMetrics = () => {
      setIsMobile(window.innerWidth < 1024);
      const vh = window.visualViewport?.height || window.innerHeight;
      setViewportHeight(vh);
      setKeyboardOpen(window.innerWidth < 1024 && vh < window.innerHeight * 0.78);
    };
    window.addEventListener('resize', updateLayoutMetrics);
    window.visualViewport?.addEventListener('resize', updateLayoutMetrics);
    return () => {
      window.removeEventListener('resize', updateLayoutMetrics);
      window.visualViewport?.removeEventListener('resize', updateLayoutMetrics);
    };
  }, []);

  const isCompactKeyboardMode = isMobile && (keyboardOpen || inputFocused);

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
      }, 200);
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

  const leftVisible = Boolean(currentCard && (revealedCard || showWrongGuessModal) && !isMobile);

  const pickRandomCard = (excludeCard?: any) => {
    if (!cards || cards.length === 0) return null;
    const filtered = cards.filter(card => {
      if (!card.numPokedex) return false;
      const num = Number(card.numPokedex);
      for (const gKey of selectedGens) {
        const [from, to] = (genMap as any)[gKey];
        if (num >= from && num <= to) return true;
      }
      return false;
    });
    if (filtered.length === 0) return null;
    const pool =
      excludeCard && filtered.length > 1
        ? filtered.filter(c => c.numPokedex !== excludeCard.numPokedex || c.name !== excludeCard.name)
        : filtered;
    const candidates = pool.length > 0 ? pool : filtered;
    return candidates[Math.floor(Math.random() * candidates.length)];
  };

  const handleNextCard = () => {
    setAskNidoranVariant(false);
    setFeedback('');
    setRound(r => r + 1);
    setRevealedCard(false);
    setHintLevel(0);
    setExpandedHint(0);
    const choice = pickRandomCard(currentCard);
    if (choice) {
      setCurrentCard(choice);
    }
  };

  const handleResetGame = () => {
    setScore(0);
    setRound(0);
    setTimeLeft(0);
    setGuessedCards([]);
    setCurrentCard(null);
    setGameState('init');
    setShowModal(true);
    setShowCorrectModal(false);
    setShowWrongGuessModal(false);
    setShowResultsModal(false);
    setShowEasterEggModal(false);
    setRevealedCard(false);
    setHintLevel(0);
    setExpandedHint(0);
    setLastPointsGained(0);
    setLastAttemptUsed(1);
    setAskNidoranVariant(false);
    setUserGuess('');
    setFeedback('');
  };

  const handleGuess = (overrideGuess?: unknown) => {
    const rawGuess = (typeof overrideGuess === 'string' ? overrideGuess : userGuess || '').trim();
    if (!rawGuess) {
      inputRef.current?.focus();
      return;
    }

    let g = normalizePokemonGuess(rawGuess);

    if (askNidoranVariant) {
      if (g === 'f' || g === 'hembra' || g === 'female' || g === 'mujer') {
        g = 'nidoranf';
      } else if (g === 'm' || g === 'macho' || g === 'male' || g === 'hombre') {
        g = 'nidoranm';
      }
    }

    // Caso especial: palabra clave "lumberjack"
    if (g === 'lumberjack') {
      if (revealedCard) {
        setRevealedCard(false);
        setUserGuess('');
        setFeedback('¡Panel oculto!');
      } else {
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

    const nidoranInfo = getNidoranVariantInfo(currentCard);

    // Si es Nidoran y solo escribió "nidoran", preguntar cuál variante sin quitar intento
    if (nidoranInfo.isNidoran && g === 'nidoran') {
      setAskNidoranVariant(true);
      setUserGuess('Nidoran ');
      setFeedback('¿Cuál variante?');
      inputRef.current?.focus();
      return;
    }

    const isCorrect = Boolean(
      currentCard &&
      (nidoranInfo.isNidoran
        ? nidoranInfo.accepted.includes(g)
        : g === normalizePokemonText(currentCard.name || ''))
    );

    // Validar si el nombre del Pokémon es correcto
    if (isCorrect) {
      // Sistema de puntos dinámicos según el hintLevel (6 intentos: 0-5)
      const points = POINTS_BY_ATTEMPT[hintLevel] ?? 0;
      setScore(s => s + points);
      setLastPointsGained(points);
      setLastAttemptUsed(hintLevel + 1);
      setGuessedCards(prev => [...prev, currentCard]);
      setAskNidoranVariant(false);
      setUserGuess('');
      setFeedback('');
      setRevealedCard(true); // Mostrar el panel
      setInputFocused(false);
      inputRef.current?.blur();
      setShowCorrectModal(true);
      return;
    } else {
      setAskNidoranVariant(false);
      // Error: incrementar nivel de pista (máximo 6 intentos)
      if (hintLevel < 4) {
        setHintLevel(h => h + 1);
        setExpandedHint(hintLevel + 1); // Auto-abrir la nueva pista
        setUserGuess('');
        setFeedback('✗ Intenta de nuevo...');
      } else if (hintLevel === 4) {
        // Última oportunidad (pista 5 - imagen)
        setHintLevel(h => h + 1);
        setExpandedHint(4); // Auto-abrir la pista 5 (imagen)
        setUserGuess('');
        setFeedback('✗ ¡Último intento!');
      } else {
        // Se agotaron las 6 oportunidades - Game over de la ronda
        setUserGuess('');
        setFeedback('✗ ¡No adivinaste!');
        setRevealedCard(true);
        setInputFocused(false);
        inputRef.current?.blur();
        setShowWrongGuessModal(true);
        return;
      }
    }

    // Devolver focus al input solo si seguimos adivinando
    inputRef.current?.focus();
  };

  const handleStartGame = () => {
    setShowModal(false);
    setGameState('playing');
    setRound(1);
    setScore(0);
    setGuessedCards([]);
    setRevealedCard(false);
    setHintLevel(0);
    setExpandedHint(0);
    setLastPointsGained(0);
    setLastAttemptUsed(1);
    setAskNidoranVariant(false);
    setUserGuess('');
    setFeedback('');

    // Obtener tiempo según dificultad
    const diffOpt = difficultyOptions.find(d => d.key === difficulty);
    const timeInSeconds = diffOpt?.time ?? 300;
    setTimeLeft(timeInSeconds);

    const choice = pickRandomCard();
    if (choice) {
      setCurrentCard(choice);
    }
  };

  useEffect(() => {
    if (gameState === 'playing' && !currentCard && cards && cards.length > 0) {
      const choice = pickRandomCard();
      if (choice) {
        setCurrentCard(choice);
      }
    }
  }, [gameState, currentCard, cards, selectedGens]);

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
  void pulse;

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
          flexDirection: 'row',
          background: '#1e293b'
        }}
      >
        {/* Side panel - solo en desktop */}
        {!isMobile && (
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
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                fontSize: '12px',
                lineHeight: '1.2',
                width: '100%',
                maxHeight: '100vh',
                height: 'fit-content',
                margin: '8px',
                overflow: 'auto'
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
        )}

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
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', alignItems: 'center', paddingLeft: isMobile ? '0px' : '20px', paddingRight: isMobile ? '0px' : '20px', paddingTop: isMobile ? '0px' : '20px', paddingBottom: isMobile ? '0px' : '0', flexDirection: 'column', gap: 12, overflowY: 'auto', width: '100%' }}>
            {showCorrectModal ? (
              /* Modal de Acierto */
              <div style={{
                background: '#0f172a',
                border: '3px solid #4ade80',
                borderRadius: '12px',
                padding: isMobile ? '22px 18px' : '36px 40px',
                maxWidth: '500px',
                width: isMobile ? 'calc(100% - 24px)' : '100%',
                boxSizing: 'border-box',
                boxShadow: '0 0 30px rgba(74, 222, 128, 0.3)',
                textAlign: 'center',
                marginTop: isMobile ? '62px' : 0,
                marginBottom: isMobile ? '16px' : 0
              }}>
                <h2 style={{
                  marginTop: 0,
                  marginBottom: isMobile ? '14px' : '20px',
                  textAlign: 'center',
                  fontSize: isMobile ? '30px' : '42px',
                  color: '#4ade80'
                }}>
                  ✨ ¡Acertaste!
                </h2>

                {currentCard?.imageUrl && (
                  <div style={{
                    margin: isMobile ? '0 auto 14px' : '0 auto 18px',
                    width: isMobile ? '140px' : '180px',
                    height: isMobile ? '140px' : '180px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '10px',
                    borderRadius: '14px',
                    background: 'radial-gradient(circle, rgba(74, 222, 128, 0.18) 0%, rgba(30, 41, 59, 0.65) 75%)',
                    border: '1px solid rgba(74, 222, 128, 0.35)',
                    boxSizing: 'border-box'
                  }}>
                    <img
                      src={currentCard.imageUrl}
                      alt={currentCard?.name || 'Pokémon'}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        width: 'auto',
                        height: 'auto',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 6px 14px rgba(0, 0, 0, 0.45))'
                      }}
                    />
                  </div>
                )}

                <div style={{ marginBottom: isMobile ? '14px' : '20px', fontSize: isMobile ? '16px' : '20px' }}>
                  <p style={{ marginTop: 0, marginBottom: '4px', color: '#94a3b8', fontSize: isMobile ? '13px' : '15px' }}>
                    Pokémon:
                  </p>
                  <p style={{ fontSize: isMobile ? '24px' : '28px', fontWeight: 'bold', color: '#fbbf24', marginTop: 0, marginBottom: 0 }}>
                    {currentCard?.name}
                  </p>
                </div>

                <div style={{ marginBottom: isMobile ? '16px' : '22px', padding: isMobile ? '12px' : '16px', backgroundColor: '#1e293b', borderRadius: '8px', border: '2px solid #fbbf24' }}>
                  <p style={{ marginTop: 0, marginBottom: '4px', fontSize: isMobile ? '13px' : '15px', color: '#94a3b8' }}>
                    Acertado en intento {lastAttemptUsed} de 6 · Puntos ganados:
                  </p>
                  <p style={{ marginTop: 0, marginBottom: 0, fontSize: isMobile ? '28px' : '32px', fontWeight: 'bold', color: '#fbbf24' }}>
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
                    padding: isMobile ? '12px 24px' : '14px 40px',
                    width: isMobile ? '100%' : 'auto',
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
                padding: isMobile ? '24px 18px' : '42px',
                maxWidth: '500px',
                width: isMobile ? 'calc(100% - 24px)' : '100%',
                boxSizing: 'border-box',
                boxShadow: '0 0 30px rgba(239, 68, 68, 0.3)',
                textAlign: 'center',
                marginTop: isMobile ? '62px' : 0,
                marginBottom: isMobile ? '16px' : 0
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
                textAlign: 'center',
                marginTop: isMobile ? '40px' : 0
              }}>
                <h2 style={{ marginTop: 0, marginBottom: '30px', textAlign: 'center', fontSize: '28px', color: '#4ade80' }}>
                  🎮 ¡Juego Terminado!
                </h2>
                
                <div style={{ marginBottom: '30px', fontSize: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <p style={{ margin: '0 0 6px 0', color: '#94a3b8', fontSize: '14px', textTransform: 'uppercase' }}>
                      Puntaje Total
                    </p>
                    <p style={{ fontSize: '38px', fontWeight: 'bold', color: '#fbbf24', margin: 0 }}>
                      {score} pts
                    </p>
                  </div>
                  <div style={{ paddingTop: '12px', borderTop: '1px solid #334155' }}>
                    <p style={{ margin: '0 0 4px 0', color: '#e2e8f0', fontSize: '15px' }}>
                      <strong>Pokémon adivinados:</strong> {guessedCards.length} de {round}
                    </p>
                  </div>
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
                textAlign: 'center',
                marginTop: isMobile ? '40px' : 0
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
                textAlign: 'center',
                marginTop: isMobile ? '40px' : 0
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
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                marginTop: isMobile ? '40px' : 0
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
                gap: isMobile ? '8px' : '0',
                width: '100%',
                maxWidth: '700px',
                height: isMobile ? (isCompactKeyboardMode ? `${viewportHeight}px` : '100dvh') : '100vh',
                overflowY: 'auto',
                overflowX: 'hidden',
                paddingTop: isMobile ? '58px' : '20px',
                paddingLeft: isMobile ? '10px' : 0,
                paddingRight: isMobile ? '10px' : 0,
                paddingBottom: isMobile ? '10px' : 0,
                boxSizing: 'border-box'
              }}>
                {/* Título (compacto en móvil y oculto mientras se escribe con teclado abierto) */}
                {!isCompactKeyboardMode && (
                  <h1 style={{
                    fontSize: isMobile ? '20px' : '36px',
                    fontWeight: 'bold',
                    color: '#ff6b6b',
                    textShadow: '0 0 10px rgba(255, 107, 107, 0.5)',
                    marginTop: isMobile ? '4px' : 0,
                    marginBottom: isMobile ? '4px' : '20px',
                    textAlign: 'center',
                    flexShrink: 0
                  }}>
                    ¡¿Quién es ese Pokémon?!
                  </h1>
                )}

                {/* En móvil, los controles van arriba de las pistas para que el teclado nunca los cubra */}
                {isMobile && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    width: '100%',
                    padding: '8px 10px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    boxSizing: 'border-box',
                    flexShrink: 0
                  }}>
                    <input
                      ref={inputRef}
                      type="text"
                      enterKeyHint="send"
                      value={userGuess}
                      onChange={(e) => setUserGuess(e.target.value)}
                      onFocus={() => setInputFocused(true)}
                      onBlur={() => window.setTimeout(() => setInputFocused(false), 120)}
                      onKeyDown={(e) => e.key === 'Enter' && handleGuess()}
                      placeholder={askNidoranVariant ? "Escribe F (Hembra) o M (Macho)..." : "Escribe el nombre del Pokémon..."}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '2px solid #4ade80',
                        background: '#1e293b',
                        color: '#f1f5f9',
                        fontSize: '15px',
                        width: '100%',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleGuess()}
                        style={{
                          padding: '9px 10px',
                          borderRadius: '8px',
                          border: 'none',
                          background: '#4ade80',
                          color: '#0f172a',
                          fontSize: '13px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          flex: '1 1 0',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        ✓ Adivinar!
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={handleNextCard}
                        style={{
                          padding: '9px 10px',
                          borderRadius: '8px',
                          border: 'none',
                          background: '#60a5fa',
                          color: '#0f172a',
                          fontSize: '13px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          flex: '1 1 0',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        🔄 Cambiar
                      </button>
                    </div>
                    {askNidoranVariant && (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        padding: '8px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(251, 191, 36, 0.1)',
                        border: '1px solid rgba(251, 191, 36, 0.45)'
                      }}>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#fbbf24', textAlign: 'center' }}>
                          ¿Cuál variante de Nidoran es?
                        </span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleGuess('Nidoran F')}
                            style={{
                              flex: 1,
                              padding: '8px',
                              borderRadius: '6px',
                              border: '1px solid #f472b6',
                              background: 'rgba(244, 114, 182, 0.18)',
                              color: '#f9a8d4',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              cursor: 'pointer'
                            }}
                          >
                            Nidoran F (Hembra)
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleGuess('Nidoran M')}
                            style={{
                              flex: 1,
                              padding: '8px',
                              borderRadius: '6px',
                              border: '1px solid #60a5fa',
                              background: 'rgba(96, 165, 250, 0.18)',
                              color: '#93c5fd',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              cursor: 'pointer'
                            }}
                          >
                            Nidoran M (Macho)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Pistas con Pestañas (Tabs) */}
                {!currentCard && (
                  <div style={{
                    background: '#0f172a',
                    border: '2px solid #334155',
                    borderRadius: '12px',
                    width: '100%',
                    maxWidth: '700px',
                    padding: '28px 20px',
                    textAlign: 'center',
                    color: '#94a3b8',
                    fontSize: '14px',
                    marginBottom: '12px',
                    boxSizing: 'border-box'
                  }}>
                    Cargando pistas del Pokémon...
                  </div>
                )}
                {currentCard && (
                  <div style={{
                    background: '#0f172a',
                    border: '2px solid #4ade80',
                    borderRadius: '12px',
                    width: '100%',
                    maxWidth: '700px',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    flex: '1 1 auto',
                    minHeight: isMobile ? '140px' : 'auto',
                    maxHeight: isMobile
                      ? (isCompactKeyboardMode ? `${Math.max(150, Math.round(viewportHeight - 175))}px` : 'calc(100dvh - 200px)')
                      : 'calc(100vh - 120px)',
                    marginBottom: isMobile ? '4px' : '12px',
                    marginTop: isMobile ? '0px' : '0px',
                    overflow: 'hidden'
                  }}
                  >
                    {/* Header con título y feedback */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '12px 16px', borderBottom: '2px solid #334155' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, flexWrap: 'wrap' }}>
                        <h3 style={{ marginTop: 0, marginBottom: 0, fontSize: '16px', color: '#4ade80' }}>
                          💡 PISTAS
                        </h3>
                        <span style={{
                          fontSize: '12px',
                          fontWeight: 'bold',
                          color: '#fbbf24',
                          backgroundColor: 'rgba(251, 191, 36, 0.12)',
                          border: '1px solid rgba(251, 191, 36, 0.35)',
                          borderRadius: '6px',
                          padding: '3px 8px'
                        }}>
                          Intento {hintLevel + 1}/6 · Vale {POINTS_BY_ATTEMPT[hintLevel] ?? 0} pts
                        </span>
                      </div>
                      {feedback && (
                        <div style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid ' + (feedback.includes('variante') ? '#fbbf24' : (feedback.includes('correcto') || feedback.includes('Secreto') || feedback.includes('oculto') ? '#4ade80' : '#ef4444')),
                          backgroundColor: feedback.includes('variante') ? 'rgba(251, 191, 36, 0.15)' : (feedback.includes('correcto') || feedback.includes('Secreto') || feedback.includes('oculto') ? 'rgba(74, 222, 128, 0.15)' : 'rgba(239, 68, 68, 0.15)'),
                          color: feedback.includes('variante') ? '#fbbf24' : (feedback.includes('correcto') || feedback.includes('Secreto') || feedback.includes('oculto') ? '#4ade80' : '#ef4444'),
                          fontSize: '11px',
                          fontWeight: 'bold',
                          whiteSpace: 'nowrap',
                          flexShrink: 0
                        }}>
                          {feedback}
                        </div>
                      )}
                    </div>

                    {/* Tab Buttons */}
                    <div style={{ display: 'flex', gap: '2px', padding: '8px', background: '#1e293b', borderBottom: '1px solid #334155', overflowX: 'auto' }}>
                      {hintLevel >= 0 && (
                        <button
                          onClick={() => setExpandedHint(0)}
                          style={{
                            padding: '10px 16px',
                            background: expandedHint === 0 ? '#334155' : '#0f172a',
                            border: expandedHint === 0 ? '2px solid #fbbf24' : '1px solid #334155',
                            borderRadius: '6px',
                            color: '#fbbf24',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 200ms',
                            whiteSpace: 'nowrap',
                            flexShrink: 0
                          }}
                        >
                          🔸 P1
                        </button>
                      )}
                      {hintLevel >= 1 && (
                        <button
                          onClick={() => setExpandedHint(1)}
                          style={{
                            padding: '10px 16px',
                            background: expandedHint === 1 ? '#334155' : '#0f172a',
                            border: expandedHint === 1 ? '2px solid #38bdf8' : '1px solid #334155',
                            borderRadius: '6px',
                            color: '#38bdf8',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 200ms',
                            whiteSpace: 'nowrap',
                            flexShrink: 0
                          }}
                        >
                          🔵 P2
                        </button>
                      )}
                      {hintLevel >= 2 && (
                        <button
                          onClick={() => setExpandedHint(2)}
                          style={{
                            padding: '10px 16px',
                            background: expandedHint === 2 ? '#334155' : '#0f172a',
                            border: expandedHint === 2 ? '2px solid #f87171' : '1px solid #334155',
                            borderRadius: '6px',
                            color: '#f87171',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 200ms',
                            whiteSpace: 'nowrap',
                            flexShrink: 0
                          }}
                        >
                          🔴 P3
                        </button>
                      )}
                      {hintLevel >= 3 && (
                        <button
                          onClick={() => setExpandedHint(3)}
                          style={{
                            padding: '10px 16px',
                            background: expandedHint === 3 ? '#334155' : '#0f172a',
                            border: expandedHint === 3 ? '2px solid #86efac' : '1px solid #334155',
                            borderRadius: '6px',
                            color: '#86efac',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 200ms',
                            whiteSpace: 'nowrap',
                            flexShrink: 0
                          }}
                        >
                          🟢 P4
                        </button>
                      )}
                      {hintLevel >= 4 && (
                        <button
                          onClick={() => setExpandedHint(4)}
                          style={{
                            padding: '10px 16px',
                            background: expandedHint === 4 ? '#334155' : '#0f172a',
                            border: expandedHint === 4 ? '2px solid #d8b4fe' : '1px solid #334155',
                            borderRadius: '6px',
                            color: '#d8b4fe',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 200ms',
                            whiteSpace: 'nowrap',
                            flexShrink: 0
                          }}
                        >
                          🟣 P5
                        </button>
                      )}
                    </div>

                    {/* Tab Content */}
                    <div style={{ padding: '16px', background: '#0f172a', overflowY: 'auto', flex: '1 1 auto' }}>
                      {/* Pista 1 */}
                      {expandedHint === 0 && hintLevel >= 0 && (
                        <div style={{ fontSize: '14px', color: '#cbd5e1' }}>
                          <p style={{ marginTop: 0, marginBottom: '12px', fontWeight: 'bold', color: '#fbbf24', fontSize: '16px' }}>{currentCard.apodo}</p>
                          <p style={{ marginTop: 0, marginBottom: '12px', lineHeight: '1.6' }}>{currentCard.description}</p>
                          <p style={{ marginTop: 0, marginBottom: 0, fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>"{currentCard.flavorText}"</p>
                        </div>
                      )}

                      {/* Pista 2 */}
                      {expandedHint === 1 && hintLevel >= 1 && (
                        <div style={{ fontSize: '16px', color: '#e2e8f0' }}>
                          <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{currentCard.type}</span>
                        </div>
                      )}

                      {/* Pista 3 */}
                      {expandedHint === 2 && hintLevel >= 2 && (
                        <div style={{ fontSize: '15px', color: '#e2e8f0' }}>
                          {currentCard.preEvolution && <div style={{ marginBottom: '8px' }}>← Anterior: {currentCard.preEvolution}</div>}
                          {currentCard.evolution && <div>→ Siguiente: {currentCard.evolution}</div>}
                          {!currentCard.preEvolution && !currentCard.evolution && <div>Sin evoluciones</div>}
                        </div>
                      )}

                      {/* Pista 4 */}
                      {expandedHint === 3 && hintLevel >= 3 && (
                        <div style={{ fontSize: '15px', color: '#e2e8f0' }}>
                          Empieza con: <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#86efac' }}>"{currentCard.name.split('')[0]}{currentCard.name.split('')[1] || ''}"</span>
                        </div>
                      )}

                      {/* Pista 5 */}
                      {expandedHint === 4 && hintLevel >= 4 && (
                        <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '150px' }}>
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
                  </div>
                )}

                {/* Input y Botones - Sticky abajo en desktop */}
                {!isMobile && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  width: '100%',
                  alignItems: 'center',
                  padding: '16px',
                  backgroundColor: '#1e293b',
                  borderTop: '1px solid #334155',
                  position: 'sticky',
                  bottom: 0,
                  zIndex: 10,
                  boxSizing: 'border-box',
                  flexShrink: 0,
                  marginLeft: 'auto',
                  marginRight: 'auto'
                }}>
                  {askNidoranVariant && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      flexWrap: 'wrap',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(251, 191, 36, 0.1)',
                      border: '1px solid rgba(251, 191, 36, 0.45)',
                      width: '100%',
                      maxWidth: '620px',
                      boxSizing: 'border-box'
                    }}>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#fbbf24' }}>
                        ¿Cuál variante de Nidoran es?
                      </span>
                      <button
                        type="button"
                        onClick={() => handleGuess('Nidoran F')}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: '1px solid #f472b6',
                          background: 'rgba(244, 114, 182, 0.18)',
                          color: '#f9a8d4',
                          fontSize: '13px',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        Nidoran F (Hembra)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGuess('Nidoran M')}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: '1px solid #60a5fa',
                          background: 'rgba(96, 165, 250, 0.18)',
                          color: '#93c5fd',
                          fontSize: '13px',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        Nidoran M (Macho)
                      </button>
                    </div>
                  )}
                  <div style={{
                    display: 'flex',
                    gap: '10px',
                    width: '100%',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexWrap: 'nowrap',
                    flexDirection: 'row'
                  }}>
                  <input
                    ref={inputRef}
                    type="text"
                    enterKeyHint="send"
                    value={userGuess}
                    onChange={(e) => setUserGuess(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGuess()}
                    placeholder={askNidoranVariant ? "Escribe F (Hembra) o M (Macho)..." : "Escribe el nombre del Pokémon..."}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '2px solid #4ade80',
                      background: '#0f172a',
                      color: '#f1f5f9',
                      fontSize: '14px',
                      minWidth: '300px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      height: '44px',
                      lineHeight: '20px',
                      verticalAlign: 'middle'
                    }}
                  />
                  <button
                    onClick={() => handleGuess()}
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
                      minWidth: '120px',
                      height: '44px',
                      lineHeight: '20px',
                      verticalAlign: 'middle'
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
                      minWidth: '140px',
                      height: '44px',
                      lineHeight: '20px',
                      verticalAlign: 'middle'
                    }}
                  >
                    🔄 Cambiar Pokémon
                  </button>
                  </div>
                </div>
                )}
              </div>
            )}
          </div>

          {/* Panel Derecho - Contador de Puntos */}
          {gameState === 'playing' && (
            <div style={{
              width: isMobile ? 'calc(100vw - 0px)' : '200px',
              height: isMobile ? 'auto' : '100vh',
              background: '#0b1220',
              borderLeft: isMobile ? 'none' : '3px solid #4ade80',
              borderTop: isMobile ? '3px solid #4ade80' : 'none',
              borderRight: isMobile ? 'none' : 'none',
              display: 'flex',
              flexDirection: isMobile ? 'row' : 'column',
              alignItems: 'center',
              justifyContent: isMobile ? 'space-around' : 'flex-start',
              gap: isMobile ? '0px' : '16px',
              padding: isMobile ? '2px 4px' : '12px',
              boxSizing: 'border-box',
              position: isMobile ? 'fixed' : 'relative',
              top: isMobile ? 0 : 'auto',
              left: isMobile ? 0 : 'auto',
              right: isMobile ? 0 : 'auto',
              zIndex: isMobile ? 5 : 'auto',
              overflowY: isMobile ? 'visible' : 'auto'
            }}>
              {/* Puntos grandes */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: isMobile ? '0px' : '10px'
              }}>
                <div style={{
                  fontSize: isMobile ? '10px' : '14px',
                  fontWeight: 'bold',
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Pts
                </div>
                <div style={{
                  fontSize: isMobile ? '20px' : '64px',
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
                gap: isMobile ? '0px' : '10px'
              }}>
                <div style={{
                  fontSize: isMobile ? '9px' : '14px',
                  fontWeight: 'bold',
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  T
                </div>
                <div style={{
                  fontSize: isMobile ? '14px' : '44px',
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
                gap: isMobile ? '0px' : '10px'
              }}>
                <div style={{
                  fontSize: isMobile ? '9px' : '14px',
                  fontWeight: 'bold',
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  R
                </div>
                <div style={{
                  fontSize: isMobile ? '18px' : '48px',
                  fontWeight: 'bold',
                  color: '#60a5fa',
                  textShadow: '0 0 20px rgba(96, 165, 250, 0.5)'
                }}>
                  {round}
                </div>
              </div>

              {/* Dificultad - Solo en Desktop */}
              {!isMobile && (
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
              )}

              {/* Botón Reiniciar - Solo en Desktop */}
              {!isMobile && (
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
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default App;