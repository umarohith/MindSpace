import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Play, Pause, Camera,
  ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, AlertCircle, Loader2, SkipForward, Activity, Heart
} from 'lucide-react';
import { analyzeMudra } from '../utils/gestureDetector';
import './MudraTherapyPage.css';

const PRACTICE_DURATION = 40;

const mudras = [
  {
    id: 'gyan', name: 'Gyan Mudra', sanskrit: 'ज्ञान मुद्रा',
    benefit: 'Mental clarity & focus',
    steps: [
      'Rest hands on your knees, palms facing UP.',
      'Touch the tip of your INDEX finger to your THUMB tip.',
      'Keep the remaining 3 fingers STRAIGHT and relaxed.',
    ],
    emoji: '🤌', color: 'var(--nb-purple)', bg: 'var(--nb-purple-bg)',
    image: '/mudras/gyan.png'
  },
  {
    id: 'prana', name: 'Prana Mudra', sanskrit: 'प्राण मुद्रा',
    benefit: 'Vitality & energy',
    steps: [
      'Sit with spine straight, hands on knees, palms UP.',
      'Fold your RING and LITTLE fingers to touch the THUMB tip.',
      'Keep INDEX and MIDDLE fingers EXTENDED together.',
    ],
    emoji: '🖐', color: 'var(--nb-blue)', bg: 'var(--nb-blue-bg)',
    image: '/mudras/prana.png'
  },
  {
    id: 'shuni', name: 'Shuni Mudra', sanskrit: 'शूनी मुद्रा',
    benefit: 'Patience & discipline',
    steps: [
      'Place hands on knees, palms facing up.',
      'Touch the tip of your MIDDLE finger to your THUMB tip.',
      'Keep all other fingers GENTLY extended.',
    ],
    emoji: '👌', color: 'var(--nb-green)', bg: 'var(--nb-green-bg)',
    image: '/mudras/shuni.png'
  }
];

const STATES = { ANALYZING: 'analyzing', CORRECT: 'correct', INCORRECT: 'incorrect', NO_HAND: 'no_hand' };

