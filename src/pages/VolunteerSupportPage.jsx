import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, Users, Activity, LogOut, Gamepad2, BarChart2, MessageCircle, Leaf, 
  Search, Star, Clock, ShieldAlert, XCircle, Send, CheckCircle2, UserCircle 
} from 'lucide-react';
import './DashboardPage.css';
import './VolunteerSupportPage.css';

const INITIAL_VOLUNTEERS = [
  { id: 1, name: "Volunteer_21", status: "Online", tags: ["Stress Support", "Exam Help"], rating: 0, reviews: 0 },
  { id: 2, name: "Volunteer_09", status: "Online", tags: ["Anxiety Support", "Depression"], rating: 0, reviews: 0 },
  { id: 3, name: "Volunteer_42", status: "Busy", tags: ["General Chat", "Exam Help"], rating: 0, reviews: 0 },
  { id: 4, name: "Volunteer_11", status: "Online", tags: ["Crisis Support"], rating: 0, reviews: 0 }
];

export default function VolunteerSupportPage() {
  const navigate = useNavigate();
  const [volunteers, setVolunteers] = useState(INITIAL_VOLUNTEERS);
  const [activeTab, setActiveTab] = useState('Find Support');
  const [chatWith, setChatWith] = useState(null); // volunteer object
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [pastSessions, setPastSessions] = useState([]);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Chatting state
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! I'm here to listen. How are you feeling today?", sender: 'volunteer', time: '10:00 AM' }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);

  // Rating state
  const [rating, setRating] = useState(0);

  // User mood state to determine "Recommended for you"
  const [userState, setUserState] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('userMood');
    if (saved) {
      setUserState(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    // When a chat starts, record start time
    if (chatWith && !sessionStartTime) {
      setSessionStartTime(Date.now());
      setMessages([
        { id: 1, text: `Hello! I'm ${chatWith.name}. I'm here to listen. How are you feeling today?`, sender: 'volunteer', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]);
    }
  }, [chatWith]);

  const getBotResponse = (input) => {
    const text = input.toLowerCase();
    if (text.includes('exam') || text.includes('test') || text.includes('marks') || text.includes('study')) {
      return "Exams can be incredibly overwhelming. Remember to take things one step at a time. What subject is stressing you out the most right now?";
    }
    if (text.includes('stress') || text.includes('overwhelmed') || text.includes('pressure')) {
      return "It sounds like you're carrying a lot right now. I'm here to listen. Do you want to try a quick breathing exercise with me, or would you rather skip that and just vent?";
    }
    if (text.includes('sad') || text.includes('depress') || text.includes('cry') || text.includes('lonely')) {
      return "I'm really sorry you're feeling this way. It's totally okay to feel sad. You're not alone, I'm right here with you. Do you know what might have triggered this feeling?";
    }
    if (text.includes('anxi') || text.includes('nervous') || text.includes('panic') || text.includes('scared')) {
      return "Anxiety can feel so scary, but you are safe right now. Try to take a deep breath with me. Focus on 3 things you can see around you in your room.";
    }
    if (text.includes('hi') || text.includes('hello') || text.includes('hey')) {
      return "Hi there! I am so glad you reached out. How has your day been treating you?";
    }
    return "I hear you, and your feelings are completely valid. That sounds tough. Can you tell me a little bit more about what's on your mind?";
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const userMsgText = newMessage;
    setMessages(prev => [...prev, {
      id: Date.now(),
      text: userMsgText,
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setNewMessage('');
    
    // Mock volunteer contextual reply
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: getBotResponse(userMsgText),
        sender: 'volunteer',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1500 + Math.random() * 1000); // 1.5 - 2.5s delay
  };

  const endSession = () => {
    setShowRatingModal(true);
  };
  
  const finishSessionSubmission = () => {
    // Record past session dynamically
    const durationMs = sessionStartTime ? Date.now() - sessionStartTime : 0;
    const durationMins = Math.max(1, Math.round(durationMs / 60000));
    
    setPastSessions(prev => [
      { 
        id: Date.now(), 
        peerName: chatWith?.name || 'Volunteer', 
        duration: `${durationMins} min${durationMins > 1 ? 's' : ''}`, 
        status: "Completed", 
        date: "Just now",
        rating: rating
      },
      ...prev
    ]);

    // Update volunteer's rating in the list
    if (rating > 0 && chatWith) {
      setVolunteers(prev => prev.map(v => {
        if (v.id === chatWith.id) {
          const newReviews = v.reviews + 1;
          const newRating = ((v.rating * v.reviews) + rating) / newReviews;
          return { ...v, rating: newRating, reviews: newReviews };
        }
        return v;
      }));
    }

    setChatWith(null);
    setSessionStartTime(null);
    setShowRatingModal(false);
    setRating(0);
  };

  const getRecommendations = (v) => {
    if (!userState) return false;
    const moodLevel = userState.id;
    if ((moodLevel === 'stressed' || moodLevel === 'overwhelmed') && v.tags.includes('Stress Support')) return true;
    if (moodLevel === 'stressed' && v.tags.includes('Exam Help')) return true;
    return false;
  };

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
          <button className="sidebar-link btn btn-secondary w-100" onClick={() => navigate('/dashboard')}><Activity size={20} /> Home</button>
          <button className="sidebar-link btn btn-secondary w-100" onClick={() => navigate('/mudra-therapy')}><Heart size={20} /> Therapy</button>
          <button className="sidebar-link btn btn-secondary w-100" onClick={() => navigate('/games')}><Gamepad2 size={20} /> Games</button>
          <button className="sidebar-link btn btn-secondary w-100"><MessageCircle size={20} /> Chatbot</button>
          <button className="sidebar-link active nb-tag w-100"><Users size={20} /> Support</button>
          <button className="sidebar-link btn btn-secondary w-100" onClick={() => navigate('/ngo-dashboard')}><BarChart2 size={20} /> NGO Dashboard</button>
        </div>

        <button className="btn btn-danger w-100 mt-auto" onClick={handleSignOut}>
          <LogOut size={20} /> Sign Out
        </button>
      </nav>

      {/* Main Content */}
      <main className="dashboard-main support-main">
        {chatWith ? (
          // CHAT INTERFACE
          <motion.div className="chat-container nb-card-lg" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="chat-header">
              <div className="chat-user-info">
                <button className="btn btn-secondary" onClick={() => setChatWith(null)}>←</button>
                <div className="chat-avatar"><UserCircle size={40} color="var(--nb-purple)" /></div>
                <div>
                  <h3 style={{margin: 0}}>{chatWith.name}</h3>
                  <span className="nb-status positive">● Active Session</span>
                </div>
              </div>
              <div className="chat-actions">
                <button className="btn btn-secondary safety-btn" title="Report"><ShieldAlert size={20} /></button>
                <button className="btn btn-secondary safety-btn" title="Block"><XCircle size={20} /></button>
                <button className="btn btn-danger" onClick={endSession}>End Session</button>
              </div>
            </div>

            <div className="chat-body">
              <div className="chat-notice bg-blue">
                <ShieldAlert size={16} /> 
                <p>This is a safe, monitored space. You are currently chatting as <strong>{isAnonymous ? 'Anonymous User' : 'Your Alias'}</strong>.</p>
              </div>
              {messages.map(m => (
                <div key={m.id} className={`chat-bubble-wrapper ${m.sender === 'user' ? 'outgoing' : 'incoming'}`}>
                  <div className={`chat-bubble ${m.sender === 'user' ? 'bg-purple' : 'bg-gray'}`}>
                    {m.text}
                  </div>
                  <span className="chat-time">{m.time}</span>
                </div>
              ))}
            </div>

            <div className="chat-footer">
              <div className="anon-toggle">
                <label>
                  <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} />
                  Anonymous Mode
                </label>
              </div>
              <form className="chat-input-form" onSubmit={handleSendMessage}>
                <input 
                  type="text" 
                  className="chat-input nb-card" 
                  placeholder="Type a message..." 
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                />
                <button type="submit" className="btn btn-primary send-btn"><Send size={20} /></button>
              </form>
            </div>
          </motion.div>

        ) : (
          // TABS & LISTS
          <div className="support-overview">
            <header className="dashboard-header support-header">
               <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
                 <h1>Volunteer Support 🤝</h1>
                 <p className="subtitle">Connect anonymously with trained volunteers or peers.</p>
               </motion.div>
            </header>

            {/* USER VIEW */}
            <>
              <div className="support-tabs">
                {['Find Support', 'My Sessions'].map(tab => (
                  <button 
                    key={tab}
                    className={`support-tab ${activeTab === tab ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>

                <AnimatePresence mode="wait">
                  {activeTab === 'Find Support' && (
                    <motion.div key="find" className="support-tab-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <div className="search-bar nb-card" style={{ padding: '0.8rem 1.2rem', marginBottom: '1.5rem' }}>
                        <Search size={20} color="var(--nb-text-2)"/>
                        <input 
                          type="text" 
                          placeholder="Search by topic, e.g., Exam Stress, Anxiety..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>

                      <div className="volunteers-grid mt-2">
                        {volunteers.filter(v => 
                          v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          v.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
                        ).map(v => {
                          const isRecommended = getRecommendations(v);
                          return (
                            <div key={v.id} className="volunteer-card nb-card">
                              {isRecommended && <div className="nb-badge-top bg-purple">👉 Recommended for you</div>}
                              <div className="vol-header">
                                <div className="vol-avatar-placeholder"><UserCircle size={48} color="#888" /></div>
                                <div className="vol-details">
                                  <h4>{v.name}</h4>
                                  <span className={`status-dot ${v.status === 'Online' ? 'active' : 'busy'}`}></span>
                                  <span style={{ fontSize: '0.9rem', color: '#555' }}> {v.status}</span>
                                </div>
                              </div>
                              <div className="vol-tags mb-1" style={{ marginBottom: '0.2rem' }}>
                                {v.tags.map(t => <span key={t} className="nb-tag small bg-blue" style={{ padding: '0.4rem 0.8rem' }}>{t}</span>)}
                              </div>
                              <div className="vol-rating" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>
                                {v.reviews > 0 ? (
                                  <>
                                    <Star size={16} color="#eab308" fill="#eab308" /> {v.rating.toFixed(1)}/5 <span style={{fontSize: '0.8rem', color: '#888'}}>({v.reviews} feedback{v.reviews > 1 ? 's' : ''})</span>
                                  </>
                                ) : (
                                  <span style={{color: '#888', fontStyle: 'italic', fontSize: '0.9rem', fontWeight: 'normal'}}>No ratings yet</span>
                                )}
                              </div>
                              <button 
                                className="btn btn-primary w-100 mt-auto"  
                                disabled={v.status !== 'Online'}
                                onClick={() => setChatWith(v)}
                                style={{ padding: '0.8rem' }}
                              >
                                Connect Now <MessageCircle size={18} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'My Sessions' && (
                    <motion.div key="sessions" className="support-tab-content mt-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <div className="sessions-list">
                        {pastSessions.length === 0 ? (
                           <div className="nb-card" style={{textAlign: 'center', padding: '3rem', color: '#888'}}>
                             <Clock size={40} style={{marginBottom: '1rem', opacity: 0.5}}/>
                             <p>You haven't completed any sessions yet.</p>
                             <button className="btn btn-primary mt-1" onClick={() => setActiveTab('Find Support')}>Find Support Now</button>
                           </div>
                        ) : (
                          pastSessions.map(s => (
                            <div key={s.id} className="session-card nb-card">
                              <div className="session-info">
                                <h4>Chat with {s.peerName}</h4>
                                <p><Clock size={16}/> Duration: {s.duration}</p>
                                <p className="session-date">{s.date}</p>
                              </div>
                              <div className="session-status" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                <span className="nb-tag bg-gray">{s.status}</span>
                                {s.rating > 0 && (
                                  <span className="nb-tag bg-yellow" style={{ fontSize: '0.9rem' }}>
                                    <Star size={14} fill="#eab308" color="#eab308" style={{marginRight: '2px'}}/> {s.rating}/5 Rated
                                  </span>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            </div>
          )}

        {/* RATING MODAL */}
        <AnimatePresence>
          {showRatingModal && (
            <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div className="nb-card-lg modal-content" initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}>
                <h2>Rate your experience</h2>
                <p>How was your session? Your feedback helps us maintain a safe community.</p>
                
                <div className="star-rating-lg">
                  {[1,2,3,4,5].map(star => (
                    <Star 
                      key={star} 
                      size={40} 
                      color={rating >= star ? "#eab308" : "#ccc"} 
                      fill={rating >= star ? "#eab308" : "transparent"} 
                      onClick={() => setRating(star)}
                      style={{ cursor: 'pointer' }}
                    />
                  ))}
                </div>

                <div className="input-group-nb mt-2 mb-2">
                  <label>Optional text feedback:</label>
                  <textarea className="nb-card" rows="3" placeholder="How was your session? Was the volunteer helpful?"></textarea>
                </div>

                <div className="modal-actions">
                  <button className="btn btn-secondary" onClick={finishSessionSubmission}>Skip</button>
                  <button className="btn btn-primary" onClick={finishSessionSubmission}>Submit Feedback</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
