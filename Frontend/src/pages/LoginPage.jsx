import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  
  const { login, verifyOtp, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const redirect = location.search ? location.search.split('=')[1] : '/';

  useEffect(() => {
    if (user) {
      navigate(redirect);
    }
  }, [user, navigate, redirect]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);
    
    const res = await login(email, password);
    if (!res.success) {
      if (res.error === 'Please verify your email using OTP first') {
        setShowOtp(true);
        setErrorMsg('');
      } else {
        setErrorMsg(res.error);
      }
    }
    
    setIsSubmitting(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    const res = await verifyOtp(email, otp);
    if (!res.success) {
      setErrorMsg(res.error);
    }
    setIsSubmitting(false);
  };

  if (showOtp) {
    return (
      <main className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-card__header">
              <h2>Verify Email</h2>
              <p>Please enter the 6-digit OTP sent to {email}</p>
            </div>
            
            {errorMsg && <div className="auth-error">{errorMsg}</div>}
            
            <form className="auth-form" onSubmit={handleVerifyOtp}>
              <div className="auth-form__group">
                <label htmlFor="otp">Enter OTP</label>
                <input
                  type="text"
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  required
                  placeholder="------"
                  style={{ textAlign: 'center', letterSpacing: '0.5rem', fontSize: '1.5rem' }}
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-primary btn-block auth-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Verifying...' : 'Verify & Login'}
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-card__header">
            <h2>Welcome Back</h2>
            <p>Sign in to your Mithila Mithas account</p>
          </div>
          
          {errorMsg && <div className="auth-error">{errorMsg}</div>}
          
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-form__group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
              />
            </div>
            
            <div className="auth-form__group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary btn-block auth-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          
          <div className="auth-card__footer">
            <p>
              New customer?{' '}
              <Link to={redirect ? `/register?redirect=${redirect}` : '/register'}>
                Create your account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
