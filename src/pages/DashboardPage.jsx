import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Leaf, MessageCircle, Heart, Users, Activity, PlayCircle, LogOut, Gamepad2, TrendingUp, Globe, Sparkles } from 'lucide-react';
import AuraChatbot from '../components/chatbot/AuraChatbot';
import './DashboardPage.css';

const activities = [
  { id: 'mudra', title: 'Mudra & Exercises', icon: <Heart size={24} />, path: '/mudra-therapy', desc: 'Center yourself with hand gestures and physical flow.', color: 'var(--nb-pink)', bg: 'var(--nb-red-bg)' },
  { id: 'games', title: 'Stress Relief Games', icon: <Gamepad2 size={24} />, path: '/games', desc: 'Pop bubbles and play with emojis to de-stress.', color: 'var(--nb-yellow)', bg: 'var(--nb-yellow-bg)' },
  { id: 'peer', title: 'Volunteer to Peer Connection', icon: <Users size={24} />, path: '/volunteer-support', desc: 'Connect with mentors and peers for guided support.', color: 'var(--nb-purple)', bg: 'var(--nb-purple-bg)' }
];

const MOOD_THEMES = {
  great: { class: 'status-green', tagColor: 'bg-green', message: "You're in a fantastic headspace! Share this energy." },
  good: { class: 'status-blue', tagColor: 'bg-blue', message: "You're feeling stable and positive today. Keep it up!" },
  okay: { class: 'status-gray', tagColor: 'bg-gray', message: "Feeling neutral? A quick game might lift your spirits." },
  stressed: { class: 'status-orange', tagColor: 'bg-orange', message: "A bit of tension detected. Try a Mindful Balloon session." },
  overwhelmed: { class: 'status-red', tagColor: 'bg-red', message: "Things seem heavy. Let's start with a simple Mudra." }
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [user, setUser] = useState(null);
  const [mood, setMood] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('aura_user');
    if (savedUser) setUser(JSON.parse(savedUser));

    const savedMood = localStorage.getItem('userMood');
    if (savedMood) setMood(JSON.parse(savedMood));

    // Fetch History
    const fetchHistory = async () => {
      const token = localStorage.getItem('aura_token');
      if (!token) return;
      try {
        const response = await fetch('http://127.0.0.1:5001/api/history', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setHistory(data);
        }
      } catch (err) {
        console.error('Fetch history failed', err);
      }
    };

    fetchHistory();
  }, []);

  const theme = mood ? (MOOD_THEMES[mood.id] || MOOD_THEMES.okay) : MOOD_THEMES.okay;

  const handleSignOut = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar Navigation */}
      <nav className="dashboard-sidebar nb-card">
        <div className="sidebar-brand">
          <div className="nb-tag bg-green">
            <Leaf size={24} />
            <span className="brand-text">Aura Youth</span>
          </div>
        </div>
        
        <div className="sidebar-links">
          <button className="sidebar-link active nb-tag w-100"><Activity size={20} /> Home</button>
          <button className="sidebar-link btn btn-secondary w-100" onClick={() => navigate('/mudra-therapy')}><Heart size={20} /> Therapy</button>
          <button className="sidebar-link btn btn-secondary w-100" onClick={() => navigate('/games')}><Gamepad2 size={20} /> Games</button>
          <button className={`sidebar-link btn ${isChatOpen ? 'nb-tag' : 'btn-secondary'} w-100`} onClick={() => setIsChatOpen(!isChatOpen)}><MessageCircle size={20} /> Aura Chat</button>
          <button className="sidebar-link btn btn-secondary w-100" onClick={() => navigate('/volunteer-support')}><Users size={20} /> Community</button>
          <button className="sidebar-link btn btn-secondary w-100" onClick={() => navigate('/ngo-dashboard')}><Globe size={20} /> NGO Dashboard</button>
        </div>

        <button className="btn btn-danger w-100 mt-auto" onClick={handleSignOut}>
          <LogOut size={20} /> Sign Out
        </button>
      </nav>

      {/* Main Content */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
            <h1>Yo, {user?.name || 'Friend'}! 🤙</h1>
            <p className="subtitle">Let's check out your mental vibe today.</p>
          </motion.div>
        </header>

        <div className="dashboard-grid">
          {/* Dynamic Vibe Card */}
          <motion.div 
            className={`nb-card-lg stat-card ${theme.class}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="stat-header">
              <div className={`nb-tag ${theme.tagColor}`}>Current Vibe</div>
              <span className="mood-badge">{mood?.icon} {mood?.label}</span>
            </div>
            <div className="stat-body">
              <p>{theme.message}</p>
              <button className="btn btn-yellow w-100 mt-1" onClick={() => navigate('/games')}>Open Games <Gamepad2 size={16}/></button>
            </div>
          </motion.div>

          {/* Personal Journey (History) */}
          <div className="history-section span-2">
            <h2 className="section-title">Personal Journey</h2>
            {history.length > 0 ? (
              <div className="history-flow-nb">
                {history.slice(0, 5).map((rec, i) => (
                  <motion.div 
                    key={rec._id} 
                    className="nb-card history-card"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="history-icon-nb">
                      {rec.type === 'mood' ? rec.data?.icon : '✨'}
                    </div>
                    <div className="history-details">
                      <strong>{rec.type.toUpperCase()} - {rec.data?.label || rec.data?.name || 'Session'}</strong>
                      <span>{new Date(rec.timestamp).toLocaleDateString()} at {new Date(rec.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div className="history-status-tag">Completed</div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="nb-card p-3 text-center">
                <p>No past activities yet. Let's start with a Mudra!</p>
              </div>
            )}
          </div>

          {/* Activities List */}
          <div className="activities-section span-2">
            <h2 className="section-title">Recommended Flows</h2>
            <div className="activities-grid">
              {activities.map((act, index) => (
                <motion.div 
                  key={act.id} 
                  className="nb-card activity-item"
                  style={{ '--act-bg': act.bg }}
                  whileHover={{ translate: '-4px -4px', boxShadow: '8px 8px 0px var(--nb-border)' }}
                  onClick={() => navigate(act.path)}
                >
                  <div className="activity-icon-container" style={{ background: act.color }}>
                    {act.icon}
                  </div>
                  <div className="activity-info">
                    <h3>{act.title}</h3>
                    <p>{act.desc}</p>
                  </div>
                  <div className="btn btn-secondary play-btn-nb">
                    <PlayCircle size={24} />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <AuraChatbot forcedOpen={isChatOpen} setForcedOpen={setIsChatOpen} />
    </div>
  );
}
