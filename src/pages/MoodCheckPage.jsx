import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mic, Square, ArrowRight, CheckCircle2, AlertCircle, Loader2, Heart, Shield, MessageCircle } from 'lucide-react';
import './MoodCheckPage.css';

/* ── Sentiment lexicon for accurate emotion detection ── */
const POSITIVE_WORDS = new Set([
  'happy','great','fantastic','wonderful','amazing','excellent','good','joy',
  'love','laugh','smile','excited','thrilled','blessed','grateful','cheerful',
  'awesome','brilliant','delighted','glad','pleasure','enjoy','fun','beautiful',
  'positive','succeed','achieved','proud','confident','energetic','peaceful',
  'calm','relaxed','content','satisfied','hopeful','motivated','inspired','bright',
  'perfect','superb','adore','enthusiastic','free','better','best','nice'
]);

const NEGATIVE_WORDS = new Set([
  'sad','stressed','anxious','depressed','worried','tired','exhausted','overwhelmed',
  'bad','terrible','horrible','awful','hate','angry','fear','scared','panic',
  'lonely','hopeless','worthless','fail','failed','upset','frustrated','miserable',
  'crying','hurt','pain','lost','confused','nervous','irritated','disappointed',
  'struggling','hard','difficult','problem','trouble','unhappy','gloomy','dark',
  'stuck','freeze','broken','helpless','empty','numb','suffocate','dread'
]);

const STRESS_WORDS = new Set([
  'stress','pressure','deadline','work','exam','test','assignment','busy',
  'overwhelm','rush','late','behind','due','hectic','demanding','tense'
]);

function analyzeSentiment(transcript) {
  if (!transcript || transcript.trim().length === 0) return null;
  const words = transcript.toLowerCase().split(/\s+/);
  let pos = 0, neg = 0, stress = 0;

  words.forEach(w => {
    if (POSITIVE_WORDS.has(w)) pos++;
    if (NEGATIVE_WORDS.has(w)) neg++;
    if (STRESS_WORDS.has(w)) stress++;
  });

  const total = words.length || 1;
  const posScore   = pos / total;
  const negScore   = neg / total;
  const stressScore = stress / total;

  if (posScore > negScore && posScore > 0.03) {
    if (posScore > 0.08) return { mood: 'great',       label: 'Joyful & Positive',    emoji: '😄', color: '#16A34A', phase: 'Flourishing' };
    return                      { mood: 'good',        label: 'Generally Positive',   emoji: '🙂', color: '#2563EB', phase: 'Stable' };
  }
  
  if (stressScore > 0.1 || (stress > 1 && negScore < 0.05)) {
    return                      { mood: 'stressed',    label: 'Mildly Stressed',      emoji: '😟', color: '#CA8A04', phase: 'Tension' };
  }

  if (negScore > posScore && negScore > 0.04) {
    if (negScore > 0.12) return { mood: 'overwhelmed', label: 'Emotionally Overwhelmed', emoji: '😫', color: '#DC2626', phase: 'Crisis' };
    return                      { mood: 'stressed',    label: 'Low Mood',             emoji: '😟', color: '#CA8A04', phase: 'Tension' };
  }
  return                        { mood: 'okay',        label: 'Neutral',              emoji: '😐', color: '#525252', phase: 'Stable' };
}

const emojis = [
  { id: 'great',       label: 'Great',       icon: '😄', color: '#16A34A', bg: '#DCFCE7' },
  { id: 'good',        label: 'Good',        icon: '🙂', color: '#2563EB', bg: '#DBEAFE' },
  { id: 'okay',        label: 'Okay',        icon: '😐', color: '#525252', bg: '#F5F5F5' },
  { id: 'stressed',    label: 'Stressed',    icon: '😟', color: '#CA8A04', bg: '#FEF9C3' },
  { id: 'overwhelmed', label: 'Overwhelmed', icon: '😫', color: '#DC2626', bg: '#FEE2E2' },
];

