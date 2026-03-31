import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Heart, Activity, Users, Smile } from 'lucide-react';
import './LandingPage.css';

const features = [
  {
    icon: <Activity size={32} className="feature-icon" color="var(--accent-primary)" />,
    title: "AI Mood & Phase Detection",
    description: "Understand your emotional state through voice analysis and empathetic AI."
  },
  {
    icon: <Heart size={32} className="feature-icon" color="var(--accent-danger)" />,
    title: "Mudra Therapy",
    description: "Guided hand postures monitored in real-time to center your mind."
  },
  {
    icon: <Users size={32} className="feature-icon" color="var(--accent-success)" />,
    title: "Anonymous Peer Support",
    description: "Connect with a community safely. You are never alone."
  },
  {
    icon: <Smile size={32} className="feature-icon" color="var(--accent-warning)" />,
    title: "Routine Builder",
    description: "Develop resilient habits and watch your personal tree grow."
  }
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <nav className="navbar container">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="brand"
        >
          <div className="brand-logo"></div>
          <span className="brand-text">Aura Youth</span>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="nav-actions"
        >
          <button className="btn btn-outline" onClick={() => navigate('/login')}>Sign In</button>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>Get Started</button>
        </motion.div>
      </nav>

      <main className="container hero-section">
        <motion.div 
          className="hero-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          <div className="badge">✨ Your Safe Space for Emotional Wellbeing</div>
          <h1 className="hero-title">
            Nurture your mind,<br/>
            <span className="text-gradient">Grow your resilience.</span>
          </h1>
          <p className="hero-subtitle">
            A comprehensive, AI-powered platform designed combining modern therapy and ancient mudra practices. Find peace, build habits, and connect anonymously.
          </p>
          <div className="hero-cta">
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/login')}>
              Begin Your Journey
            </button>
          </div>
        </motion.div>

        <motion.div 
          className="features-grid"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          {features.map((feature, index) => (
            <div key={index} className="glass-panel feature-card">
              <div className="feature-icon-wrapper">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </motion.div>
      </main>
      
      {/* Decorative Orbs */}
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
    </div>
  );
}
