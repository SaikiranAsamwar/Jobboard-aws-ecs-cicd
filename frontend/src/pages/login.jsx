import React, { useState } from 'react';
import './Login.css';

export default function Login({ onLoginSuccess }){
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('jobseeker');
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validated, setValidated] = useState(false);

  async function submit(e){
    e.preventDefault();
    const form = e.currentTarget;
    
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    setValidated(true);
    setLoading(true);
    setError('');
    
    try {
      const endpoint = isSignup ? '/auth/register' : '/auth/login';
      const body = isSignup 
        ? { email, password, userType }
        : { email, password };
        
      const res = await fetch((import.meta.env.VITE_API_URL || '/api') + endpoint, {
        method: 'POST', 
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify(body)
      });
      const data = await res.json();
      console.log('Login/Signup response:', data);
      
      if(data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userType', data.userType || userType);
        console.log('Calling onLoginSuccess with:', email, data.userType || userType);
        onLoginSuccess?.(email, data.userType || userType);
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch(err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>{isSignup ? 'Create Account' : 'Welcome Back'}</h1>
          <p>{isSignup ? 'Sign up to start your journey' : 'Sign in to continue'}</p>
        </div>

        <form onSubmit={submit} className={`login-form needs-validation ${validated ? 'was-validated' : ''}`} noValidate>
          {isSignup && (
            <div className="form-group mb-3">
              <label htmlFor="userType" className="form-label">I am a</label>
              <select
                id="userType"
                className="form-control"
                value={userType}
                onChange={e => setUserType(e.target.value)}
                required
              >
                <option value="jobseeker">Job Seeker</option>
                <option value="recruiter">Recruiter</option>
              </select>
            </div>
          )}

          <div className="form-group mb-3">
            <label htmlFor="email" className="form-label">Email Address</label>
            <input 
              id="email"
              type="email"
              className="form-control"
              placeholder="you@example.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              required
            />
            <div className="invalid-feedback">
              Please provide a valid email address.
            </div>
          </div>

          <div className="form-group mb-3">
            <label htmlFor="password" className="form-label">Password</label>
            <input 
              id="password"
              placeholder="Enter your password" 
              type="password"
              className="form-control"
              value={password} 
              onChange={e => setPassword(e.target.value)}
              required
              minLength="6"
            />
            <div className="invalid-feedback">
              Password must be at least 6 characters long.
            </div>
          </div>

          {error && (
            <div className="alert alert-danger d-flex align-items-center" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              <div>{error}</div>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-lg w-100 btn-login" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Processing...
              </>
            ) : (
              <>
                <i className={`bi ${isSignup ? 'bi-person-plus' : 'bi-box-arrow-in-right'} me-2`}></i>
                {isSignup ? 'Create Account' : 'Sign In'}
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>
            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button 
              type="button"
              className="link-button" 
              onClick={() => {
                setIsSignup(!isSignup);
                setError('');
              }}
            >
              {isSignup ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="decoration decoration-1"></div>
      <div className="decoration decoration-2"></div>
      <div className="decoration decoration-3"></div>
    </div>
  );
}
