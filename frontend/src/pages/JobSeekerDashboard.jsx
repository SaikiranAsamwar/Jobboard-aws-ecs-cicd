import React, { useEffect, useState } from 'react';
import './JobSeekerDashboard.css';

export default function JobSeekerDashboard({ userEmail }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [applicationData, setApplicationData] = useState({
    applicantName: '',
    applicantEmail: userEmail || '',
    resumeLink: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [validated, setValidated] = useState(false);

  useEffect(() => {
    fetch((import.meta.env.VITE_API_URL || '/api') + '/jobs')
      .then(r => r.json())
      .then(data => {
        setJobs(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleApplyClick = (job, e) => {
    e.stopPropagation();
    setSelectedJob(job);
    setShowApplicationForm(true);
    setSubmitSuccess(false);
    setApplicationData({
      applicantName: '',
      applicantEmail: userEmail || '',
      resumeLink: ''
    });
  };

  const handleApplicationSubmit = async (e) => {
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
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || '/api'}/jobs/${selectedJob.id}/apply`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(applicationData)
        }
      );

      if (response.ok) {
        setSubmitSuccess(true);
        setTimeout(() => {
          setShowApplicationForm(false);
          setSelectedJob(null);
        }, 2000);
      }
    } catch (error) {
      console.error('Application error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedJob(null);
    setShowApplicationForm(false);
    setSubmitSuccess(false);
    setValidated(false);
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading your opportunities...</p>
      </div>
    );
  }

  return (
    <div className="jobseeker-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Job Seeker Dashboard</h1>
          <p>Find your dream job from {jobs.length} available opportunities</p>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="search-section">
          <div className="search-box">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search by title, location, or company..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="clear-search" onClick={() => setSearchTerm('')}>✕</button>
            )}
          </div>
        </div>

        {filteredJobs.length === 0 ? (
          <div className="no-results">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="38" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
              <path d="M40 25v20M40 55h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            </svg>
            <h3>No jobs found</h3>
            <p>Try adjusting your search criteria</p>
          </div>
        ) : (
          <div className="jobs-grid">
            {filteredJobs.map((job, index) => (
              <div
                key={job.id}
                className="job-card"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="job-header">
                  <div className="job-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="7" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <span className="job-badge">New</span>
                </div>

                <h3 className="job-title">{job.title}</h3>
                {job.company && <p className="job-company">{job.company}</p>}
                {job.location && (
                  <p className="job-location">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M13 6c0 4-5 8-5 8s-5-4-5-8a5 5 0 0 1 10 0z" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                    {job.location}
                  </p>
                )}

                {job.description && (
                  <p className="job-description">
                    {job.description.length > 120
                      ? `${job.description.substring(0, 120)}...`
                      : job.description}
                  </p>
                )}

                <div className="job-footer">
                  <button
                    className="btn-apply"
                    onClick={(e) => handleApplyClick(job, e)}
                  >
                    Apply Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Application Modal */}
      {showApplicationForm && selectedJob && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={handleCloseModal}>✕</button>
            
            <h2>Apply for {selectedJob.title}</h2>
            {selectedJob.company && <p className="modal-company">{selectedJob.company}</p>}

            {submitSuccess ? (
              <div className="success-message">
                <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                  <circle cx="30" cy="30" r="28" stroke="#4A90E2" strokeWidth="2"/>
                  <path d="M18 30l8 8 16-16" stroke="#4A90E2" strokeWidth="3" strokeLinecap="round"/>
                </svg>
                <h3>Application Submitted!</h3>
                <p>We'll get back to you soon.</p>
              </div>
            ) : (
              <form onSubmit={handleApplicationSubmit} className={`application-form ${validated ? 'was-validated' : ''}`} noValidate>
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={applicationData.applicantName}
                    onChange={(e) => setApplicationData({ ...applicationData, applicantName: e.target.value })}
                    required
                  />
                  <div className="invalid-feedback">Please enter your name.</div>
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={applicationData.applicantEmail}
                    onChange={(e) => setApplicationData({ ...applicationData, applicantEmail: e.target.value })}
                    required
                  />
                  <div className="invalid-feedback">Please enter a valid email.</div>
                </div>

                <div className="form-group">
                  <label>Resume Link *</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={applicationData.resumeLink}
                    onChange={(e) => setApplicationData({ ...applicationData, resumeLink: e.target.value })}
                    required
                  />
                  <div className="invalid-feedback">Please provide a link to your resume.</div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-submit" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
