import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Files, Paperclip, ArrowRight } from 'lucide-react';
import Documents from './Documents';
import './Dashboard.css';

const Dashboard = () => {
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      text: "Hello! I've indexed your documents in your vault. Ask me anything about them.",
      isInitial: true
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const chatEndRef = useRef(null);

  const fetchData = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/documents');
      setDocuments(res.data);
    } catch (err) {
      console.error('Failed to fetch data');
    } finally {
      setIsReady(true);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input;
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:5000/api/chat', { question: userMessage });
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: res.data.answer,
        usedRAG: res.data.usedRAG,
        similarity: res.data.similarityScore 
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: "I'm sorry, I encountered an error. Please verify your index in Document settings.",
        isError: true 
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isReady) return (
    <div className="loading-screen">
      <div className="spinner-small" style={{width: 32, height: 32}}></div>
    </div>
  );

  // IF NO DOCUMENTS: Show the Documents component instead of chat
  const docCount = documents.length;
  if (docCount === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        className="empty-dashboard"
      >
        <Documents />
      </motion.div>
    );
  }

  const renderBadge = (msg) => {
    if (msg.role !== 'assistant' || msg.isInitial || msg.isError) return null;

    if (!msg.usedRAG) {
      return (
        <div className="msg-badge none">
          <div className="badge-dot" style={{ background: '#777' }}></div>
          General knowledge
        </div>
      );
    }

    const match = Math.round(msg.similarity * 100);
    const isHigh = msg.similarity >= 0.91;

    return (
      <div className={`msg-badge ${isHigh ? 'high' : 'mid'}`}>
        <div className="badge-dot"></div>
        {isHigh ? 'Fact-checked via Documents' : 'From Documents'} · {match}% match
      </div>
    );
  };

  return (
    <div className="chat-container">
      {/* A1: Context Bar */}
      <div className="context-bar">
        <span className="context-label">Context:</span>
        {documents.slice(0, 2).map((doc, idx) => (
           <div key={idx} className="doc-pill">
             <Files size={12} />
             {doc.fileName || doc.title}
           </div>
        ))}
        {docCount > 2 && <span className="doc-pill-more">+{docCount - 2} more</span>}
      </div>

      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <div className={`message-wrapper ${msg.role}`} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {msg.role === 'assistant' && (
                <div className="avatar assistant">
                   <div style={{ background: 'white', width: 14, height: 14, borderRadius: '50%' }}></div>
                </div>
              )}
              
              <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '80%', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                 <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className={`message-bubble ${msg.role} ${msg.isError ? 'error' : ''}`}
                 >
                    {msg.text}
                 </motion.div>
                 {renderBadge(msg)}
              </div>

              {msg.role === 'user' && (
                <div className="avatar user">
                   <User size={16} />
                </div>
              )}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="message-wrapper assistant" style={{ display: 'flex', gap: '12px' }}>
            <div className="avatar assistant">
               <div style={{ background: 'white', width: 14, height: 14, borderRadius: '50%' }}></div>
            </div>
            <div className="message-bubble assistant">
               <div className="typing-dots">
                 <div className="typing-dot"></div>
                 <div className="typing-dot"></div>
                 <div className="typing-dot"></div>
               </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="chat-input-wrapper">
        <form onSubmit={handleSend} className="chat-input-pill">
           <input 
            type="text" 
            placeholder="Ask anything about your docs..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <Paperclip size={18} className="attachment-btn" />
          <button type="submit" className={`send-btn ${input.trim() ? 'active' : ''}`} disabled={!input.trim() || loading}>
            <ArrowRight size={22} />
          </button>
        </form>
        <p className="chat-footer-text">DocuMind only answers from your indexed documents when relevant</p>
      </div>
    </div>
  );
};

export default Dashboard;
