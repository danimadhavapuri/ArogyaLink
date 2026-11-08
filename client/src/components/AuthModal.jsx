import React, { useState } from 'react';

export default function AuthModal({ isOpen, onClose, initialRole = 'doctor', onLoginSuccess }) {
  const [role, setRole] = useState(initialRole); // 'doctor' or 'staff'
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [center, setCenter] = useState('');
  const [phone, setPhone] = useState('');
  
  // Feedback states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!isOpen) return null;

  // Reviewer 1-Click Quick Demo Accounts
  const demoAccounts = {
    doctor1: {
      label: 'Dr. S. Ramanaiah (Diabetologist)',
      email: 'ramanaiah@arogyalink.in',
      password: 'doctor123',
      role: 'doctor'
    },
    doctor2: {
      label: 'Dr. P. Anitha (Physician)',
      email: 'anitha@arogyalink.in',
      password: 'doctor123',
      role: 'doctor'
    },
    doctor3: {
      label: 'Dr. K. Suresh (Cardiologist)',
      email: 'suresh@arogyalink.in',
      password: 'doctor123',
      role: 'doctor'
    },
    staff: {
      label: 'Staff Supervisor (Central Lab)',
      email: 'staff@arogyalink.in',
      password: 'staff123',
      role: 'staff'
    }
  };

  const handleQuickFill = (accKey) => {
    const acc = demoAccounts[accKey];
    setRole(acc.role);
    setIsSignUp(false);
    setEmail(acc.email);
    setPassword(acc.password);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const endpoint = isSignUp 
        ? '/api/auth/register' 
        : '/api/auth/login';

      const payload = isSignUp
        ? {
            email,
            password,
            name: role === 'doctor' && !name.toLowerCase().startsWith('dr.') ? `Dr. ${name}` : name,
            role,
            doctorName: role === 'doctor' ? (name.toLowerCase().startsWith('dr.') ? name : `Dr. ${name}`) : undefined,
            specialization: specialization || (role === 'doctor' ? 'General Physician' : undefined),
            center: center || 'Company A Lab Network, Vijayawada',
            phone: phone || '+91 98480 00000'
          }
        : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please verify your credentials.');
      }

      setSuccessMsg(data.message || 'Logged in successfully!');
      
      // Save session in local storage for persistence
      localStorage.setItem('arogya_user', JSON.stringify(data.user));
      
      setTimeout(() => {
        onLoginSuccess(data.user);
        onClose();
      }, 500);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
        
        {/* Header with Role Selection Tabs */}
        <div className="bg-slate-50 border-b border-slate-100 p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              ArogyaLink Portal Sign-In
            </h3>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Doctor vs Staff Role Switcher */}
          <div className="grid grid-cols-2 gap-2 bg-slate-200/70 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => { setRole('doctor'); setError(null); }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                role === 'doctor'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🩺 Doctor Portal
            </button>
            <button
              type="button"
              onClick={() => { setRole('staff'); setError(null); }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                role === 'staff'
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🏢 Staff Console
            </button>
          </div>
        </div>

        {/* 1-Click Reviewer Quick Fill Chips */}
        <div className="bg-emerald-50/50 border-b border-emerald-100/60 px-5 py-3">
          <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>⚡ Reviewer Demo Quick-Fill:</span>
            <span className="text-[10px] text-emerald-600 font-normal">1-Click credentials</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {role === 'doctor' ? (
              <>
                <button
                  type="button"
                  onClick={() => handleQuickFill('doctor1')}
                  className="px-2.5 py-1 text-xs font-medium rounded-md bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-100 transition-all shadow-2xs"
                >
                  Dr. Ramanaiah
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('doctor2')}
                  className="px-2.5 py-1 text-xs font-medium rounded-md bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-100 transition-all shadow-2xs"
                >
                  Dr. Anitha
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('doctor3')}
                  className="px-2.5 py-1 text-xs font-medium rounded-md bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-100 transition-all shadow-2xs"
                >
                  Dr. Suresh
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => handleQuickFill('staff')}
                className="px-3 py-1 text-xs font-medium rounded-md bg-white border border-teal-200 text-teal-800 hover:bg-teal-100 transition-all shadow-2xs"
              >
                Front-Desk Supervisor (Central Lab)
              </button>
            )}
          </div>
        </div>

        {/* Body & Form */}
        <div className="p-6">
          {/* Mode Switcher: Sign In vs Sign Up */}
          <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-2">
            <h4 className="text-sm font-bold text-slate-800">
              {isSignUp ? `Create New ${role === 'doctor' ? 'Doctor' : 'Staff'} Account` : `Sign In to ${role === 'doctor' ? 'Doctor' : 'Staff'} Portal`}
            </h4>
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 underline"
            >
              {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
            </button>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2 animate-shake">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2">
              <span>✓</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Login / Register Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isSignUp && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {role === 'doctor' ? 'Doctor Full Name' : 'Staff Officer Name'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={role === 'doctor' ? 'e.g. Dr. K. Venkat' : 'e.g. Ramesh Kumar'}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>

                {role === 'doctor' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Clinical Specialization
                    </label>
                    <input
                      type="text"
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      placeholder="e.g. General Physician, Diabetologist"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Lab Branch / Hospital Centre
                  </label>
                  <input
                    type="text"
                    value={center}
                    onChange={(e) => setCenter(e.target.value)}
                    placeholder="e.g. Governorpet Centre, Vijayawada"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Official Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={role === 'doctor' ? 'doctor@arogyalink.in' : 'staff@arogyalink.in'}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 px-4 rounded-xl font-semibold text-sm text-white transition-all shadow-md mt-4 flex items-center justify-center gap-2 ${
                role === 'doctor'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/20'
              } ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <span>{isSignUp ? 'Create Account' : `Sign In as ${role === 'doctor' ? 'Doctor' : 'Staff'}`}</span>
              )}
            </button>
          </form>

          <p className="text-[11px] text-slate-400 text-center mt-4">
            🔒 DPDP Act 2023 Compliant • Role-based encrypted access control
          </p>
        </div>
      </div>
    </div>
  );
}