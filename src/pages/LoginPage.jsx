import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import './LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  
  // Validation States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin ? { email, password } : { email, password, name };

    try {
      const response = await fetch(`https://mindspace-backend-4ogv.onrender.com${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      // Store Auth
      localStorage.setItem('aura_token', data.token);
      localStorage.setItem('aura_user', JSON.stringify(data.user));
      
      navigate('/mood-check');
    } catch (err) {
      console.error('Registration/Login Error:', err);
      setError(err.message === 'Failed to fetch' 
        ? 'Server is not running. Please start the backend!' 
        : err.message);
    }
  };

  const handleAnonymous = () => {
    localStorage.removeItem('aura_token');
    localStorage.removeItem('aura_user');
    navigate('/mood-check');
  };

  return (
    <div className="login-page">
      <div className="login-inner">
        <div className="auth-header-nb">
          <span className="nb-logo-tag">🧠 MindBloom</span>
        </div>

        <motion.div 
          className="nb-card-lg login-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="auth-title-section">
            <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
            <p className="subtitle">
              {isLogin 
                ? 'Continue your journey to emotional wellbeing' 
                : 'Join a safe space for your mental health'}
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <AnimatePresence mode="popLayout">
              {!isLogin && (
                <motion.div 
                  className="input-group-nb"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label>Name or Alias</label>
                  <div className="input-with-icon-nb">
                    <User size={20} />
                    <input 
                      type="text" 
                      placeholder="How should we call you?" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required 
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="input-group-nb">
              <label>Email Address</label>
              <div className="input-with-icon-nb">
                <Mail size={20} />
                <input 
                  type="email" 
                  placeholder="you@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div className="input-group-nb">
              <label>Password</label>
              <div className="input-with-icon-nb">
                <Lock size={20} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
                <button 
                  type="button" 
                  className="eye-toggle" 
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div 
                className="nb-error-msg"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <AlertCircle size={16} /> {error}
              </motion.div>
            )}

            <button type="submit" className="btn btn-primary btn-full mt-1">
              {isLogin ? 'Sign In' : 'Register'}
            </button>
          </form>

          <div className="nb-divider">
            <span>or</span>
          </div>

          <button 
            className="btn btn-secondary btn-full"
            onClick={handleAnonymous}
          >
            Continue Anonymously
          </button>

          <div className="auth-footer-nb">
            <p>
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button 
                className="text-link-nb" 
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
              >
                {isLogin ? 'Sign up' : 'Log in'}
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
