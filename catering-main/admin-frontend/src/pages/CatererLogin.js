import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { loginCaterer, registerCaterer , fetchCatererProfile} from '../redux/slices/catererSlice';
import { useNavigate } from 'react-router-dom';
import '../App.css';

const CatererLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({
    email: '',
    password: '',
    businessName: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (tab === 'login') {
        await dispatch(loginCaterer({ email: form.email, password: form.password })).unwrap();
        await dispatch(fetchCatererProfile());
        navigate('/caterer/dashboard');
      } else {
        if (form.password !== form.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        await dispatch(registerCaterer({ email: form.email, password: form.password, businessName: form.businessName })).unwrap();
        localStorage.setItem('firstLogin', '1');
        await dispatch(fetchCatererProfile());
        navigate('/caterer/dashboard');
      }
    } catch (err) {
      setError(err || 'Login/Register failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="caterer-login-bg">
      <div className="caterer-login-card">
        <div className="caterer-login-tabs">
          <button
            className={tab === 'login' ? 'active' : ''}
            onClick={() => setTab('login')}
          >
            Login
          </button>
          <button
            className={tab === 'signup' ? 'active' : ''}
            onClick={() => setTab('signup')}
          >
            Sign Up
          </button>
        </div>
        <form onSubmit={handleSubmit} className="caterer-login-form">
          {tab === 'signup' && (
            <label className="caterer-login-label">
              Business Name
              <input
                type="text"
                name="businessName"
                value={form.businessName}
                onChange={handleChange}
                required
                className="caterer-login-input"
              />
            </label>
          )}
          <label className="caterer-login-label">
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
              className="caterer-login-input"
            />
          </label>
          <label className="caterer-login-label">
            Password
            <input
              type="password"
              id="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              className="caterer-login-input"
              placeholder="Enter your password"
            />
          </label>
          {tab === 'signup' && (
            <label className="caterer-login-label">
              Confirm Password
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                className="caterer-login-input"
                placeholder="Re-enter your password"
              />
            </label>
          )}
          {error && <div className="caterer-login-error">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="caterer-login-btn"
          >
            {loading ? (tab === 'login' ? 'Logging in...' : 'Signing up...') : (tab === 'login' ? 'Login' : 'Sign Up')}
          </button>
          {tab === 'login' && (
            <div className="caterer-login-forgot">
              <a href="/forgot-password">Forgot Password?</a>
            </div>
          )}
        </form>
      </div>
      <style>{`
        .caterer-login-bg {
          min-height: 100vh;
          background: linear-gradient(135deg, #fff0f6 0%, #ffe0ef 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .caterer-login-card {
          background: #fff;
          border-radius: 18px;
          box-shadow: 0 4px 24px rgba(255,92,141,0.10);
          padding: 36px;
          max-width: 370px;
          width: 100%;
          display: flex;
          flex-direction: column;
        }
        .caterer-login-tabs {
          display: flex;
          justify-content: center;
          margin-bottom: 24px;
        }
        .caterer-login-tabs button {
          background: transparent;
          color: #ff5c8d;
          border: none;
          border-radius: 18px 0 0 18px;
          padding: 10px 28px;
          font-weight: 700;
          font-size: 18px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .caterer-login-tabs button.active {
          background: #ff5c8d;
          color: #fff;
        }
        .caterer-login-tabs button:last-child {
          border-radius: 0 18px 18px 0;
        }
        .caterer-login-form {
          display: flex;
          flex-direction: column;
        }
        .caterer-login-label {
          color: #ff5c8d;
          font-weight: 600;
          font-size: 15px;
          display: block;
          margin-bottom: 8px;
        }
        .caterer-login-input {
          width: 100%;
          padding: 10px;
          border-radius: 8px;
          border: 1.5px solid #ffd6e6;
          margin-top: 4px;
          margin-bottom: 16px;
          font-size: 15px;
        }
        .caterer-login-error {
          color: #d32f2f;
          margin-bottom: 12px;
          font-weight: 600;
        }
        .caterer-login-btn {
          width: 100%;
          background: #ff5c8d;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 12px 0;
          font-weight: 700;
          font-size: 17px;
          margin-top: 8px;
          box-shadow: 0 2px 8px rgba(255,92,141,0.10);
          cursor: pointer;
          transition: background 0.18s;
        }
        .caterer-login-forgot {
          text-align: right;
          margin-top: 12px;
        }
        .caterer-login-forgot a {
          color: #ff5c8d;
          text-decoration: underline;
          font-size: 14px;
          cursor: pointer;
        }
        @media (max-width: 500px) {
          .caterer-login-card {
            max-width: 95vw;
            min-width: 0;
            margin: 0 2vw;
            padding: 10px;
            border-radius: 10px;
            box-sizing: border-box;
          }
          .caterer-login-form {
            box-sizing: border-box;
          }
          .caterer-login-input {
            font-size: 13px;
            padding: 10px 8px;
            box-sizing: border-box;
          }
          .caterer-login-btn {
            font-size: 15px;
            padding: 10px 0;
          }
        }
      `}</style>
    </div>
  );
};

export default CatererLogin;
