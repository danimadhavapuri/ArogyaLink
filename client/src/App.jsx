import React, { useState, useEffect } from 'react';
import OtpVerificationGate from './components/OtpVerificationGate';
import LabReportViewer from './components/LabReportViewer';
import FrontDeskConsole from './components/FrontDeskConsole';
import DoctorPortal from './components/DoctorPortal';

// Demo Patients available for Reviewer SMS Link Testing (DPDP Act 2023 Compliant)
const TEST_SMS_PATIENTS = [
  {
    id: 'ORD-71204',
    name: 'Lakshmi Prasanna K',
    phone: '+91 98765 43210',
    maskedPhone: '+91 98765 *****',
    test: 'Complete Blood Picture (CBP)',
    doctor: 'Dr. S. Ramanaiah'
  },
  {
    id: 'ORD-71219',
    name: 'Venkata Rao M',
    phone: '+91 98480 12345',
    maskedPhone: '+91 98480 *****',
    test: 'Lipid Profile (LDL Cholesterol)',
    doctor: 'Dr. P. Anitha'
  },
  {
    id: 'ORD-71233',
    name: 'Farzana Begum',
    phone: '+91 97000 67890',
    maskedPhone: '+91 97000 *****',
    test: 'Serum Electrolytes (Potassium)',
    doctor: 'Dr. K. Suresh',
    isUrgent: true
  },
  {
    id: 'ORD-71240',
    name: 'Subba Rao K',
    phone: '+91 94401 22334',
    maskedPhone: '+91 94401 *****',
    test: 'Fasting Blood Sugar (Glucose)',
    doctor: 'Dr. S. Ramanaiah'
  },
  {
    id: 'ORD-71245',
    name: 'Anuradha Devi P',
    phone: '+91 99890 55667',
    maskedPhone: '+91 99890 *****',
    test: 'Thyroid Function Test (TSH)',
    doctor: 'Dr. P. Anitha'
  },
  {
    id: 'ORD-71250',
    name: 'Kiran Kumar B',
    phone: '+91 91234 56789',
    maskedPhone: '+91 91234 *****',
    test: 'Platelet Count (Dengue Care)',
    doctor: 'Dr. K. Suresh'
  }
];

