import React, { useEffect, useState } from 'react';
import './RecruiterDashboard.css';

export default function RecruiterDashboard({ userEmail }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [jobFormData, setJobFormData] = useState({
    title: '',
    description: '',
    location: '',
    company: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [validated, setValidated] = useState(false);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = () => {
    fetch((import.meta.env.VITE_API_URL || '/api') + '/jobs', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(r => r.json())
      .then(data => {
        setJobs(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const handleCreateJob = () => {
    setEditingJob(null);
    setJobFormData({ title: '', description: '', location: '', company: '' });
    setShowJobForm(true);
    setValidated(false);
  };

  const handleEditJob = (job) => {
    setEditingJob(job);
    setJobFormData({
      title: job.title || '',
      description: job.description || '',
      location: job.location || '',
      company: job.company || ''
    });
    setShowJobForm(true);
    setValidated(false);
  };

  const handleSubmitJob = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    setValidated(true);
    setSubmitting(true);

    try {
      const url = editingJob
        ? `${import.meta.env.VITE_API_URL || '/api'}/jobs/${editingJob.id}`
        : `${import.meta.env.VITE_API_URL || '/api'}/jobs`;
      
      const response = await fetch(url, {
        method: editingJob ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(jobFormData)
      });

      if (response.ok) {
        loadJobs();
        setShowJobForm(false);
        setJobFormData({ title: '', description: '', location: '', company: '' });
      }
    } catch (error) {
      console.error('Error saving job:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!confirm('Are you sure you want to delete this job posting?')) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || '/api'}/jobs/${jobId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        loadJobs();
      }
    } catch (error) {
      console.error('Error deleting job:', error);
    }
  };

  const handleCloseForm = () => {
    setShowJobForm(false);
    setEditingJob(null);
    setJobFormData({ title: '', description: '', location: '', company: '' });
    setValidated(false);
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="recruiter-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <div>
            <h1>Recruiter Dashboard</h1>
            <p>Manage your job postings and find the best candidates</p>
          </div>
          <button className="btn-create" onClick={handleCreateJob}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 5v10M5 10h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Post New Job
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#87CEEB20' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="7" width="18" height="14" rx="2" stroke="#4A90E2" strokeWidth="2"/>
                <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="#4A90E2" strokeWidth="2"/>
              </svg>
            </div>
            <div>
              <h3>{jobs.length}</h3>
              <p>Active Postings</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#4A90E220' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#4A90E2" strokeWidth="2"/>
                <circle cx="9" cy="7" r="4" stroke="#4A90E2" strokeWidth="2"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="#4A90E2" strokeWidth="2"/>
              </svg>
            </div>
            <div>
              <h3>0</h3>
              <p>Applications</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#6B728020' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="#6B7280" strokeWidth="2"/>
                <path d="M22 4L12 14.01l-3-3" stroke="#6B7280" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <h3>0</h3>
              <p>Hired</p>
            </div>
          </div>
        </div>

        <div className="jobs-section">
          <h2>Your Job Postings</h2>
          
          {jobs.length === 0 ? (
            <div className="no-jobs">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                <circle cx="40" cy="40" r="38" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
                <path d="M40 30v20M30 40h20" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
              </svg>
              <h3>No job postings yet</h3>
              <p>Create your first job posting to start attracting candidates</p>
              <button className="btn-create" onClick={handleCreateJob}>
                Create Job Posting
              </button>
            </div>
          ) : (
            <div className="jobs-list">
              {jobs.map((job, index) => (
                <div
                  key={job.id}
                  className="job-item"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="job-info">
                    <h3>{job.title}</h3>
                    <div className="job-meta">
                      {job.company && (
                        <span className="meta-item">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <rect x="2" y="3" width="12" height="10" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                          </svg>
                          {job.company}
                        </span>
                      )}
                      {job.location && (
                        <span className="meta-item">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M8 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" stroke="currentColor" strokeWidth="1.5"/>
                            <path d="M13 6c0 4-5 8-5 8s-5-4-5-8a5 5 0 0 1 10 0z" stroke="currentColor" strokeWidth="1.5"/>
                          </svg>
                          {job.location}
                        </span>
                      )}
                      <span className="meta-item status-active">Active</span>
                    </div>
                    {job.description && (
                      <p className="job-preview">
                        {job.description.length > 150
                          ? `${job.description.substring(0, 150)}...`
                          : job.description}
                      </p>
                    )}
                  </div>
                  <div className="job-actions">
                    <button className="btn-action btn-edit" onClick={() => handleEditJob(job)}>
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M13 2l3 3-9 9H4v-3l9-9z" stroke="currentColor" strokeWidth="1.5"/>
                      </svg>
                      Edit
                    </button>
                    <button className="btn-action btn-delete" onClick={() => handleDeleteJob(job.id)}>
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M3 5h12M7 5V3h4v2M6 5v9a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V5" stroke="currentColor" strokeWidth="1.5"/>
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Job Form Modal */}
      {showJobForm && (
        <div className="modal-overlay" onClick={handleCloseForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={handleCloseForm}>✕</button>
            
            <h2>{editingJob ? 'Edit Job Posting' : 'Create New Job Posting'}</h2>

            <form onSubmit={handleSubmitJob} className={`job-form ${validated ? 'was-validated' : ''}`} noValidate>
              <div className="form-group">
                <label>Job Title *</label>
                <input
                  type="text"
                  placeholder="e.g., Senior Software Engineer"
                  value={jobFormData.title}
                  onChange={(e) => setJobFormData({ ...jobFormData, title: e.target.value })}
                  required
                />
                <div className="invalid-feedback">Please enter a job title.</div>
              </div>

              <div className="form-group">
                <label>Company Name *</label>
                <input
                  type="text"
                  placeholder="e.g., TechCorp Inc."
                  value={jobFormData.company}
                  onChange={(e) => setJobFormData({ ...jobFormData, company: e.target.value })}
                  required
                />
                <div className="invalid-feedback">Please enter the company name.</div>
              </div>

              <div className="form-group">
                <label>Location *</label>
                <input
                  type="text"
                  placeholder="e.g., San Francisco, CA"
                  value={jobFormData.location}
                  onChange={(e) => setJobFormData({ ...jobFormData, location: e.target.value })}
                  required
                />
                <div className="invalid-feedback">Please enter the job location.</div>
              </div>

              <div className="form-group">
                <label>Job Description *</label>
                <textarea
                  rows="6"
                  placeholder="Describe the role, responsibilities, and requirements..."
                  value={jobFormData.description}
                  onChange={(e) => setJobFormData({ ...jobFormData, description: e.target.value })}
                  required
                />
                <div className="invalid-feedback">Please enter a job description.</div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseForm}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={submitting}>
                  {submitting ? 'Saving...' : (editingJob ? 'Update Job' : 'Create Job')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
