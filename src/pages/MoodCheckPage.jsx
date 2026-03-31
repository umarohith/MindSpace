import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mic, Square, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
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

  // Determine dominant emotion
  if (posScore > negScore && posScore > 0.03) {
    if (posScore > 0.08) return { mood: 'great',       label: 'Joyful & Positive',    emoji: '😄', color: '#16A34A', phase: 'Flourishing' };
    return                      { mood: 'good',        label: 'Generally Positive',   emoji: '🙂', color: '#2563EB', phase: 'Stable' };
  }
  
  // Stress threshold increased to avoid false detections from single words
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

export default function MoodCheckPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [voiceResult, setVoiceResult] = useState(null);
  const [selectedEmoji, setSelectedEmoji] = useState(null);
  const [finalMood, setFinalMood] = useState(null);
  const [region, setRegion] = useState('Global'); // Default region

  const intervalRef    = useRef(null);
  const recognitionRef = useRef(null);

  // ── Start recording: Web Speech API + timer ─────────────────
  const startRecording = () => {
    setTranscript('');
    setVoiceResult(null);
    setRecordingTime(0);
    setIsRecording(true);

    // Start timer
    intervalRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);

    // Start speech recognition
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
    // Analyze after brief delay (allow final result to come in)
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

  const handleFinish = async () => {
    const chosen = emojis.find(e => e.id === selectedEmoji);
    setFinalMood(chosen);
    setStep(3);
    
    const sessionData = {
      id: chosen.id,
      label: chosen.label,
      icon: chosen.icon,
      color: chosen.color,
      bg: chosen.bg,
      region: region, // Added region
      timestamp: Date.now()
    };

    // Save to localStorage for the Dashboard to pick up
    localStorage.setItem('userMood', JSON.stringify(sessionData));

    // Consolidate into global DB for NGO Dashboard
    const allSessions = JSON.parse(localStorage.getItem('allUserSessions') || '[]');
    allSessions.push(sessionData);
    localStorage.setItem('allUserSessions', JSON.stringify(allSessions));

    // Save to backend history
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
            details: `Felt ${chosen.label} in ${region}`
          })
        });
      } catch (err) {
        console.error('History save failed', err);
      }
    }

    setTimeout(() => navigate('/dashboard'), 2800);
  };

  const formatTime = (t) => `${Math.floor(t/60).toString().padStart(2,'0')}:${(t%60).toString().padStart(2,'0')}`;

  return (
    <div className="mood-check-page">
      <div className="mood-check-inner">

        {/* Header */}
        <div className="nb-mood-header">
          <span className="nb-logo-tag">🧠 MindBloom</span>
          <div className="nb-step-dots">
            {[1,2,3].map(s => <div key={s} className={`nb-dot ${step >= s ? 'active' : ''}`} />)}
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
                <button className="btn btn-primary" onClick={handleFinish} disabled={!selectedEmoji}>
                  Complete Check-in <CheckCircle2 size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3 — Processing */}
          {step === 3 && (
            <motion.div key="s3" className="nb-step-card nb-step-center"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <div style={{ fontSize: '4rem' }}>{finalMood?.icon || '🧠'}</div>
              <h2>Your profile is ready</h2>
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