export default function MudraTherapyPage() {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [mpReady, setMpReady] = useState(false);
  const [itemIdx, setItemIdx] = useState(0);
  const [feedbackState, setFeedbackState] = useState(STATES.ANALYZING);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackTip, setFeedbackTip] = useState('');
  const [correctStreak, setCorrectStreak] = useState(0);
  const [timer, setTimer] = useState(PRACTICE_DURATION);
  const [allDone, setAllDone] = useState(false);

  const videoRef     = useRef(null);
  const canvasRef    = useRef(null);
  const handsRef     = useRef(null);
  const animFrameRef = useRef(null);
  const countdownRef = useRef(null);
  const streakRef    = useRef(0);
  const itemIdxRef   = useRef(0);

  itemIdxRef.current = itemIdx;
  const currentItem  = mudras[itemIdx];

  // MediaPipe Load
  useEffect(() => {
    const cdn = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands';
    const loadMP = async () => {
      if (!window.Hands) {
        const s = document.createElement('script');
        s.src = `${cdn}/hands.js`;
        s.onload = () => {
          const hands = new window.Hands({ locateFile: (f) => `${cdn}/${f}` });
          hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.6 });
          hands.onResults(onHandResults);
          handsRef.current = hands;
          setMpReady(true);
        };
        document.head.appendChild(s);
      } else {
        setMpReady(true);
      }
    };
    loadMP();
  }, []);

  const processFrame = useCallback(async () => {
    if (videoRef.current && handsRef.current && videoRef.current.readyState >= 2) {
      await handsRef.current.send({ image: videoRef.current });
    }
    animFrameRef.current = requestAnimationFrame(processFrame);
  }, []);

  const onHandResults = useCallback((results) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      setFeedbackState(STATES.NO_HAND);
      setFeedbackMessage('Show your hand');
      return;
    }

    const marks = results.multiHandLandmarks[0];
    
    // DRAW SKELETON
    if (marks) {
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      
      const connections = [
        [0, 1, 2, 3, 4],     // Thumb
        [0, 5, 6, 7, 8],     // Index
        [0, 9, 10, 11, 12],  // Middle
        [0, 13, 14, 15, 16], // Ring
        [0, 17, 18, 19, 20], // Pinky
        [5, 9, 13, 17]       // Knuckles
      ];

      connections.forEach(path => {
        ctx.beginPath();
        ctx.strokeStyle = '#8B5CF6';
        path.forEach((idx, i) => {
          const pt = marks[idx];
          if (i === 0) ctx.moveTo(pt.x * canvas.width, pt.y * canvas.height);
          else ctx.lineTo(pt.x * canvas.width, pt.y * canvas.height);
        });
        ctx.stroke();
      });

      marks.forEach(pt => {
        ctx.beginPath();
        ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = '#1A1A1A';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    }

    const result = analyzeMudra(mudras[itemIdxRef.current].id, marks, [{ landmarks: marks }]);

    if (result.correct) {
      setFeedbackState(STATES.CORRECT);
      setFeedbackMessage(result.message);
      streakRef.current += 1;
      setCorrectStreak(streakRef.current);
    } else {
      setFeedbackState(STATES.INCORRECT);
      setFeedbackMessage(result.message);
      setFeedbackTip(result.tip || '');
    }
  }, []);

  const startCountdown = useCallback(() => {
    setTimer(PRACTICE_DURATION);
    clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setTimer(p => {
        if (p <= 1) { clearInterval(countdownRef.current); return 0; }
        return p - 1;
      });
    }, 1000);
  }, []);

  const advance = () => {
    // Save to backend
    const token = localStorage.getItem('aura_token');
    const finishedItem = mudras[itemIdx];
    if (token) {
      fetch('http://127.0.0.1:5000/api/history', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'mudra',
          data: { name: finishedItem.name, id: finishedItem.id }
        })
      }).catch(err => console.error('History save failed', err));
    }

    if (itemIdx < mudras.length - 1) {
      setItemIdx(itemIdx + 1);
      setTimer(PRACTICE_DURATION);
      streakRef.current = 0;
      setCorrectStreak(0);
    } else {
      setAllDone(true);
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      startCountdown();
      animFrameRef.current = requestAnimationFrame(processFrame);
    } else {
      clearInterval(countdownRef.current);
      cancelAnimationFrame(animFrameRef.current);
    }
    return () => { clearInterval(countdownRef.current); cancelAnimationFrame(animFrameRef.current); };
  }, [isPlaying]);

  const toggleSession = async () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
        videoRef.current.srcObject = null;
      }
      setCameraActive(false);
    } else {
      setIsPlaying(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraActive(true);
      } catch (err) {
        console.error("Camera access failed", err);
        setIsPlaying(false);
      }
    }
  };

  if (allDone) {
    return (
      <div className="mudra-nb-page flex-center col">
        <div className="nb-card-lg completion-card p-3 text-center">
          <div className="big-emoji">🏆</div>
          <h2>Level Up!</h2>
          <p>You've completed your <strong>Mudra</strong> session flawlessly.</p>
          <button className="btn btn-primary mt-2" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mudra-nb-page">
      <nav className="nb-top-nav">
        <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}><ArrowLeft size={20}/></button>
        <div className="nb-tag bg-purple">Mudra Therapy Session</div>
        <div className="nb-tag bg-green">Level: Beginner</div>
      </nav>

      <div className="container nb-main-content mt-2">
        <div className="nb-grid">
          
              <div className="info-side">
                <motion.div key={currentItem.id} className="nb-card-lg p-4" initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="nb-tag" style={{background: currentItem.color, color:'#fff'}}>MUDRA {itemIdx + 1} / {mudras.length}</div>
                    <div className="flex gap-1">
                      <button 
                        className="btn btn-secondary btn-mini" 
                        onClick={() => setItemIdx(prev => Math.max(0, prev - 1))} 
                        disabled={itemIdx === 0}
                      >
                        <ChevronLeft size={16}/>
                      </button>
                      <button 
                        className="btn btn-secondary btn-mini" 
                        onClick={() => setItemIdx(prev => Math.min(mudras.length - 1, prev + 1))} 
                        disabled={itemIdx === mudras.length - 1}
                      >
                        <ChevronRight size={16}/>
                      </button>
                    </div>
                  </div>
                  <h1>{currentItem.name}</h1>
                  {currentItem.sanskrit && <p className="sanskrit-text">{currentItem.sanskrit}</p>}
                  
                  {currentItem.image && (
                    <div className="mudra-guide-img-container mt-2">
                       <img src={currentItem.image} alt={currentItem.name} className="mudra-guide-img" />
                    </div>
                  )}
                  
                  <div className="benefit-badge nb-tag bg-yellow mt-1">✨ {currentItem.benefit}</div>
                  
                  <div className="steps-list mt-2">
                    <h3 className="mb-1">Steps to follow:</h3>
                {currentItem.steps.map((s, i) => (
                  <div key={i} className="nb-step-item">
                    <span className="step-count">{i+1}</span>
                    <p>{s}</p>
                  </div>
                ))}
              </div>

              {isPlaying && (
                <div className="practice-progress mt-2">
                  <div className="flex justify-between font-bold mb-1">
                    <span>Practice Progress</span>
                    <span>{timer}s</span>
                  </div>
                  <div className="nb-progress-track">
                    <motion.div className="nb-progress-fill" style={{width: `${(timer/PRACTICE_DURATION)*100}%`, background: currentItem.color}} />
                  </div>
                </div>
              )}

              <button className="btn btn-primary w-100 mt-2 p-1" onClick={toggleSession}>
                {isPlaying ? <><Pause/> Pause Session</> : <><Play/> Start Mudra</>}
              </button>
            </motion.div>
          </div>

          {/* Visual Side */}
          <div className="visual-side">
            <div className="nb-card-lg master-visual-container cosmic-skin">
              <div className="camera-view-nb">
                 <div className="cosmic-scene">
                    <div className="cosmic-aura">
                      <div className="cosmic-spike" />
                      <div className="cosmic-orb" />
                      <div className="cosmic-ring" />
                    </div>
                    {(!cameraActive && !isPlaying) && (
                      <div className="cosmic-hint">
                        <Loader2 className="spinning" size={32}/>
                        <p>Camera will activate on start</p>
                      </div>
                    )}
                 </div>

                 <div 
                    className="floating-cam-nb lib-card"
                    style={{ 
                      visibility: cameraActive ? 'visible' : 'hidden', 
                      pointerEvents: cameraActive ? 'auto' : 'none',
                      opacity: cameraActive ? 1 : 0,
                      transform: cameraActive ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(20px)',
                      transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                    }}
                 >
                   <video ref={videoRef} autoPlay playsInline muted className="nb-video-pip" />
                   <canvas ref={canvasRef} className="nb-canvas-pip" width="640" height="480" />
                   <div className="cam-label-nb"><Camera size={14}/> Live Feed</div>
                 </div>

                 {isPlaying && (
                   <div className={`nb-feedback-status ${feedbackState}`}>
                     {feedbackMessage}
                     {feedbackState === STATES.CORRECT && <span className="streak-pop">🔥 {correctStreak}</span>}
                   </div>
                 )}
              </div>
              
              <div className="nb-controls-row p-1">
                {(timer === 0 || correctStreak >= 5) && (
                  <button className="btn btn-yellow w-100" onClick={advance}>
                    <SkipForward size={18}/> Next Mudra
                  </button>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
