import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  PhoneCall, 
  Building2, 
  UserCheck, 
  RefreshCw, 
  Smartphone, 
  Laptop,
  Stethoscope
} from 'lucide-react';
import OtpVerificationGate from './components/OtpVerificationGate';
import LabReportViewer from './components/LabReportViewer';
import AiSummaryCard from './components/AiSummaryCard';
import FrontDeskConsole from './components/FrontDeskConsole';
import DoctorPortal from './components/DoctorPortal';

export default function App() {
  // 3 Roles: 'PATIENT' | 'STAFF' | 'DOCTOR'
  const [activeRole, setActiveRole] = useState('STAFF');
  const [selectedOrderId, setSelectedOrderId] = useState('ORD-71204');
  const [tokenData, setTokenData] = useState(null);
  const [verifiedOrder, setVerifiedOrder] = useState(null);
  const [loadingToken, setLoadingToken] = useState(false);

  // Fetch token for patient view
  const fetchTokenForOrder = async (orderId) => {
    setLoadingToken(true);
    setVerifiedOrder(null);
    try {
      const res = await fetch('/api/reports/generate-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });
      const data = await res.json();
      if (data.success) {
        setTokenData(data);
      }
    } catch (err) {
      console.error('Error generating token:', err);
    } finally {
      setLoadingToken(false);
    }
  };

  useEffect(() => {
    fetchTokenForOrder(selectedOrderId);
  }, [selectedOrderId]);

  const handleSelectFromDeskOrDoctor = (orderId) => {
    setSelectedOrderId(orderId);
    setActiveRole('PATIENT');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Clinical Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
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

          {/* 3-Role Switcher Bar (Patient vs Staff vs Doctor) */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveRole('PATIENT')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeRole === 'PATIENT'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Patient Portal</span>
            </button>

            <button
              onClick={() => setActiveRole('STAFF')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeRole === 'STAFF'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>Front-Desk Console</span>
            </button>

            <button
              onClick={() => setActiveRole('DOCTOR')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeRole === 'DOCTOR'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Referring Doctor (90d)</span>
            </button>
          </div>
        </div>
      </header>

      {/* If Patient View: Show Reviewer Switcher */}
      {activeRole === 'PATIENT' && (
        <div className="bg-slate-100 border-b border-slate-200 py-2.5 px-4">
          <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-slate-600 font-semibold flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-teal-600" />
              Reviewer Demo Switcher:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSelectedOrderId('ORD-71204')}
                className={`px-3 py-1 rounded-lg border font-medium cursor-pointer transition-colors ${
                  selectedOrderId === 'ORD-71204'
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Lakshmi Prasanna (Hb: 10.2)
              </button>
              <button
                onClick={() => setSelectedOrderId('ORD-71233')}
                className={`px-3 py-1 rounded-lg border font-medium cursor-pointer transition-colors ${
                  selectedOrderId === 'ORD-71233'
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
                }`}
              >
                Farzana Begum (K+: 6.8 Critical)
              </button>
              <button
                onClick={() => setSelectedOrderId('ORD-71219')}
                className={`px-3 py-1 rounded-lg border font-medium cursor-pointer transition-colors ${
                  selectedOrderId === 'ORD-71219'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
                }`}
              >
                Venkata Rao (LDL: 142)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6">
        {activeRole === 'STAFF' ? (
          <FrontDeskConsole onSelectOrderForPatientView={handleSelectFromDeskOrDoctor} />
        ) : activeRole === 'DOCTOR' ? (
          <DoctorPortal onSelectPatientReport={handleSelectFromDeskOrDoctor} />
        ) : !verifiedOrder ? (
          loadingToken || !tokenData ? (
            <div className="text-center py-16 text-slate-500 flex flex-col items-center gap-2">
              <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
              <span>Loading secure 72-hour link...</span>
            </div>
          ) : (
            <OtpVerificationGate
              tokenData={tokenData}
              onVerified={(order) => setVerifiedOrder(order)}
            />
          )
        ) : (
          <LabReportViewer
            order={verifiedOrder}
            onBack={() => setVerifiedOrder(null)}
          >
            <AiSummaryCard order={verifiedOrder} />
          </LabReportViewer>
        )}
      </main>

      {/* Accessible Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <p>© 2026 ArogyaLink Diagnostic Chain • Vijayawada, Andhra Pradesh</p>
        <p className="text-slate-400 mt-1">Compliant with Digital Personal Data Protection (DPDP) Act 2023</p>
      </footer>
    </div>
  );
}