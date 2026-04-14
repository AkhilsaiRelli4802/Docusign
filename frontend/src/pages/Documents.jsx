import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder, FileText, Trash2, ArrowDown, Paperclip, AlertCircle, FileUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Documents.css';

const Documents = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [pendingUpload, setPendingUpload] = useState(null); // { fileName, stage, progress, status, error }

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
    if (user && user.hasKey) {
      fetchDocuments();
    } else {
      setLoading(false);
    }
  }, [user]);

  const simulateProgress = (fileName) => {
    setPendingUpload({ fileName, stage: 1, progress: 0, status: 'processing' });
    
    // Stage 1 -> 2 (1s)
    setTimeout(() => setPendingUpload(prev => prev ? { ...prev, stage: 2 } : null), 1200);
    
    // Stage 2 -> 3 (3s)
    setTimeout(() => {
        setPendingUpload(prev => prev ? { ...prev, stage: 3, progress: 10 } : null);
        // Animate progress to 72%
        const interval = setInterval(() => {
            setPendingUpload(prev => {
                if (!prev || prev.progress >= 72 || prev.stage !== 3) {
                    clearInterval(interval);
                    return prev;
                }
                return { ...prev, progress: prev.progress + 2 };
            });
        }, 100);
    }, 3000);
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setMessage(null);
    simulateProgress(file.name);

    try {
      await axios.post('http://localhost:5000/api/documents/upload', formData);
      setPendingUpload(prev => prev ? { ...prev, stage: 4, progress: 100 } : null);
      
      // Delay for success animation before refreshing
      setTimeout(() => {
          setPendingUpload(null);
          setUploading(false);
          fetchDocuments();
          setMessage({ type: 'success', text: 'Document indexed successfully!' });
      }, 1500);
    } catch (err) {
      setPendingUpload(prev => prev ? { ...prev, status: 'failed', error: err.response?.data?.message || 'Upload failed' } : null);
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
    },
    multiple: false,
    disabled: !user?.hasKey || uploading
  });

  const deleteDoc = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/documents/${id}`);
      setDocuments(documents.filter(doc => doc._id !== id));
      setMessage({ type: 'success', text: 'Document removed' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete' });
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const getStats = () => {
    const ready = documents.filter(d => d.status?.toLowerCase() === 'ready').length;
    const processing = documents.filter(d => d.status?.toLowerCase() === 'processing').length;
    return { total: documents.length, ready, processing };
  };

  const stats = getStats();

  if (loading) {
    return <div className="loading-screen"><div className="spinner-small" style={{width: 32, height: 32}}></div></div>;
  }

  return (
    <div {...getRootProps()} className="vault-container">
      <input {...getInputProps()} />

      {/* Global Drag Overlay (S5-B) */}
      <AnimatePresence>
        {isDragActive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="global-drag-overlay"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="drag-icon-container"
            >
               <ArrowDown size={40} color="white" />
            </motion.div>
            <h2>Release to upload</h2>
            <p>File will be indexed immediately</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            className="success-toast"
            style={{ 
              position: 'fixed', right: '32px', top: '32px', 
              background: message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : undefined,
              borderColor: message.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : undefined,
              color: message.type === 'error' ? 'var(--failed-red)' : undefined
            }}
          >
            {message.type === 'error' ? <AlertCircle size={16} /> : <div className="toast-dot-green"></div>}
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="vault-header">
        <div>
          <h1>Your Vault</h1>
          <p>{documents.length} document{documents.length !== 1 ? 's' : ''} indexed</p>
        </div>
        <button className="upload-btn-header" onClick={open} disabled={!user?.hasKey || uploading}>
          <span>+</span> Upload
        </button>
      </div>

      {documents.length === 0 ? (
        /* S4: Empty State */
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`empty-dropzone ${isDragActive ? 'active' : ''}`}
          onClick={open}
        >
           <Folder size={64} className="folder-icon" fill="currentColor" style={{ color: '#F59E0B' }} />
           <h3>Drop your documents here</h3>
           <p>Or click to browse files.<br/>Your documents are private and encrypted.</p>
           
           <div className="file-pills">
             <div className="file-pill">PDF</div>
             <div className="file-pill">DOCX</div>
             <div className="file-pill">CSV</div>
             <div className="file-pill">TXT</div>
           </div>
        </motion.div>
      ) : (
        /* S5: Populated State */
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="stats-row">
            <div className="stat-card">
               <div className="stat-value total">{stats.total}</div>
               <div className="stat-label">Documents</div>
            </div>
            <div className="stat-card">
               <div className="stat-value ready">{stats.ready}</div>
               <div className="stat-label">Ready</div>
            </div>
            <div className="stat-card">
               <div className="stat-value processing">{stats.processing}</div>
               <div className="stat-label">Processing</div>
            </div>
          </div>

          <div className="compact-dropzone" onClick={open}>
            <Paperclip size={18} color="var(--text-muted)" />
            <span>Drop another file or <span className="browse-text">browse</span></span>
          </div>

          {/* Documents List */}
          <div className="vault-doc-list">
            <AnimatePresence>
              {pendingUpload && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`vault-doc-card ${pendingUpload.status === 'failed' ? 'upload-card-failed' : 'upload-card-processing'}`}
                >
                  {pendingUpload.status === 'failed' ? (
                    <div className="doc-icon-container" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                       <AlertCircle size={20} color="var(--failed-red)" />
                    </div>
                  ) : pendingUpload.stage === 2 ? (
                    <div className="scanning-container">
                       <div className="scanning-beam"></div>
                    </div>
                  ) : pendingUpload.stage === 4 ? (
                    <div className="doc-icon-container" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
                       <CheckCircle size={20} color="var(--ready-green)" className="success-bounce-icon" />
                    </div>
                  ) : (
                    <div className="doc-icon-container">
                       <FileUp size={20} color="var(--electric-indigo)" />
                    </div>
                  )}

                  <div className="doc-info-col">
                    <h4>{pendingUpload.fileName}</h4>
                    <p className="doc-meta-text" style={{ color: pendingUpload.status === 'failed' ? 'var(--failed-red)' : undefined }}>
                      {pendingUpload.status === 'failed' ? 
                         pendingUpload.error : 
                         pendingUpload.stage === 1 ? 'Awaiting extraction...' :
                         pendingUpload.stage === 2 ? 'Reading & extracting text...' :
                         pendingUpload.stage === 3 ? 'Creating embeddings via OpenAI API...' :
                         'Document ready to query!'}
                    </p>

                    {pendingUpload.status === 'failed' ? (
                       <button className="retry-btn" onClick={() => setPendingUpload(null)}>
                         Retry ↻
                       </button>
                    ) : pendingUpload.stage === 3 ? (
                       <>
                         <div className="vectorizing-progress-container">
                            <div className="vectorizing-progress-fill" style={{ width: `${pendingUpload.progress}%` }}></div>
                         </div>
                         <div className="progress-text">
                            <span>Indexing chunks</span>
                            <span>{pendingUpload.progress}%</span>
                         </div>
                       </>
                    ) : pendingUpload.stage < 4 ? (
                       <div className="upload-steps">
                          <div className="step-item">
                             <div className={`step-dot ${pendingUpload.stage > 1 ? 'done' : 'active'}`}></div>
                             <span className={`step-label ${pendingUpload.stage === 1 ? 'active' : ''}`}>Extract</span>
                          </div>
                          <div className="step-line" />
                          <div className="step-item">
                             <div className={`step-dot ${pendingUpload.stage > 2 ? 'done' : pendingUpload.stage === 2 ? 'active' : ''}`}></div>
                             <span className={`step-label ${pendingUpload.stage === 2 ? 'active' : ''}`}>Chunk</span>
                          </div>
                          <div className="step-line" />
                          <div className="step-item">
                             <div className={`step-dot ${pendingUpload.stage === 3 ? 'active' : ''}`}></div>
                             <span className={`step-label ${pendingUpload.stage === 3 ? 'active' : ''}`}>Index</span>
                          </div>
                       </div>
                    ) : null}
                  </div>

                  <div className={`vault-badge ${pendingUpload.status === 'failed' ? 'failed' : 'processing'}`} style={{ alignSelf: 'flex-start' }}>
                    {pendingUpload.status === 'failed' ? 'FAILED' : 'PROCESSING'}
                  </div>
                </motion.div>
              )}

              {documents.map((doc) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={doc._id} 
                  className="vault-doc-card"
                  style={{ position: 'relative' }}
                >
                  <div className="doc-icon-container">
                    <FileText size={20} color="var(--electric-indigo)" />
                  </div>
                  
                  <div className="doc-info-col">
                    <h4>{doc.fileName || doc.title}</h4>
                    <div className="doc-meta-text">
                       {doc.fileName?.split('.').pop()?.toUpperCase() || 'DOC'} • {(doc.fileSize / 1024 / 1024).toFixed(1)} MB • {new Date(doc.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className={`vault-badge ${doc.status?.toLowerCase() || 'processing'}`}>
                    {doc.status || 'PROCESSING'}
                  </div>

                  <button 
                    className="vault-trash-btn"
                    onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(doc._id); }}
                  >
                    <Trash2 size={18} />
                  </button>

                  <AnimatePresence>
                    {confirmDeleteId === doc._id && (
                       <motion.div 
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         exit={{ opacity: 0 }}
                         className="delete-confirm-overlay"
                       >
                          <div className="delete-confirm-actions">
                             <span>Remove document?</span>
                             <button className="btn-confirm-del" onClick={() => deleteDoc(doc._id)}>Delete</button>
                             <button className="btn-cancel-del" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
                          </div>
                       </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Documents;
