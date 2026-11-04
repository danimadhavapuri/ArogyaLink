import React from 'react';
import { ShieldCheck, PhoneCall, Building2 } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Clinical Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm font-bold text-xl">
              ఆ
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">ArogyaLink</h1>
                <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-medium border border-teal-200">
                  DPDP 2023 Verified
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <Building2 className="w-3 h-3" /> Coastal AP Diagnostic Network • Vijayawada
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <PhoneCall className="w-3.5 h-3.5 text-teal-600" />
            <span className="hidden sm:inline">Lab Helpline:</span>
            <span className="font-semibold text-slate-800">1800-425-2626</span>
          </div>
        </div>
      </header>

      {/* Main Content Placeholder */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
          <ShieldCheck className="w-12 h-12 text-teal-600 mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">ArogyaLink Patient Report Delivery</h2>
          <p className="text-slate-600 max-w-md mx-auto text-sm leading-relaxed">
            Secure, encrypted medical report delivery system serving coastal Andhra Pradesh patients and referring doctors.
          </p>
        </div>
      </main>

      {/* Accessible Footer for Elderly Patients */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <p>© 2026 ArogyaLink Diagnostic Chain • Vijayawada, Andhra Pradesh</p>
        <p className="text-slate-400 mt-1">Compliant with Digital Personal Data Protection (DPDP) Act 2023</p>
      </footer>
    </div>
  );
}