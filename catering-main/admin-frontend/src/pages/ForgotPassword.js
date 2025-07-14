import React, { useState, useRef } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: email, 2: otp, 3: reset
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const otpInputs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef(null);

  // Timer logic
  const startTimer = () => {
    setTimer(120);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // API helpers
  const apiCall = async (endpoint, data) => {
    try {
      const res = await fetch(`/api/auth${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      return { success: res.ok, data: result };
    } catch {
      return { success: false, data: { message: 'Network error' } };
    }
  };

  // Step 1: Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast.error('Enter a valid email address');
      return;
    }
    setLoading(true);
    const result = await apiCall('/forgot-password/send-otp', { email });
    setLoading(false);
    if (result.success) {
      toast.success(result.data.message);
      setStep(2);
      startTimer();
    } else {
      toast.error(result.data.message);
    }
  };

  // Update OTP input logic
  const handleOtpChange = (e, idx) => {
    const value = e.target.value.replace(/\D/g, '');
    if (!value) {
      const newDigits = [...otpDigits];
      newDigits[idx] = '';
      setOtpDigits(newDigits);
      return;
    }
    const newDigits = [...otpDigits];
    newDigits[idx] = value[0];
    setOtpDigits(newDigits);
    // Move to next input if not last
    if (value && idx < 5) {
      otpInputs[idx + 1].current.focus();
    }
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) {
      otpInputs[idx - 1].current.focus();
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const otp = otpDigits.join('');
    if (!otp || otp.length !== 6) {
      toast.error('Enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    const result = await apiCall('/forgot-password/verify-otp', { email, otp });
    setLoading(false);
    if (result.success) {
      toast.success(result.data.message);
      setStep(3);
    } else {
      toast.error(result.data.message);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    const otp = otpDigits ? otpDigits.join('') : '';
    if (!otp || otp.length !== 6) {
      toast.error('Enter the 6-digit OTP');
      return;
    }
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    setLoading(true);
    const result = await apiCall('/forgot-password/reset-password', { email, otp, newPassword, confirmPassword });
    setLoading(false);
    if (result.success) {
      toast.success(result.data.message);
      setTimeout(() => { window.location.href = '/'; }, 2000);
    } else {
      toast.error(result.data.message);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    setLoading(true);
    const result = await apiCall('/forgot-password/send-otp', { email });
    setLoading(false);
    if (result.success) {
      toast.success('OTP resent successfully');
      startTimer();
    } else {
      toast.error(result.data.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #fff0f6 0%, #ffe0ef 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 18, boxShadow: '0 4px 24px rgba(255,92,141,0.10)', padding: 36, maxWidth: 370, width: '100%' }}>

        <h2 style={{ textAlign: 'center', color: '#ff5c8d', fontWeight: 700, marginBottom: 24 }}>
          Forgot Password
        </h2>
        {step === 1 && (
          <form onSubmit={handleSendOTP}>
            <label style={{ color: '#ff5c8d', fontWeight: 600, fontSize: 15, display: 'block', marginBottom: 8 }}>
              Email
              <input
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1.5px solid #ffd6e6', marginTop: 4, marginBottom: 16, fontSize: 15 }}
                placeholder="Enter your registered email"
              />
            </label>
            <button type="submit" disabled={loading} style={{ width: '100%', background: '#ff5c8d', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 0', fontWeight: 700, fontSize: 17, marginTop: 8, boxShadow: '0 2px 8px rgba(255,92,141,0.10)', cursor: 'pointer', transition: 'background 0.18s' }}>
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <a href="/" style={{ color: '#ff5c8d', textDecoration: 'underline', fontSize: 14 }}>Back to Login</a>
            </div>
          </form>
        )}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP}>
            <label style={{ color: '#ff5c8d', fontWeight: 600, fontSize: 15, display: 'block', marginBottom: 8 }}>
              Enter 6-digit OTP
              <div style={{ display: 'flex', gap: 8, marginTop: 8, marginBottom: 16, justifyContent: 'center' }}>
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={otpInputs[idx]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(e, idx)}
                    onKeyDown={e => handleOtpKeyDown(e, idx)}
                    style={{
                      width: 40,
                      height: 48,
                      fontSize: 24,
                      textAlign: 'center',
                      border: '1.5px solid #ffd6e6',
                      borderRadius: 8,
                      outline: 'none',
                      transition: 'border 0.2s',
                      letterSpacing: 2
                    }}
                  />
                ))}
              </div>
            </label>
            {timer > 0 && <div style={{ textAlign: 'center', color: '#888', marginBottom: 8 }}>OTP expires in: <span style={{ color: '#d32f2f', fontWeight: 600 }}>{formatTime(timer)}</span></div>}
            <button type="submit" disabled={loading || otpDigits.join('').length !== 6} style={{ width: '100%', background: '#ff5c8d', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 0', fontWeight: 700, fontSize: 17, marginTop: 8, boxShadow: '0 2px 8px rgba(255,92,141,0.10)', cursor: 'pointer', transition: 'background 0.18s' }}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <button type="button" onClick={handleResendOTP} disabled={loading || timer > 0} style={{ color: timer > 0 ? '#aaa' : '#ff5c8d', background: 'none', border: 'none', textDecoration: 'underline', fontSize: 14, cursor: timer > 0 ? 'not-allowed' : 'pointer' }}>
                {timer > 0 ? `Resend OTP (${formatTime(timer)})` : 'Resend OTP'}
              </button>
            </div>
          </form>
        )}
        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <label style={{ color: '#ff5c8d', fontWeight: 600, fontSize: 15, display: 'block', marginBottom: 8 }}>
              New Password
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1.5px solid #ffd6e6', marginTop: 4, marginBottom: 16, fontSize: 15 }}
                placeholder="Enter new password"
              />
            </label>
            <label style={{ color: '#ff5c8d', fontWeight: 600, fontSize: 15, display: 'block', marginBottom: 8 }}>
              Confirm Password
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1.5px solid #ffd6e6', marginTop: 4, marginBottom: 16, fontSize: 15 }}
                placeholder="Re-enter new password"
              />
            </label>
            <div style={{ fontSize: 13, color: newPassword.length >= 8 ? '#388e3c' : '#d32f2f', marginBottom: 8 }}>
              Password must be at least 8 characters
            </div>
            <button type="submit" disabled={loading || newPassword.length < 8} style={{ width: '100%', background: '#ff5c8d', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 0', fontWeight: 700, fontSize: 17, marginTop: 8, boxShadow: '0 2px 8px rgba(255,92,141,0.10)', cursor: 'pointer', transition: 'background 0.18s' }}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword; 