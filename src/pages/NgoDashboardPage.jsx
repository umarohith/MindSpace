import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Leaf, MessageCircle, Heart, Users, Activity, LogOut, Gamepad2, TrendingUp, BarChart2, AlertCircle, Lightbulb, MapPin } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import './DashboardPage.css'; // inherit layout
import './NgoDashboardPage.css'; // specific styles

export default function NgoDashboardPage() {
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('All');

  useEffect(() => {
    // Read ONLY real user inputs, no random samples
    const rawData = JSON.parse(localStorage.getItem('allUserSessions') || '[]');
    setSessions(rawData);
  }, []);

  // Filter exactly by selected region
  const filteredSessions = selectedRegion === 'All'
    ? sessions
    : sessions.filter(s => s.region === selectedRegion);

  // Derived Real Data
  const totalUsers = filteredSessions.length;
  const highStressUsers = filteredSessions.filter(s => s.id === 'stressed' || s.id === 'overwhelmed').length;

  // Stress Level Pie Chart Data
  const stressData = [
    { name: 'Low Stress', value: filteredSessions.filter(s => s.id === 'great' || s.id === 'good').length, color: '#22c55e' },
    { name: 'Medium Stress', value: filteredSessions.filter(s => s.id === 'okay').length, color: '#f59e0b' },
    { name: 'High Stress', value: highStressUsers, color: '#ef4444' }
  ];

  // Emotion Distribution Bar Chart Data
  const emotionData = [
    { name: 'Great', count: filteredSessions.filter(s => s.id === 'great').length, fill: '#16a34a' },
    { name: 'Good', count: filteredSessions.filter(s => s.id === 'good').length, fill: '#3b82f6' },
    { name: 'Okay', count: filteredSessions.filter(s => s.id === 'okay').length, fill: '#6b7280' },
    { name: 'Stressed', count: filteredSessions.filter(s => s.id === 'stressed').length, fill: '#eab308' },
    { name: 'Overwhelmed', count: filteredSessions.filter(s => s.id === 'overwhelmed').length, fill: '#ef4444' }
  ];

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
          <button className="sidebar-link btn btn-secondary w-100" onClick={() => navigate('/volunteer-support')}><Users size={20} /> Support</button>
          <button className="sidebar-link active nb-tag w-100"><BarChart2 size={20} /> NGO Dashboard</button>
        </div>

        <button className="btn btn-danger w-100 mt-auto" onClick={handleSignOut}>
          <LogOut size={20} /> Sign Out
        </button>
      </nav>

      {/* Main Content */}
      <main className="dashboard-main ngo-main">
        <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
            <h1>NGO Insights 📊</h1>
            <p className="subtitle">Real-time mental health analytics from user sessions.</p>
          </motion.div>

          {/* REGION FILTER */}
          <motion.div className="nb-card" style={{ padding: '1rem', display: 'flex', gap: '10px', alignItems: 'center' }} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <MapPin size={24} color="var(--nb-purple)" />
            <select
              className="input-with-icon-nb"
              style={{ border: 'none', background: 'transparent', fontSize: '1.1rem', fontWeight: 'bold', outline: 'none' }}
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
            >
              <option value="All">All Regions (Global)</option>
              <option value="North America">North America</option>
              <option value="Europe">Europe</option>
              <option value="Asia">Asia</option>
              <option value="South America">South America</option>
              <option value="Africa">Africa</option>
              <option value="Oceania">Oceania</option>
              <option value="Global">Global / Unspecified</option>
            </select>
          </motion.div>
        </header>

        {/* Top Summary Cards */}
        <div className="ngo-summary-cards">
          <motion.div className="nb-card ngo-stat" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="ngo-stat-icon" style={{ background: 'var(--nb-blue-bg)' }}>
              <Users size={28} color="var(--nb-blue)" />
            </div>
            <div className="ngo-stat-info">
              <h3>{totalUsers}</h3>
              <p>Active Users Logging Data</p>
            </div>
          </motion.div>

          <motion.div className="nb-card ngo-stat" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="ngo-stat-icon" style={{ background: 'var(--nb-red-bg)' }}>
              <Activity size={28} color="var(--nb-pink)" />
            </div>
            <div className="ngo-stat-info">
              <h3>{highStressUsers}</h3>
              <p>High Stress Users</p>
            </div>
          </motion.div>
        </div>

        {/* Charts Grid */}
        <div className="ngo-charts-grid">
          {/* Stress Level Pie Chart */}
          <motion.div className="nb-card ngo-chart-card" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
            <h3 className="ngo-chart-title">Stress Level Distribution ({selectedRegion})</h3>
            <div className="chart-container">
              {totalUsers > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={stressData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                      {stressData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: 'center', color: '#888' }}>No data collected for this region yet.</div>
              )}
            </div>
          </motion.div>

          {/* Emotion Distribution Bar Chart */}
          <motion.div className="nb-card ngo-chart-card" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}>
            <h3 className="ngo-chart-title">Emotions Distribution ({selectedRegion})</h3>
            <div className="chart-container">
              {totalUsers > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={emotionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40}>
                      {emotionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: 'center', color: '#888' }}>No data collected for this region yet.</div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Insights Panel */}
        <motion.div className="nb-card ngo-insights-card bg-purple-light" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <div className="ngo-insights-header">
            <Lightbulb size={28} color="var(--nb-purple)" />
            <h2>Real-time AI Insights</h2>
          </div>
          <div className="ngo-insights-content">
            {totalUsers > 0 ? (
              <div className="insight-item">
                <div className={highStressUsers > totalUsers / 2 ? "nb-tag bg-red" : "nb-tag bg-green"}>
                  {highStressUsers > totalUsers / 2 ? "High Alert" : "Stable"}
                </div>
                <p>
                  <strong>Current Region Outlook:</strong> Out of {totalUsers} logged sessions in {selectedRegion},
                  {highStressUsers} users are currently experiencing significant stress.
                  {highStressUsers > totalUsers / 2
                    ? " We recommend preparing critical intervention services immediately for this demographic."
                    : " The community seems relatively stable right now."}
                </p>
              </div>
            ) : (
              <div className="insight-item">
                <div className="nb-tag bg-gray">Awaiting Data</div>
                <p>No actionable insights yet. Awaiting end-users from <strong>{selectedRegion}</strong> to complete their mood check-in.</p>
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
