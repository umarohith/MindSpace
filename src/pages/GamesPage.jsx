import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, X, Heart, Star, CloudRain, Smile } from 'lucide-react';
import './GamesPage.css';

// --- GAME 1: NEON XYLOPHONE (Pattern Matcher) ---
function XylophoneGame() {
  const [sequence, setSequence] = useState([]);
  const [userSequence, setUserSequence] = useState([]);
  const [level, setLevel] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState('Listen & Repeat');
  const [isGameOver, setIsGameOver] = useState(false);
  const audioCtx = useRef(null);
  const freqs = [261.63, 293.66, 329.63, 349.23]; // C4, D4, E4, F4
  const tubeRefs = [useRef(), useRef(), useRef(), useRef()];

  const initAudio = () => {
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
    }
  };

  const playNote = (index, isError = false) => {
    if (!audioCtx.current) return;
    const osc = audioCtx.current.createOscillator();
    const gain = audioCtx.current.createGain();
    
    osc.type = isError ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(isError ? 80 : freqs[index], audioCtx.current.currentTime);
    
    gain.gain.setValueAtTime(0, audioCtx.current.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, audioCtx.current.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.current.currentTime + (isError ? 0.5 : 1.0));
    
    osc.connect(gain);
    gain.connect(audioCtx.current.destination);
    osc.start();
    osc.stop(audioCtx.current.currentTime + 1.2);
  };

  const strikeTube = (index) => {
    playNote(index);
    const el = tubeRefs[index].current;
    if (el) {
      el.classList.remove('active');
      void el.offsetWidth;
      el.classList.add('active');
    }
  };

  const startGame = () => {
    initAudio();
    setSequence([]);
    setLevel(0);
    setIsGameOver(false);
    setStatus('Listen & Repeat');
    nextRound([]);
  };

  const nextRound = (currentSequence) => {
    const newLevel = currentSequence.length + 1;
    setLevel(newLevel);
    const nextSeq = [...currentSequence, Math.floor(Math.random() * 4)];
    setSequence(nextSeq);
    setUserSequence([]);
    setStatus(`Melody ${newLevel}`);
    setTimeout(() => playSequence(nextSeq), 1000);
  };

  const playSequence = async (seq) => {
    setIsPlaying(true);
    for (let id of seq) {
      strikeTube(id);
      await new Promise(r => setTimeout(r, 600));
    }
    setIsPlaying(false);
  };

  const handleTubeClick = (index) => {
    if (isPlaying || isGameOver || !audioCtx.current) return;
    
    const expected = sequence[userSequence.length];
    if (index === expected) {
      strikeTube(index);
      const nextUserSeq = [...userSequence, index];
      setUserSequence(nextUserSeq);
      if (nextUserSeq.length === sequence.length) {
        setTimeout(() => nextRound(sequence), 1000);
      }
    } else {
      playNote(0, true);
      setIsGameOver(true);
      setStatus("OFF KEY");
    }
  };

  return (
    <div className="game-container xylo-game">
      <div className="game-hud">
        <div className="nb-tag bg-pink">{status}</div>
        <div className="lvl-badge">Level: {level}</div>
      </div>

      <div className={`instrument-nb ${isGameOver ? 'error-shake' : ''}`}>
        {tubeRefs.map((ref, i) => (
          <div 
            key={i} 
            ref={ref} 
            className={`tube-nb t${i}`} 
            onMouseDown={() => handleTubeClick(i)}
            onTouchStart={() => handleTubeClick(i)}
          />
        ))}
      </div>

      <div className="game-actions">
        {(!audioCtx.current || isGameOver) && (
          <button className="btn btn-primary start-btn-nb" onClick={startGame}>
            {isGameOver ? 'RETRY MELODY' : 'START JOURNEY'}
          </button>
        )}
      </div>
    </div>
  );
}

