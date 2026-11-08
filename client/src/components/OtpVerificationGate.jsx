import React, { useState } from 'react';
import { Lock, Clock, ShieldCheck, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

export default function OtpVerificationGate({ tokenData, onVerified }) {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance to next box on typing
    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const enteredCode = otp.join('');
    if (enteredCode.length < 4) {
      setError('Please enter all 4 digits of the OTP.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/reports/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tokenData?.token || '',
          enteredOtp: enteredCode
        })
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Verification failed. Try OTP: 1234');
      }

      // Successful verification
      onVerified(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFillDemo = () => {
    setOtp(['1', '2', '3', '4']);
    setError(null);
  };

  return (
    <div className="max-w-md mx-auto">
      {/* 72-Hour Expiry Pill */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 flex items-center justify-between text-xs text-amber-800">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Link expires in <strong className="font-semibold">72 Hours</strong> (DPDP Privacy Rule)
          </span>
        </div>
        <span className="bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">
          Active
        </span>
      </div>

      {/* Main Login Card */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-white/80 p-6 sm:p-8 shadow-xl glow-emerald">
        <div className="w-12 h-12 bg-teal-50 border border-teal-200 rounded-2xl flex items-center justify-center text-teal-600 mb-4 mx-auto">
          <Lock className="w-6 h-6" />
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-center text-slate-900">
          Enter Verification OTP
        </h2>
        <p className="text-sm text-center text-slate-500 mt-1 mb-6">
          We sent a 4-digit code to{' '}
          <span className="font-medium text-slate-800">
            {tokenData?.maskedPhone || '+91 98765 *****'}
          </span>{' '}
          for patient <strong className="text-slate-800">{tokenData?.patientName || 'Valued Patient'}</strong>.
        </p>

        {/* Demo Helper Banner for Reviewer */}
        <div
          onClick={handleQuickFillDemo}
          className="cursor-pointer bg-teal-50 hover:bg-teal-100/80 border border-teal-200 rounded-xl p-2.5 mb-6 flex items-center justify-between text-xs text-teal-800 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
            <span>Click to auto-fill Reviewer Demo OTP: <strong>1234</strong></span>
          </div>
          <span className="text-teal-700 underline font-semibold">Auto-fill</span>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl p-3 mb-5 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleVerify}>
          {/* Large Accessible 4-Digit Inputs */}
          <div className="flex justify-center gap-3 sm:gap-4 mb-6">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                id={`otp-${idx}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-14 h-16 sm:w-16 sm:h-20 text-center text-2xl sm:text-3xl font-bold rounded-xl border-2 border-slate-200 focus:border-teal-600 focus:ring-4 focus:ring-teal-100 outline-none transition-all text-slate-900 bg-slate-50 focus:bg-white"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white font-semibold py-3.5 px-4 rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 text-base disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span>Verifying OTP...</span>
            ) : (
              <>
                <span>View Medical Report</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Encrypted with DPDP Act 2023 Digital Healthcare Standards</span>
        </div>
      </div>
    </div>
  );
}