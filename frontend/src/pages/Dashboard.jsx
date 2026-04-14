import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Bot, Sparkles, Loader2, Files, ArrowRight } from 'lucide-react';
import Documents from './Documents';

const Dashboard = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hello! I'm your DocuMind agent. Ask me anything about your uploaded documents." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [docCount, setDocCount] = useState(null);
  const chatEndRef = useRef(null);

  const checkDocs = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/documents');
      setDocCount(res.data.length);
    } catch (err) {
      console.error('Failed to fetch doc count');
    }
  };

  useEffect(() => {
    checkDocs();
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
        text: "I'm sorry, I encountered an error. Please check your OpenAI key in document settings.",
        isError: true 
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (docCount === null) return (
    <div className="loading-screen">
      <div className="modern-loader">
        <span></span><span></span><span></span>
      </div>
    </div>
  );

  // IF NO DOCUMENTS: Show the Documents component instead of chat
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

  return (
    <div className="chat-container">
      <div className="chat-header">
        <Sparkles size={20} className="glow-icon" />
        <div>
          <h3>AI Knowledge Agent</h3>
          <p>Trained on {docCount} of your documents</p>
        </div>
      </div>

      <div className="chat-messages">
        <AnimatePresence>
          {messages.map((msg, index) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={index} 
              className={`message-wrapper ${msg.role}`}
            >
              <div className={`avatar ${msg.role}`}>
                {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
              </div>
              <div className={`message-bubble ${msg.role} ${msg.isError ? 'error' : ''}`}>
                <div className="message-content">{msg.text}</div>
                {msg.usedRAG && (
                  <div className="rag-badge">
                    <Sparkles size={12} />
                    <span>Fact-checked via Documents ({Math.round(msg.similarity * 100)}% match)</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="message-wrapper assistant">
              <div className="avatar assistant"><Bot size={18} /></div>
              <div className="message-bubble assistant typing">
                <div className="modern-loader" style={{ padding: 0 }}>
                  <span></span><span></span><span></span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={chatEndRef} />
      </div>

      <div className="chat-input-wrapper">
        <form onSubmit={handleSend} className="chat-form glass">
          <input 
            type="text" 
            placeholder="Ask a question about your files..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button type="submit" disabled={!input.trim() || loading}>
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Dashboard;
