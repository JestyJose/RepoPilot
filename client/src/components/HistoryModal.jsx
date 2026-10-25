import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';

function HistoryModal({ isOpen, onClose, onSelectReport }) {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const fetchSavedReports = async () => {
    if (!user || !supabase) return;
    setLoading(true);
    setErrorMsg('');

    try {
      // Query protected by Row Level Security (auth.uid() = user_id)
      const { data, error } = await supabase
        .from('saved_audits')
        .select('id, repository_full_name, repository_url, readiness_score, grade, audit_result, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load your saved reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSavedReports();
    }
  }, [isOpen, user]);

  const handleDelete = async (id, repoName) => {
    if (!supabase) return;
    const confirmed = window.confirm(`Remove saved report for "${repoName}" from your history?`);
    if (!confirmed) return;

    setDeletingId(id);
    try {
      const { error } = await supabase
        .from('saved_audits')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setReports(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert(`Could not delete report: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card history-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} title="Close">
          ×
        </button>

        <div className="modal-header">
          <div className="modal-icon">📁</div>
          <h3 className="modal-title">Saved Audit History</h3>
          <p className="modal-subtitle">
            Reopen past audits or manage your saved repository reports. Protected by Row Level Security.
          </p>
        </div>

        {errorMsg && (
          <div className="auth-alert error" style={{ marginBottom: '1rem' }}>
            {errorMsg}
          </div>
        )}

        {loading ? (
          <div className="history-loading">
            <span className="spinner"></span>
            <p>Loading your saved audits...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="history-empty">
            <span className="empty-icon">📭</span>
            <h4>No saved reports yet</h4>
            <p>Analyze any public repository and click "Save Report" to keep track of your improvements here.</p>
          </div>
        ) : (
          <div className="history-list">
            {reports.map((report) => {
              const formattedDate = new Date(report.created_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <div key={report.id} className="history-item">
                  <div className="history-item-left">
                    <div className="history-score-badge">
                      <span className="h-score">{report.readiness_score}</span>
                      <span className="h-grade">Grade {report.grade}</span>
                    </div>

                    <div className="history-item-info">
                      <h4 className="history-repo-name">{report.repository_full_name}</h4>
                      <div className="history-meta-row">
                        <span className="history-date">Saved on {formattedDate}</span>
                        <a
                          href={report.repository_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="history-gh-link"
                          onClick={(e) => e.stopPropagation()}
                        >
                          GitHub ↗
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="history-actions">
                    <button
                      type="button"
                      className="btn-reopen"
                      onClick={() => {
                        onSelectReport(report.audit_result);
                        onClose();
                      }}
                    >
                      Reopen
                    </button>
                    <button
                      type="button"
                      className="btn-delete"
                      disabled={deletingId === report.id}
                      onClick={() => handleDelete(report.id, report.repository_full_name)}
                      title="Delete report"
                    >
                      {deletingId === report.id ? '...' : '🗑️'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default HistoryModal;