export default function App() {
  // Navigation tabs: 'doctor' | 'frontdesk' | 'patient'
  const [activeTab, setActiveTab] = useState('doctor');

  // Search & Copy Link states for Patient SMS simulator
  const [patientSearch, setPatientSearch] = useState('');
  const [copiedLinkId, setCopiedLinkId] = useState(null);

  // Handle direct patient SMS link opened in browser (e.g. http://localhost:5173/report/:token)
  useEffect(() => {
    const pathname = window.location.pathname;
    if (pathname.includes('/report/')) {
      const token = pathname.split('/report/')[1]?.trim();
      if (token) {
        setActiveTab('patient');
        setIsOtpVerified(false);
        setActiveOrder(null);

        fetch(`http://localhost:5000/api/reports/verify-token/${token}`)
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              setTokenInfo({
                token,
                expiresInHours: 72,
                patientName: data.patientName || 'Valued Patient',
                maskedPhone: data.maskedPhone || '+91 98765 *****',
                orderId: data.orderId
              });
              setSelectedPatientId(data.orderId || 'ORD-71204');
            }
          })
          .catch(err => {
            console.error('Failed to verify URL token:', err);
          });
      }
    }
  }, []);

  // Dedicated Doctor Session
  const [doctorUser, setDoctorUser] = useState(() => {
    try {
      const saved = localStorage.getItem('arogya_doctor_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Dedicated Staff Session
  const [staffUser, setStaffUser] = useState(() => {
    try {
      const saved = localStorage.getItem('arogya_staff_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Patient OTP Portal State (Simulated SMS Link)
  const [activeOrder, setActiveOrder] = useState(null);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [tokenInfo, setTokenInfo] = useState({
    token: 'token_ord_71204_sample',
    expiresInHours: 71,
    patientName: 'Lakshmi Prasanna K',
    maskedPhone: '+91 98765 *****'
  });

  const [selectedPatientId, setSelectedPatientId] = useState('ORD-71204');

  const handleSelectTestPatient = (p) => {
    setSelectedPatientId(p.id);
    setTokenInfo({
      token: `demo_${p.id}`,
      expiresInHours: 71,
      patientName: p.name,
      maskedPhone: p.maskedPhone
    });
    setIsOtpVerified(false);
    setActiveOrder(null);
  };
  const [docEmail, setDocEmail] = useState('');
  const [docPassword, setDocPassword] = useState('');
  const [docIsSignUp, setDocIsSignUp] = useState(false);
  const [docName, setDocName] = useState('');
  const [docSpecialty, setDocSpecialty] = useState('');
  const [docClinic, setDocClinic] = useState('');
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState(null);

  // Staff Sign In / Sign Up Form State
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffIsSignUp, setStaffIsSignUp] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffBranch, setStaffBranch] = useState('');
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState(null);

  // Quick Reviewer Demo Fill for Doctors
  const handleQuickDoctorFill = (email, pass) => {
    setDocEmail(email);
    setDocPassword(pass);
    setDocIsSignUp(false);
    setDocError(null);
  };

  // Quick Reviewer Demo Fill for Staff
  const handleQuickStaffFill = (email, pass) => {
    setStaffEmail(email);
    setStaffPassword(pass);
    setStaffIsSignUp(false);
    setStaffError(null);
  };

  // Doctor Login / Register Submit
  const handleDoctorSubmit = async (e) => {
    e.preventDefault();
    setDocError(null);
    setDocLoading(true);

    try {
      const endpoint = docIsSignUp
        ? 'http://localhost:5000/api/auth/register'
        : 'http://localhost:5000/api/auth/login';

      const payload = docIsSignUp
        ? {
            email: docEmail,
            password: docPassword,
            name: docName.toLowerCase().startsWith('dr.') ? docName : `Dr. ${docName}`,
            doctorName: docName.toLowerCase().startsWith('dr.') ? docName : `Dr. ${docName}`,
            role: 'doctor',
            specialization: docSpecialty || 'General Diagnostic Medicine',
            center: docClinic || 'Company A Lab Network, Vijayawada',
            phone: '+91 98480 11223'
          }
        : { email: docEmail, password: docPassword };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Authentication failed');
      }

      const user = data.user;
      if (user.role !== 'doctor') {
        throw new Error('This account does not have doctor privileges. Please use Staff Console.');
      }

      setDoctorUser(user);
      localStorage.setItem('arogya_doctor_user', JSON.stringify(user));
    } catch (err) {
      setDocError(err.message);
    } finally {
      setDocLoading(false);
    }
  };

  // Staff Login / Register Submit
  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    setStaffError(null);
    setStaffLoading(true);

    try {
      const endpoint = staffIsSignUp
        ? 'http://localhost:5000/api/auth/register'
        : 'http://localhost:5000/api/auth/login';

      const payload = staffIsSignUp
        ? {
            email: staffEmail,
            password: staffPassword,
            name: staffName,
            role: 'staff',
            center: staffBranch || 'Central Diagnostic Hub, Vijayawada',
            phone: '+91 98660 55443'
          }
        : { email: staffEmail, password: staffPassword };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Authentication failed');
      }

      const user = data.user;
      if (user.role !== 'staff') {
        throw new Error('This account does not have staff privileges. Please use Doctor Portal.');
      }

      setStaffUser(user);
      localStorage.setItem('arogya_staff_user', JSON.stringify(user));
    } catch (err) {
      setStaffError(err.message);
    } finally {
      setStaffLoading(false);
    }
  };

  // Doctor Logout: Stays on Doctor Sign In Page
  const handleDoctorLogout = () => {
    localStorage.removeItem('arogya_doctor_user');
    setDoctorUser(null);
    setActiveTab('doctor');
  };

  // Staff Logout: Stays on Staff Sign In Page
  const handleStaffLogout = () => {
    localStorage.removeItem('arogya_staff_user');
    setStaffUser(null);
    setActiveTab('frontdesk');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Top Application Header with Animated Shimmer Spark Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs relative">
        {/* Animated Highlighting Spark Bar across top */}
        <div className="h-[3.5px] w-full bg-gradient-to-r from-emerald-500 via-teal-200 via-emerald-400 to-teal-500 animate-spark-bar shadow-[0_0_15px_rgba(16,185,129,0.75)]"></div>

        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          
          {/* Brand Logo & Network Info with Glowing Spark Accent */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white font-bold text-lg shadow-[0_0_15px_rgba(16,185,129,0.45)] ring-2 ring-emerald-400/50 transform hover:scale-105 transition-all">
              ఆ
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-800 tracking-tight">ArogyaLink</h1>
                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.35)] flex items-center gap-1.5 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>✨ DPDP 2023 Verified</span>
                </span>
              </div>
              <p className="text-xs text-slate-500">Coastal AP Diagnostic Network • Vijayawada (6 Labs & 38 Centres)</p>
            </div>
          </div>

          {/* Navigation Controls: Exactly 2 Main Portals + Patient SMS Simulator */}
          <div className="flex items-center gap-2">
            
            {/* Tab 1: Doctor Portal */}
            <button
              onClick={() => setActiveTab('doctor')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'doctor'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              🩺 Referring Doctor
              {doctorUser && (
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
              )}
            </button>

            {/* Tab 2: Front-Desk Staff Console */}
            <button
              onClick={() => setActiveTab('frontdesk')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'frontdesk'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              🏢 Front-Desk Console
              {staffUser && (
                <span className="w-2 h-2 rounded-full bg-teal-300 animate-pulse"></span>
              )}
            </button>

            {/* Reviewer / Patient Link Simulator */}
            <button
              onClick={() => setActiveTab('patient')}
              className={`ml-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer border ${
                activeTab === 'patient'
                  ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs font-bold'
                  : 'bg-white text-slate-600 hover:text-amber-800 hover:bg-amber-50 border-slate-200'
              }`}
              title="Simulates patient clicking the 72-hour link received via SMS/WhatsApp"
            >
              📱 Test Patient SMS Link
            </button>

            {/* Quick Session Indicator & Sign Out */}
            {(doctorUser || staffUser) && (
              <div className="ml-2 flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-xl text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="font-semibold text-slate-700 hidden sm:inline">
                  {doctorUser ? doctorUser.name : `${staffUser.name} (Staff)`}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (doctorUser) handleDoctorLogout();
                    if (staffUser) handleStaffLogout();
                  }}
                  className="text-rose-600 hover:text-rose-800 hover:underline font-bold text-[11px] ml-1 cursor-pointer"
                  title="Sign Out to Common Login Page"
                >
                  Sign Out
                </button>
              </div>
            )}

          </div>

        </div>
      </header>

      {/* Main Body Canvas */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6">
        
        {/* ============================================================ */}
        {/* VIEW 1: REFERRING DOCTOR PORTAL */}
        {/* ============================================================ */}
        {activeTab === 'doctor' && (
          <div>
            {!doctorUser && !staffUser ? (
              /* Dedicated Doctor Sign In & Sign Up Page */
              <div className="max-w-md mx-auto my-8 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-fadeIn">
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white text-center">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl mx-auto flex items-center justify-center text-2xl mb-2 backdrop-blur-xs">
                    🩺
                  </div>
                  <h2 className="text-xl font-bold tracking-tight">Referring Clinician Portal</h2>
                  <p className="text-xs text-emerald-100 mt-1">
                    Secure 90-day diagnostic access for your referred patients
                  </p>
                </div>

                {/* 1-Click Reviewer Demo Fill for Doctors */}
                <div className="bg-emerald-50/70 border-b border-emerald-100 p-4">
                  <p className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>⚡ Reviewer 1-Click Credentials:</span>
                    <span className="text-[10px] text-emerald-700 font-normal">Auto-fills credentials</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleQuickDoctorFill('ramanaiah@arogyalink.in', 'doctor123')}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-100 transition-all shadow-2xs cursor-pointer"
                    >
                      Dr. S. Ramanaiah
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDoctorFill('anitha@arogyalink.in', 'doctor123')}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-100 transition-all shadow-2xs cursor-pointer"
                    >
                      Dr. P. Anitha
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDoctorFill('suresh@arogyalink.in', 'doctor123')}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-100 transition-all shadow-2xs cursor-pointer"
                    >
                      Dr. K. Suresh
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-center mb-5 pb-2 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-800">
                      {docIsSignUp ? 'Register New Clinician Profile' : 'Doctor Sign In'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => { setDocIsSignUp(!docIsSignUp); setDocError(null); }}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 underline cursor-pointer"
                    >
                      {docIsSignUp ? 'Already registered? Sign In' : 'Need an account? Sign Up'}
                    </button>
                  </div>

                  {docError && (
                    <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                      <span>⚠️</span>
                      <span>{docError}</span>
                    </div>
                  )}

                  <form onSubmit={handleDoctorSubmit} className="space-y-3.5">
                    {docIsSignUp && (
                      <>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Doctor Full Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={docName}
                            onChange={(e) => setDocName(e.target.value)}
                            placeholder="e.g. Dr. K. Venkat"
                            className="w-full px-3.5 py-2.5 text-xs bg-slate-50/50 border border-slate-200 rounded-xl hover:border-emerald-400 hover:bg-white focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 focus:shadow-[0_0_12px_rgba(16,185,129,0.25)] outline-none transition-all duration-200"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Clinical Specialization
                          </label>
                          <input
                            type="text"
                            value={docSpecialty}
                            onChange={(e) => setDocSpecialty(e.target.value)}
                            placeholder="e.g. Diabetologist, Cardiologist"
                            className="w-full px-3.5 py-2.5 text-xs bg-slate-50/50 border border-slate-200 rounded-xl hover:border-emerald-400 hover:bg-white focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 focus:shadow-[0_0_12px_rgba(16,185,129,0.25)] outline-none transition-all duration-200"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Hospital / Clinic Location
                          </label>
                          <input
                            type="text"
                            value={docClinic}
                            onChange={(e) => setDocClinic(e.target.value)}
                            placeholder="e.g. Coastal Heart Care, Governorpet"
                            className="w-full px-3.5 py-2.5 text-xs bg-slate-50/50 border border-slate-200 rounded-xl hover:border-emerald-400 hover:bg-white focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 focus:shadow-[0_0_12px_rgba(16,185,129,0.25)] outline-none transition-all duration-200"
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Doctor Official Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={docEmail}
                        onChange={(e) => setDocEmail(e.target.value)}
                        placeholder="doctor@arogyalink.in"
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50/50 border border-slate-200 rounded-xl hover:border-emerald-400 hover:bg-white focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 focus:shadow-[0_0_12px_rgba(16,185,129,0.25)] outline-none transition-all duration-200"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Password *
                      </label>
                      <input
                        type="password"
                        required
                        value={docPassword}
                        onChange={(e) => setDocPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50/50 border border-slate-200 rounded-xl hover:border-emerald-400 hover:bg-white focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 focus:shadow-[0_0_12px_rgba(16,185,129,0.25)] outline-none transition-all duration-200"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={docLoading}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer mt-4"
                    >
                      {docLoading ? 'Verifying Credentials...' : (docIsSignUp ? 'Register Doctor Account' : 'Sign In as Doctor')}
                    </button>
                  </form>
                  <p className="text-[10px] text-slate-400 text-center mt-3">
                    🔒 Medical Privacy Guaranteed: Doctors see only their own patients.
                  </p>
                </div>
              </div>
            ) : (
              /* Authenticated Doctor Dashboard (Isolated Doctor View or Staff Supervisory Access) */
              <DoctorPortal
                currentUser={doctorUser || staffUser}
                onLogout={doctorUser ? handleDoctorLogout : handleStaffLogout}
              />
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 2: FRONT-DESK STAFF CONSOLE */}
        {/* ============================================================ */}
        {activeTab === 'frontdesk' && (
          <div>
            {!staffUser ? (
              /* Dedicated Staff Sign In & Sign Up Page */
              <div className="max-w-md mx-auto my-8 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-fadeIn">
                <div className="bg-gradient-to-r from-teal-700 to-slate-800 p-6 text-white text-center">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl mx-auto flex items-center justify-center text-2xl mb-2 backdrop-blur-xs">
                    🏢
                  </div>
                  <h2 className="text-xl font-bold tracking-tight">Staff Operations Console</h2>
                  <p className="text-xs text-teal-100 mt-1">
                    Central dispatch, multi-doctor supervision, emergency callbacks & DPDP logs
                  </p>
                </div>

                {doctorUser && (
                  <div className="bg-amber-50 border-b border-amber-200 p-2.5 text-center text-[11px] text-amber-900 font-medium">
                    ℹ️ You are signed in as clinician <strong>{doctorUser.name}</strong>. Staff authorization is required to access operations.
                  </div>
                )}

                {/* 1-Click Reviewer Demo Fill for Staff */}
                <div className="bg-teal-50/70 border-b border-teal-100 p-4">
                  <p className="text-[11px] font-bold text-teal-900 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>⚡ Reviewer 1-Click Credentials:</span>
                    <span className="text-[10px] text-teal-700 font-normal">Auto-fills credentials</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => handleQuickStaffFill('staff@arogyalink.in', 'staff123')}
                    className="w-full py-1.5 text-xs font-semibold rounded-lg bg-white border border-teal-200 text-teal-800 hover:bg-teal-100 transition-all shadow-2xs cursor-pointer text-center"
                  >
                    Front-Desk Operations Supervisor (Central Lab)
                  </button>
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-center mb-5 pb-2 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-800">
                      {staffIsSignUp ? 'Register Staff Member' : 'Staff Sign In'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => { setStaffIsSignUp(!staffIsSignUp); setStaffError(null); }}
                      className="text-xs font-semibold text-teal-600 hover:text-teal-800 underline cursor-pointer"
                    >
                      {staffIsSignUp ? 'Already registered? Sign In' : 'Need an account? Sign Up'}
                    </button>
                  </div>

                  {staffError && (
                    <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                      <span>⚠️</span>
                      <span>{staffError}</span>
                    </div>
                  )}

                  <form onSubmit={handleStaffSubmit} className="space-y-3.5">
                    {staffIsSignUp && (
                      <>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Staff Full Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={staffName}
                            onChange={(e) => setStaffName(e.target.value)}
                            placeholder="e.g. Ramesh Kumar"
                            className="w-full px-3.5 py-2.5 text-xs bg-slate-50/50 border border-slate-200 rounded-xl hover:border-teal-400 hover:bg-white focus:bg-white focus:border-teal-600 focus:ring-4 focus:ring-teal-600/20 focus:shadow-[0_0_12px_rgba(13,148,136,0.25)] outline-none transition-all duration-200"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Lab Branch / Collection Centre
                          </label>
                          <input
                            type="text"
                            value={staffBranch}
                            onChange={(e) => setStaffBranch(e.target.value)}
                            placeholder="e.g. Governorpet Centre, Vijayawada"
                            className="w-full px-3.5 py-2.5 text-xs bg-slate-50/50 border border-slate-200 rounded-xl hover:border-teal-400 hover:bg-white focus:bg-white focus:border-teal-600 focus:ring-4 focus:ring-teal-600/20 focus:shadow-[0_0_12px_rgba(13,148,136,0.25)] outline-none transition-all duration-200"
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Staff Official Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={staffEmail}
                        onChange={(e) => setStaffEmail(e.target.value)}
                        placeholder="staff@arogyalink.in"
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50/50 border border-slate-200 rounded-xl hover:border-teal-400 hover:bg-white focus:bg-white focus:border-teal-600 focus:ring-4 focus:ring-teal-600/20 focus:shadow-[0_0_12px_rgba(13,148,136,0.25)] outline-none transition-all duration-200"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Password *
                      </label>
                      <input
                        type="password"
                        required
                        value={staffPassword}
                        onChange={(e) => setStaffPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50/50 border border-slate-200 rounded-xl hover:border-teal-400 hover:bg-white focus:bg-white focus:border-teal-600 focus:ring-4 focus:ring-teal-600/20 focus:shadow-[0_0_12px_rgba(13,148,136,0.25)] outline-none transition-all duration-200"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={staffLoading}
                      className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer mt-4"
                    >
                      {staffLoading ? 'Verifying Staff Access...' : (staffIsSignUp ? 'Register Staff Account' : 'Sign In as Staff')}
                    </button>
                  </form>
                  <p className="text-[10px] text-slate-400 text-center mt-3">
                    🔒 Supervise all doctor rosters, daily orders, and urgent callbacks.
                  </p>
                </div>
              </div>
            ) : (
              /* Authenticated Staff Console (All Doctors & Front-Desk Operations) */
              <FrontDeskConsole
                currentUser={staffUser}
                onLogout={handleStaffLogout}
              />
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 3: CLIENT / PATIENT SECURE SMS LINK EXPERIENCE */}
        {/* ============================================================ */}
        {activeTab === 'patient' && (
          <div className="space-y-4">
            {/* Clean Info Strip (No redundant return button) */}
            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl px-4 py-2.5 text-xs text-amber-900 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <span>📱</span>
                <span><strong>Patient SMS Link Simulator:</strong> Testing safe 72-hour expiring links and mobile OTP verification under India&rsquo;s DPDP Act 2023.</span>
              </div>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-200/80 px-2.5 py-0.5 rounded-full">
                72h Expiring Token Gate
              </span>
            </div>

            {/* Reviewer Patient Selector & Search (Clean, compact, no huge boxes) */}
            <div className="bg-white border border-amber-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>🔍</span>
                    <span>Test Patient Expiring Link & OTP Gate:</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Select a patient scenario or search by name to test their 4-digit OTP access and multilingual AI summary
                  </p>
                </div>
                {copiedLinkId && (
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-lg border border-emerald-300 animate-fadeIn">
                    ✓ Link copied to clipboard!
                  </span>
                )}
              </div>

              {/* Real-time search box */}
              <div className="relative">
                <input
                  type="text"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  placeholder="Search patient by name, order ID (e.g. ORD-71204), phone number..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-8 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                />
                {patientSearch && (
                  <button
                    onClick={() => setPatientSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Scenario Quick Selector Pills (Compact horizontal chips) */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-500 mr-1">Select Patient Scenario:</span>
                {TEST_SMS_PATIENTS.filter(p => 
                  !patientSearch.trim() ||
                  p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
                  p.id.toLowerCase().includes(patientSearch.toLowerCase()) ||
                  p.phone.includes(patientSearch) ||
                  p.test.toLowerCase().includes(patientSearch.toLowerCase())
                ).map((p) => {
                  const isSelected = selectedPatientId === p.id;
                  const isCritical = p.isUrgent || p.test.includes('Panic') || p.test.includes('Potassium');
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectTestPatient(p)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-500/20 font-bold'
                          : 'bg-slate-100 hover:bg-amber-50 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <span>{p.name.split(' ')[0]}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isCritical 
                          ? 'bg-rose-100 text-rose-800' 
                          : isSelected 
                          ? 'bg-amber-800 text-amber-100' 
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {p.id}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Selected Patient Test Link Card (Single clean card) */}
              {(() => {
                const activePatient = TEST_SMS_PATIENTS.find(p => p.id === selectedPatientId) || TEST_SMS_PATIENTS[0];
                const isCritical = activePatient.isUrgent || activePatient.test.includes('Panic') || activePatient.test.includes('Potassium');
                return (
                  <div className="mt-2 p-3.5 bg-gradient-to-r from-amber-50/90 to-orange-50/60 rounded-xl border border-amber-300 shadow-2xs space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-800 text-xs bg-white px-2 py-0.5 rounded-lg border border-amber-200">
                          {activePatient.id}
                        </span>
                        <strong className="text-sm text-slate-900">{activePatient.name}</strong>
                        <span className="text-xs text-slate-500 hidden sm:inline">• {activePatient.maskedPhone} • Ref: {activePatient.doctor}</span>
                      </div>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                        isCritical ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {isCritical ? '🚨 Critical Callback Scenario' : '✓ Normal Sign-off'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-2.5 rounded-lg border border-amber-200/80 font-mono text-[11px] text-slate-700">
                      <div className="truncate flex-1">
                        📲 SMS: &ldquo;Dear {activePatient.name.split(' ')[0]}, your lab report is ready. Access: http://localhost:5173/report/demo_{activePatient.id} (72h)&rdquo;
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const url = `http://localhost:5173/report/demo_${activePatient.id}`;
                          navigator.clipboard.writeText(url);
                          setCopiedLinkId(activePatient.id);
                          setTimeout(() => setCopiedLinkId(null), 3000);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        {copiedLinkId === activePatient.id ? '✓ Copied' : '🔗 Copy Link'}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>

            {!isOtpVerified ? (
              <OtpVerificationGate
                tokenData={tokenInfo}
                onVerified={(order) => {
                  setActiveOrder(order);
                  setIsOtpVerified(true);
                }}
              />
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                  <p className="text-xs text-emerald-800 font-medium">
                    ✓ Verified Mobile OTP Session for <strong>{activeOrder?.patientName}</strong>
                  </p>
                  <button
                    onClick={() => setIsOtpVerified(false)}
                    className="text-xs text-emerald-700 underline font-semibold hover:text-emerald-900 cursor-pointer"
                  >
                    Lock Session
                  </button>
                </div>
                {activeOrder && <LabReportViewer order={activeOrder} />}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        © 2026 ArogyaLink Diagnostic Chain • Vijayawada, Andhra Pradesh • DPDP Act 2023 Compliant
      </footer>

    </div>
  );
}