// --- GAME 2: KINETIC POP (Orb Popping) ---
function KineticPopGame() {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const audioCtx = useRef(null);
  const gameLoopReq = useRef();
  const state = useRef({
    orbs: [],
    particles: [],
    ripples: []
  });

  const playPopSound = () => {
    if (!audioCtx.current) audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.current.state === 'suspended') audioCtx.current.resume();

    const now = audioCtx.current.currentTime;
    const osc = audioCtx.current.createOscillator();
    const osc2 = audioCtx.current.createOscillator();
    const gain = audioCtx.current.createGain();

    const freqs = [440, 554, 659, 880];
    const base = freqs[Math.floor(Math.random() * freqs.length)];
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.exponentialRampToValueAtTime(base * 2, now + 0.1);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(base * 1.5, now);
    
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain); osc2.connect(gain);
    gain.connect(audioCtx.current.destination);

    osc.start(); osc2.start();
    osc.stop(now + 0.4); osc2.stop(now + 0.4);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const resize = () => {
      canvas.width = canvas.parentElement.clientWidth - 40;
      canvas.height = 400;
    };
    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'; // Trail effect
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (Math.random() < 0.03) {
        state.current.orbs.push({
          r: Math.random() * 15 + 15,
          x: Math.random() * (canvas.width - 60) + 30,
          y: canvas.height + 50,
          speed: Math.random() * 2 + 1,
          hue: [330, 260, 200, 140][Math.floor(Math.random() * 4)] // Theme colors
        });
      }

      // Ripples
      state.current.ripples.forEach((rip, i) => {
        rip.r += 4; rip.alpha -= 0.03;
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.r, 0, Math.PI*2);
        ctx.strokeStyle = `hsla(${rip.hue}, 100%, 50%, ${rip.alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        if(rip.alpha <= 0) state.current.ripples.splice(i, 1);
      });

      // Particles
      state.current.particles.forEach((p, i) => {
        p.vy += 0.15; p.x += p.vx; p.y += p.vy; p.alpha -= 0.02;
        ctx.fillStyle = `hsla(${p.hue}, 100%, 50%, ${p.alpha})`;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        if(p.alpha <= 0) state.current.particles.splice(i, 1);
      });

      // Orbs
      state.current.orbs.forEach((o, i) => {
        o.y -= o.speed;
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = `hsl(${o.hue}, 100%, 50%)`;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${o.hue}, 100%, 60%)`;
        ctx.fill();
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
        if (o.y < -50) state.current.orbs.splice(i, 1);
      });

      gameLoopReq.current = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      cancelAnimationFrame(gameLoopReq.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const handleClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0].clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0].clientY) - rect.top;

    state.current.orbs.forEach((orb, i) => {
      if (Math.hypot(orb.x - x, orb.y - y) < orb.r + 15) {
        playPopSound();
        state.current.ripples.push({ x: orb.x, y: orb.y, r: 10, alpha: 1, hue: orb.hue });
        for(let j=0; j<10; j++) {
          state.current.particles.push({
            x: orb.x, y: orb.y, hue: orb.hue, size: Math.random() * 4 + 2,
            vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10, alpha: 1
          });
        }
        state.current.orbs.splice(i, 1);
        setScore(s => s + 1);
      }
    });
  };

  return (
    <div className="game-container kinetic-game">
      <div className="game-header-bar">
        <h3>Kinetic Pop</h3>
        <span className="nb-tag bg-blue">SCORE: {score}</span>
      </div>
      <div className="canvas-wrapper-nb">
        <canvas 
          ref={canvasRef} 
          onMouseDown={handleClick}
          onTouchStart={handleClick}
        />
        <div className="canvas-instruction">Tap to burst the stress orbs!</div>
      </div>
    </div>
  );
}

// --- MAIN GAMES PAGE ---
const gamesList = [
  { id: 'xylo', title: 'Neon Xylophone', icon: '🎹', color: 'var(--nb-purple-bg)', desc: 'Listen and repeat the cosmic melody.' },
  { id: 'kinetic', title: 'Kinetic Pop', icon: '✨', color: 'var(--nb-blue-bg)', desc: 'Burst the floating tension orbs.' },
];

export default function GamesPage() {
  const navigate = useNavigate();
  const [activeGame, setActiveGame] = useState(null);

  return (
    <div className="games-page">
      <nav className="nb-top-nav">
        <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={20} /> Back to Hub
        </button>
        <span className="nb-logo-tag">🎮 Games Center</span>
      </nav>

      <div className="container mt-2">
        <div className="games-header text-center">
          <h1 className="mb-1">Stress Relief Lounge</h1>
          <p className="subtitle">Interactive experiences designed to ground and relax you.</p>
        </div>

        <AnimatePresence mode="wait">
          {!activeGame ? (
            <motion.div 
              key="menu"
              className="games-grid mt-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              {gamesList.map((g) => (
                <div key={g.id} className="nb-card-lg game-card" style={{ '--card-color': g.color }}>
                  <div className="game-icon-lg">{g.icon}</div>
                  <h2>{g.title}</h2>
                  <p>{g.desc}</p>
                  <button className="btn btn-primary w-100" onClick={() => setActiveGame(g.id)}>
                    Play Now <Play size={16} />
                  </button>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="play"
              className="active-game-section mt-3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <div className="game-toolbar">
                <button className="btn btn-danger" onClick={() => setActiveGame(null)}>
                  <X size={20} /> Exit Game
                </button>
              </div>
              <div className="game-wrapper-nb">
                {activeGame === 'xylo' && <XylophoneGame />}
                {activeGame === 'kinetic' && <KineticPopGame />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
