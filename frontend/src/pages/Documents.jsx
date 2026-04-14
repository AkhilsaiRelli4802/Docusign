import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FileUp, FileText, Trash2, CheckCircle, AlertCircle, Loader2, X, Key, ShieldCheck, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Documents = () => {
  const { user, updateOpenAIKey } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [newKey, setNewKey] = useState('');
  const [keySubmitting, setKeySubmitting] = useState(false);

  const fetchDocuments = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/documents');
      setDocuments(res.data);
    } catch (err) {
      console.error('Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.hasKey) {
      fetchDocuments();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleKeySubmit = async (e) => {
    e.preventDefault();
    if (!newKey.trim()) return;
    setKeySubmitting(true);
    try {
      await updateOpenAIKey(newKey);
      setMessage({ type: 'success', text: 'OpenAI API key saved securely!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update key' });
    } finally {
      setKeySubmitting(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setMessage(null);

    try {
      await axios.post('http://localhost:5000/api/documents/upload', formData);
      setMessage({ type: 'success', text: 'Document indexed successfully!' });
      fetchDocuments();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Upload failed' });
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
    },
    multiple: false,
    disabled: !user?.hasKey
  });

  const deleteDoc = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/documents/${id}`);
      setDocuments(documents.filter(doc => doc._id !== id));
      setMessage({ type: 'success', text: 'Document removed' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete' });
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="brand-font">My Documents</h1>
        <p>Upload files to teach your AI agent about your business or research.</p>
      </div>

      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`alert-toast ${message.type}`}
          >
            {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)}><X size={16} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="doc-layout">
        {!user?.hasKey ? (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="setup-key-card glass"
          >
            <div className="setup-header">
              <div className="shield-icon"><ShieldCheck size={32} /></div>
              <h3>OpenAI Key Required</h3>
              <p>To extract text and create embeddings, we need your OpenAI API key. It will be encrypted before storage.</p>
            </div>
            
            <form onSubmit={handleKeySubmit} className="inline-key-form">
              <div className="input-wrapper">
                <Key size={18} />
                <input 
                  type="password" 
                  placeholder="Paste your sk-... key" 
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  required 
                />
              </div>
              <button type="submit" className="btn-primary" disabled={keySubmitting}>
                {keySubmitting ? 'Saving...' : 'Set API Key'}
              </button>
            </form>
          </motion.div>
        ) : (
          <div {...getRootProps()} className={`dropzone glass ${isDragActive ? 'active' : ''} ${uploading ? 'disabled' : ''}`}>
            <input {...getInputProps()} />
            {uploading ? (
              <div className="upload-status">
                <div className="doc-uploading-wrapper">
                  <FileText strokeWidth={1} size={80} />
                  <div className="scan-line"></div>
                </div>
                <h3 className="upload-text-glow">Extracting & Indexing...</h3>
                <p>Teaching your AI agent about this document.</p>
              </div>
            ) : (
              <div className="dropzone-content">
                <div className="upload-icon-circle">
                  <FileUp size={32} />
                </div>
                <h3>{isDragActive ? 'Drop it here!' : 'Click or drag a file to upload'}</h3>
                <p>Supports PDF, DOCX, CSV, and TXT (Max 10MB)</p>
              </div>
            )}
          </div>
        )}

        <div className="docs-list">
          <div className="list-header">
            <h3>Your Library</h3>
            <span className="count-badge">{documents.length}</span>
          </div>
          
          {loading ? (
            <div className="list-loading">
              <div className="modern-loader">
                <span></span><span></span><span></span>
              </div>
            </div>
          ) : !user?.hasKey ? (
            <div className="empty-state">
              <Lock size={48} />
              <p>Add your API key to view and manage collection.</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="empty-state">
              <FileText size={48} />
              <p>No documents yet. Upload your first one!</p>
            </div>
          ) : (
            <div className="grid-list">
              {documents.map((doc) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={doc._id} 
                  className="doc-card glass"
                >
                  <div className="doc-icon"><FileText size={24} /></div>
                  <div className="doc-info">
                    <h4>{doc.fileName}</h4>
                    <div className="doc-meta">
                      <span className={`status-tag ${doc.status}`}>{doc.status}</span>
                      <span>• {(doc.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  </div>
                  <button onClick={() => deleteDoc(doc._id)} className="delete-btn">
                    <Trash2 size={18} />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Documents;
