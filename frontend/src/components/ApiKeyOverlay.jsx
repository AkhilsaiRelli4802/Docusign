import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import './ApiKeyOverlay.css';

const ApiKeyOverlay = () => {
  const { updateOpenAIKey } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | loading | error | success
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!apiKey.startsWith('sk-') || apiKey.length < 20) {
      setStatus('error');
      setErrorMessage('Invalid API key. Check your OpenAI dashboard.');
      return;
    }

    setStatus('loading');
    try {
      await updateOpenAIKey(apiKey);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMessage('Failed to save API key. Please try again.');
    }
  };

  const getInputStatusClass = () => {
    if (status === 'error') return 'error';
    if (status === 'success') return 'success';
    if (apiKey.length > 5) return 'filled';
    return 'default';
  };

  return (
    <div className="api-key-overlay-container">
      <AnimatePresence>
        {status === 'success' && (
           <motion.div 
             initial={{ opacity: 0, y: -20, scale: 0.9 }}
             animate={{ opacity: 1, y: 0, scale: 1 }}
             exit={{ opacity: 0 }}
             className="success-toast"
           >
             <div className="toast-dot-green"></div>
             Brain activated!
           </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="api-key-modal"
      >
        <div className="lock-icon-container">
          <div className="pulse-ring-1"></div>
          <div className="pulse-ring-2"></div>
          <div className="lock-icon-bg">
             <Lock size={32} className="lock-svg" />
          </div>
        </div>

        <h2 className="brand-font">Activate Your Brain</h2>
        <p className="subtitle">
          DocuMind needs your OpenAI API key to process documents and power the AI chat. Your key is AES-256 encrypted.
        </p>

        <form onSubmit={handleSubmit} className="api-key-form">
          <div className={`key-input-wrapper ${getInputStatusClass()}`}>
            <input 
              type={showKey ? "text" : "password"} 
              placeholder="sk-proj-••••••••••••••••"
              value={apiKey}
              onChange={(e) => { setApiKey(e.target.value); if(status==='error') setStatus('idle'); }}
              className="mono-input"
              disabled={status === 'loading' || status === 'success'}
              required
            />
            <button 
              type="button" 
              className={`toggle-key-visibility ${showKey ? 'active' : ''}`}
              onClick={() => setShowKey(!showKey)}
              tabIndex="-1"
            >
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {status === 'error' && (
            <div className="error-message">
              {errorMessage}
            </div>
          )}

          <button 
            type="submit" 
            className={`activation-btn ${status}`}
            disabled={status === 'loading' || status === 'success'}
          >
            {status === 'loading' ? (
              <><span className="spinner-small"></span> Verifying key...</>
            ) : status === 'success' ? (
               'Activated!'
            ) : (
              <>Activate DocuMind <span style={{marginLeft: '8px'}}>→</span></>
            )}
          </button>
        </form>

        <div className="security-badges">
          <div className="encryption-badge">
            <Lock size={12} style={{marginRight: '6px', color: 'var(--text-muted)'}} />
            Encrypted with AES-256-CBC · Never shared
          </div>
          <div className="zero-knowledge-badge">
            <ShieldCheck size={14} style={{marginRight: '6px'}} />
            Zero-knowledge storage
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ApiKeyOverlay;