/* ── Emotional Check-in Questions ── */
const CHECKIN_QUESTIONS = [
  {
    id: 'q1',
    question: 'Over the last 2 weeks, how often have you felt down, depressed, or hopeless?',
    options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
    scores: [0, 1, 2, 3],
  },
  {
    id: 'q2',
    question: 'How often have you had little interest or pleasure in doing things?',
    options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
    scores: [0, 1, 2, 3],
  },
  {
    id: 'q3',
    question: 'How often have you felt nervous, anxious, or on edge?',
    options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
    scores: [0, 1, 2, 3],
  },
  {
    id: 'q4',
    question: 'How often do you find it hard to control your worrying?',
    options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
    scores: [0, 1, 2, 3],
  },
  {
    id: 'q5',
    question: 'How often do you feel overwhelmed by your thoughts or situations?',
    options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
    scores: [0, 1, 2, 3],
  },
  {
    id: 'q6',
    question: 'Do you feel like you have no one to talk to about your problems?',
    options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
    scores: [0, 1, 2, 3],
  },
  {
    id: 'q7',
    question: 'How difficult is it for you to focus on studies or work because of how you feel?',
    options: ['Not difficult', 'Slightly difficult', 'Very difficult', 'Extremely difficult'],
    scores: [0, 1, 2, 3],
  },
];

function classifyStress(totalScore) {
  // Max score = 7 questions × 3 = 21
  if (totalScore <= 4)  return { level: 'low',      label: 'Low Stress',       color: '#16A34A', emoji: '🌿', message: "You're doing well! Keep nurturing your mental health." };
  if (totalScore <= 10) return { level: 'moderate',  label: 'Moderate Stress',  color: '#CA8A04', emoji: '🌤️', message: "You're managing, but consider taking some time for self-care." };
  if (totalScore <= 16) return { level: 'high',      label: 'High Stress',      color: '#EA580C', emoji: '🌧️', message: "It looks like things have been tough. We're here for you." };
  return                       { level: 'critical',  label: 'Critical Stress',  color: '#DC2626', emoji: '🆘', message: "Please consider reaching out to someone you trust, or a professional." };
}

/*
 * FLOW:
 *   Step 1 — Voice Recording
 *   Step 2 — Emoji Confirmation + Region
 *   Step 3 — Check-in Intro Screen
 *   Step 4..10 — Questions Q1–Q7 (step - 3 = question index)
 *   Step 11 — Processing → redirect
 */

