import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const calculateStrength = (pass) => {
    if (!pass) return 0;
    let s = 0;
    if (pass.length >= 8) s += 1;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) s += 1;
    if (/[0-9]/.test(pass)) s += 1;
    if (/[^A-Za-z0-9]/.test(pass)) s += 1;
    return s;
  };

  const strength = calculateStrength(password);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        navigate('/');
      } else {
        await signup(email, password);
        navigate('/api-key');
      }
    } catch (err) {
      console.error('Auth Error:', err?.response?.data || err);
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getInputClass = (name, val) => {
    if (error && name !== 'confirmPassword') return 'error-state';
    if (val && val.length > 0 && name === 'email' && val.includes('@') && !error) return 'valid-state';
    if (val && val.length > 0 && name === 'password' && isLogin && !error) return 'valid-state';
    if (val && val.length > 0 && name === 'confirmPassword' && val === password && !error) return 'valid-state';
    if (focusedInput === name) return ''; // Focus state handled by CSS pseudo-class, but we could add forced background tint if needed. CSS handles it natively on :focus.
    return '';
  };

  return (
    <div className="login-page">
      <div className="login-bg-shapes">
        <div className="shape shape-indigo"></div>
        <div className="shape shape-blue"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="login-card"
      >
        <div className="login-header">
          <div className="login-logo-orb">
            <div className="inner-orb"></div>
          </div>
          <h1>DocuMind</h1>
          <p>{isLogin ? 'Powered by RAG · GPT-4o' : 'Create your secure vault'}</p>
        </div>

        <div className="tab-switcher">
          <button 
            className={isLogin ? 'active' : ''} 
            onClick={() => { setIsLogin(true); setError(''); }}
            type="button"
          >
            Log In
          </button>
          <button 
            className={!isLogin ? 'active' : ''} 
            onClick={() => { setIsLogin(false); setError(''); }}
            type="button"
          >
            Sign Up
          </button>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="auth-error-toast"
            >
              <div className="toast-dot"></div>
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label>Email Address</label>
            <div className="input-wrapper">
              <input 
                type="email" 
                placeholder={isLogin ? "tej@rhinoagents.com" : "you@company.com"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
                className={getInputClass('email', email)}
                required
              />
              <div className="input-icon">
                <Mail size={16} />
              </div>
            </div>
          </div>

          <div className="input-group">
            <label>Password</label>
            <div className="input-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="•••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
                className={getInputClass('password', password)}
                required
              />
              <button 
                type="button" 
                className={`toggle-password ${showPassword ? 'active' : ''}`}
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            
            {!isLogin && (
              <div className="password-strength-container">
                <div className="strength-bar">
                  {[1, 2, 3, 4].map((level) => {
                    let segmentClass = '';
                    if (strength >= level) {
                      if (strength <= 2) segmentClass = 'active-weak';
                      else if (strength === 3) segmentClass = 'active-medium';
                      else if (strength === 4) segmentClass = 'active-strong';
                    }
                    return <div key={level} className={`strength-segment ${segmentClass}`}></div>;
                  })}
                </div>
                <div className="strength-text">
                  {strength === 0 && 'Enter a password'}
                  {strength > 0 && strength < 3 && 'Weak — add symbols and numbers'}
                  {strength === 3 && 'Medium strength — add a symbol to make it stronger'}
                  {strength === 4 && 'Strong password'}
                </div>
              </div>
            )}
          </div>

          {!isLogin && (
            <div className="input-group">
              <label>Confirm Password</label>
              <div className="input-wrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Repeat password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={() => setFocusedInput('confirmPassword')}
                  onBlur={() => setFocusedInput(null)}
                  className={getInputClass('confirmPassword', confirmPassword)}
                  required
                />
                <button 
                  type="button" 
                  className={`toggle-password ${showPassword ? 'active' : ''}`}
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          <button type="submit" className="cta-button" disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Continue' : 'Create Account')}
            {!loading && <span style={{marginLeft: '8px'}}>→</span>}
          </button>
        </form>

        <div className="login-footer-links">
          {isLogin ? (
            <>
              <p>
                Don't have an account? <button onClick={() => { setIsLogin(false); setError(''); }}>Sign Up</button>
              </p>
              <div className="divider"><span>or</span></div>
              <button>Forgot password?</button>
            </>
          ) : (
            <>
              <p>
                Already have an account? <button onClick={() => { setIsLogin(true); setError(''); }}>Log In</button>
              </p>
              <p style={{ marginTop: '16px', opacity: 0.5 }}>
                No OpenAI key needed at signup. Add it after.
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
