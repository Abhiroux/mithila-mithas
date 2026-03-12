import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  
  const { register, verifyOtp, user } = useAuth();
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
    
    if (password !== confirmPassword) {
      return setErrorMsg('Passwords do not match');
    }
    
    setIsSubmitting(true);
    
    const res = await register(name, email, password, phone);
    if (!res.success) {
      setErrorMsg(res.error);
    } else {
      setShowOtp(true);
      setErrorMsg('');
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
              <p>We've sent a 6-digit OTP to {email}</p>
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
                {isSubmitting ? 'Verifying...' : 'Verify & Create Account'}
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
            <h2>Create Account</h2>
            <p>Join Mithila Mithas family today</p>
          </div>
          
          {errorMsg && <div className="auth-error">{errorMsg}</div>}
          
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-form__group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Enter your full name"
              />
            </div>

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
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number (optional)"
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
                placeholder="Create a password"
              />
            </div>

            <div className="auth-form__group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm your password"
              />
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary btn-block auth-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
          
          <div className="auth-card__footer">
            <p>
              Already have an account?{' '}
              <Link to={redirect ? `/login?redirect=${redirect}` : '/login'}>
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