export default function MoodCheckPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [voiceResult, setVoiceResult] = useState(null);
  const [selectedEmoji, setSelectedEmoji] = useState(null);
  const [finalMood, setFinalMood] = useState(null);
  const [region, setRegion] = useState('Global');

  // Check-in state
  const [checkinAnswers, setCheckinAnswers] = useState({});
  const [stressResult, setStressResult] = useState(null);

  const intervalRef    = useRef(null);
  const recognitionRef = useRef(null);

  // Determine total steps for the header dots
  // 1 (voice) + 2 (emoji) + 3 (intro) + 7 questions + processing = 12 total, show simplified dots
  const totalHeaderDots = 4; // simplified: voice → emoji → checkin → done
  const getHeaderProgress = () => {
    if (step <= 1) return 1;
    if (step <= 2) return 2;
    if (step <= 10) return 3; // checkin phase
    return 4;
  };

  // ── Recording logic ─────────────────
  const startRecording = () => {
    setTranscript('');
    setVoiceResult(null);
    setRecordingTime(0);
    setIsRecording(true);
    intervalRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.lang = 'en-US';
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      let fullText = '';
      rec.onresult = (e) => {
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          if (e.results[i].isFinal) fullText += t + ' ';
          else interim = t;
        }
        setTranscript(fullText + interim);
      };
      rec.onerror = (e) => console.warn('Speech recognition error:', e.error);
      rec.start();
      recognitionRef.current = rec;
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    clearInterval(intervalRef.current);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setTimeout(() => {
      setTranscript(prev => {
        const result = analyzeSentiment(prev);
        setVoiceResult(result);
        if (result) setSelectedEmoji(result.mood);
        return prev;
      });
    }, 600);
  };

  const toggleRecording = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  useEffect(() => () => {
    clearInterval(intervalRef.current);
    recognitionRef.current?.stop();
  }, []);

  const handleEmojiSelect = (id) => setSelectedEmoji(id);

  // Move to check-in intro after confirming mood
  const handleMoodConfirmed = () => {
    const chosen = emojis.find(e => e.id === selectedEmoji);
    setFinalMood(chosen);
    setStep(3); // Go to check-in intro
  };

  // Handle check-in answer
  const handleCheckinAnswer = (questionIndex, optionIndex, score) => {
    const qId = CHECKIN_QUESTIONS[questionIndex].id;
    setCheckinAnswers(prev => ({ ...prev, [qId]: { optionIndex, score } }));

    // If last question, compute stress and go to processing
    if (questionIndex === CHECKIN_QUESTIONS.length - 1) {
      const totalScore = Object.values({ ...checkinAnswers, [qId]: { score } })
        .reduce((sum, a) => sum + a.score, 0);
      const stress = classifyStress(totalScore);
      setStressResult(stress);
      // Short delay then go to processing
      setTimeout(() => setStep(11), 800);
    } else {
      // Next question
      setTimeout(() => setStep(step + 1), 300);
    }
  };

  // Final finish — save data and redirect
  const handleFinish = async () => {
    const chosen = finalMood;

    const sessionData = {
      id: chosen.id,
      label: chosen.label,
      icon: chosen.icon,
      color: chosen.color,
      bg: chosen.bg,
      region: region,
      stressLevel: stressResult?.level || 'unknown',
      stressLabel: stressResult?.label || '',
      checkinAnswers: checkinAnswers,
      timestamp: Date.now()
    };

    localStorage.setItem('userMood', JSON.stringify(sessionData));

    const allSessions = JSON.parse(localStorage.getItem('allUserSessions') || '[]');
    allSessions.push(sessionData);
    localStorage.setItem('allUserSessions', JSON.stringify(allSessions));

    const token = localStorage.getItem('aura_token');
    if (token) {
      try {
        await fetch('https://mindspace-backend-4ogv.onrender.com/api/history', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            type: 'mood',
            activity: chosen.id,
            details: `Felt ${chosen.label} in ${region} — Stress: ${stressResult?.label || 'N/A'}`
          })
        });
      } catch (err) {
        console.error('History save failed', err);
      }
    }

    setTimeout(() => navigate('/dashboard'), 2800);
  };

  // Trigger handleFinish when step 11 is reached
  useEffect(() => {
    if (step === 11) {
      handleFinish();
    }
  }, [step]);

  const formatTime = (t) => `${Math.floor(t/60).toString().padStart(2,'0')}:${(t%60).toString().padStart(2,'0')}`;

  // Calculate current question index when in question steps (4–10)
  const currentQuestionIndex = step - 4;
  const currentQuestion = CHECKIN_QUESTIONS[currentQuestionIndex];

  return (
    <div className="mood-check-page">
      <div className="mood-check-inner">

        {/* Header */}
        <div className="nb-mood-header">
          <span className="nb-logo-tag">🧠 MindBloom</span>
          <div className="nb-step-dots">
            {[1,2,3,4].map(s => <div key={s} className={`nb-dot ${getHeaderProgress() >= s ? 'active' : ''}`} />)}
          </div>
        </div>

        <AnimatePresence mode="wait">

          {/* STEP 1 — Voice Recording */}
          {step === 1 && (
            <motion.div key="s1" className="nb-step-card"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="nb-step-label">Step 1 of 2</div>
              <h1>How are you feeling?</h1>
              <p className="nb-step-desc">
                Speak freely for 10–30 seconds. Our AI reads your words to understand your emotional state accurately.
              </p>

              {/* Mic area */}
              <div className={`nb-mic-area ${isRecording ? 'recording' : ''}`}>
                <button className={`nb-mic-btn ${isRecording ? 'active' : ''}`} onClick={toggleRecording}>
                  {isRecording ? <Square size={36} /> : <Mic size={36} />}
                </button>
                <div className="nb-mic-label">
                  {isRecording ? (
                    <><span className="nb-rec-dot" /><span className="nb-rec-time">{formatTime(recordingTime)}</span></>
                  ) : recordingTime > 0 ? '✓ Recording captured' : 'Tap to speak'}
                </div>
                {isRecording && (
                  <div className="nb-wave-bars">
                    {[...Array(9)].map((_, i) => <div key={i} className="nb-bar" style={{ animationDelay: `${i * 0.08}s` }} />)}
                  </div>
                )}
              </div>

              {/* Live transcript */}
              {transcript && (
                <div className="nb-transcript-box">
                  <div className="nb-transcript-label">📝 Detected speech:</div>
                  <p className="nb-transcript-text">"{transcript.trim()}"</p>
                </div>
              )}

              {/* Voice analysis result */}
              {voiceResult && !isRecording && (
                <motion.div className="nb-voice-result"
                  style={{ '--mood-color': voiceResult.color }}
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                  <span className="nb-result-emoji">{voiceResult.emoji}</span>
                  <div>
                    <div className="nb-result-label">AI Detected: <strong>{voiceResult.label}</strong></div>
                    <div className="nb-result-phase">Phase: {voiceResult.phase}</div>
                  </div>
                  <CheckCircle2 size={20} color={voiceResult.color} />
                </motion.div>
              )}

              <div className="nb-step-actions">
                <button className="text-btn" onClick={() => setStep(2)}>Skip voice check</button>
                {recordingTime > 0 && !isRecording && (
                  <button className="btn btn-primary" onClick={() => setStep(2)}>
                    Next <ArrowRight size={18} />
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 2 — Emoji selection */}
          {step === 2 && (
            <motion.div key="s2" className="nb-step-card"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="nb-step-label">Step 2 of 2</div>
              <h1>Confirm your mood</h1>
              <p className="nb-step-desc">
                {voiceResult
                  ? `Our AI detected "${voiceResult.label}" from your voice. Does this match?`
                  : 'Pick the emotion that best describes how you feel right now.'}
              </p>

              <div className="nb-emoji-grid">
                {emojis.map(e => (
                  <motion.button key={e.id}
                    className={`nb-emoji-btn ${selectedEmoji === e.id ? 'selected' : ''}`}
                    style={{ '--e-color': e.color, '--e-bg': e.bg }}
                    onClick={() => handleEmojiSelect(e.id)}
                    whileHover={{ y: -3 }} whileTap={{ scale: 0.96 }}>
                    <span className="nb-emoji-icon">{e.icon}</span>
                    <span className="nb-emoji-label">{e.label}</span>
                    {voiceResult?.mood === e.id && <span className="nb-ai-badge">AI</span>}
                  </motion.button>
                ))}
              </div>

              <div className="input-group-nb w-100 mt-2 mb-2" style={{ textAlign: 'left', padding: '0 1rem' }}>
                <label style={{ fontWeight: 800, marginBottom: '0.5rem', display: 'block' }}>Select Your Region 📍</label>
                <select 
                  className="input-with-icon-nb w-100" 
                  value={region} 
                  onChange={e => setRegion(e.target.value)}
                  style={{ 
                    padding: '1rem', 
                    borderRadius: '12px', 
                    border: '3px solid var(--nb-border)',
                    background: '#fff',
                    fontWeight: 800,
                    fontSize: '1rem',
                    boxShadow: '4px 4px 0 var(--nb-border)'
                  }}
                >
                  <option value="Global">Global / Unspecified</option>
                  <option value="North America">North America</option>
                  <option value="Europe">Europe</option>
                  <option value="Asia">Asia</option>
                  <option value="South America">South America</option>
                  <option value="Africa">Africa</option>
                  <option value="Oceania">Oceania</option>
                </select>
              </div>

              <div className="nb-step-actions">
                <button className="text-btn" onClick={() => setStep(1)}>← Back</button>
                <button className="btn btn-primary" onClick={handleMoodConfirmed} disabled={!selectedEmoji}>
                  Continue <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3 — Check-in Intro Screen */}
          {step === 3 && (
            <motion.div key="s3-intro" className="checkin-wrapper"
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}>
              <div className="checkin-card checkin-intro">
                <div className="checkin-intro-glow" />
                <div className="checkin-intro-icon">
                  <Shield size={48} strokeWidth={1.5} />
                </div>
                <h2 className="checkin-intro-title">
                  Hey, just a few quick questions to understand how you're feeling.
                </h2>
                <p className="checkin-intro-subtitle">
                  This is completely anonymous and takes less than a minute.
                </p>
                <div className="checkin-intro-badges">
                  <span className="checkin-badge"><Heart size={14} /> Safe & Private</span>
                  <span className="checkin-badge"><MessageCircle size={14} /> ~60 seconds</span>
                </div>
                <motion.button 
                  className="checkin-start-btn"
                  onClick={() => setStep(4)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}>
                  👉 Start
                </motion.button>
                <button className="checkin-skip-btn" onClick={() => { setStressResult(classifyStress(0)); setStep(11); }}>
                  Skip check-in
                </button>
              </div>
            </motion.div>
          )}

          {/* STEPS 4–10 — Questions Q1 to Q7 */}
          {step >= 4 && step <= 10 && currentQuestion && (
            <motion.div key={`q-${currentQuestionIndex}`} className="checkin-wrapper"
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}>
              <div className="checkin-card checkin-question-card">
                {/* Progress indicator */}
                <div className="checkin-progress-row">
                  <span className="checkin-progress-label">{currentQuestionIndex + 1} of {CHECKIN_QUESTIONS.length}</span>
                  <div className="checkin-progress-bar">
                    <motion.div 
                      className="checkin-progress-fill"
                      initial={{ width: `${(currentQuestionIndex / CHECKIN_QUESTIONS.length) * 100}%` }}
                      animate={{ width: `${((currentQuestionIndex + 1) / CHECKIN_QUESTIONS.length) * 100}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                </div>

                {/* Chat bubble question */}
                <div className="checkin-chat-area">
                  <div className="checkin-avatar">🤗</div>
                  <motion.div 
                    className="checkin-bubble"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.3 }}>
                    <p>{currentQuestion.question}</p>
                  </motion.div>
                </div>

                {/* Answer buttons */}
                <div className="checkin-options">
                  {currentQuestion.options.map((option, idx) => (
                    <motion.button
                      key={idx}
                      className={`checkin-option-btn ${checkinAnswers[currentQuestion.id]?.optionIndex === idx ? 'selected' : ''}`}
                      onClick={() => handleCheckinAnswer(currentQuestionIndex, idx, currentQuestion.scores[idx])}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + idx * 0.07 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}>
                      <span className="checkin-option-dot" />
                      {option}
                    </motion.button>
                  ))}
                </div>

                {/* Back button */}
                {currentQuestionIndex > 0 && (
                  <button className="checkin-back-btn" onClick={() => setStep(step - 1)}>
                    ← Previous question
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 11 — Processing */}
          {step === 11 && (
            <motion.div key="s-final" className="nb-step-card nb-step-center"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <div style={{ fontSize: '4rem' }}>{finalMood?.icon || '🧠'}</div>
              <h2>Your profile is ready</h2>
              {stressResult && (
                <div className="checkin-stress-result" style={{ '--stress-color': stressResult.color }}>
                  <span style={{ fontSize: '1.75rem' }}>{stressResult.emoji}</span>
                  <div>
                    <div className="checkin-stress-level">{stressResult.label}</div>
                    <div className="checkin-stress-message">{stressResult.message}</div>
                  </div>
                </div>
              )}
              <p>Generating personalized recommendations for your <strong>{finalMood?.label || 'current'}</strong> state...</p>
              <div className="nb-processing-bar">
                <motion.div className="nb-processing-fill"
                  initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 2.5, ease: 'linear' }} />
              </div>
              <p className="nb-processing-hint">Redirecting to your dashboard...</p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
