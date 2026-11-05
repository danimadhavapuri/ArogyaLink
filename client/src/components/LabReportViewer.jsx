import React from 'react';
import { 
  FileText, 
  Printer, 
  AlertTriangle, 
  CheckCircle2, 
  Building2, 
  PhoneCall, 
  ShieldAlert, 
  User, 
  Calendar, 
  Stethoscope,
  ArrowLeft
} from 'lucide-react';

export default function LabReportViewer({ order, onBack, children }) {
  const isCritical = order.isCritical || (order.parameter === 'Potassium' && parseFloat(order.result) >= 6.0);
  
  // Determine parameter badge status
  const numResult = parseFloat(order.result);
  const [minStr, maxStr] = order.referenceRange.split('-').map(s => s.trim());
  const min = parseFloat(minStr);
  const max = parseFloat(maxStr);
  
  let statusBadge = {
    color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: CheckCircle2,
    text: 'Within Normal Range'
  };

  if (isCritical) {
    statusBadge = {
      color: 'bg-rose-100 text-rose-900 border-rose-300 font-bold',
      icon: ShieldAlert,
      text: 'CRITICAL PANIC VALUE'
    };
  } else if (!isNaN(min) && numResult < min) {
    statusBadge = {
      color: 'bg-amber-50 text-amber-800 border-amber-300 font-medium',
      icon: AlertTriangle,
      text: 'Below Reference Range'
    };
  } else if (!isNaN(max) && numResult > max) {
    statusBadge = {
      color: 'bg-amber-50 text-amber-800 border-amber-300 font-medium',
      icon: AlertTriangle,
      text: 'Above Reference Range'
    };
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Top Action Bar (Hidden when printing) */}
      <div className="flex items-center justify-between no-print">
        <button
          onClick={onBack}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit to Login</span>
        </button>

        <button
          onClick={handlePrint}
          className="text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5 px-4 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save as PDF</span>
        </button>
      </div>

      {/* 🚨 CRITICAL EMERGENCY BANNER (Only shown for Farzana Begum Potassium 6.8) */}
      {isCritical && (
        <div className="bg-rose-50 border-2 border-rose-400 rounded-2xl p-5 sm:p-6 shadow-sm no-print">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="bg-rose-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                  Panic Alert
                </span>
                <span className="text-xs text-rose-800 font-medium">Immediate Clinical Attention Required</span>
              </div>
              <h3 className="text-lg font-bold text-rose-950 mt-1">
                Critical Value Detected: {order.parameter} ({order.result} {order.unit})
              </h3>
              <p className="text-xs sm:text-sm text-rose-900 mt-1.5 leading-relaxed">
                Per clinical laboratory safety guidelines, automated AI summaries are <strong>withheld</strong> for panic values. Our Chief Pathologist has initiated an urgent callback protocol with your referring doctor, <strong>{order.referringDoctor}</strong>.
              </p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                <a
                  href="tel:18004252626"
                  className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 transition-colors"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Call Hospital Emergency Desk</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official Diagnostic Report Paper Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:border-none print:shadow-none">
        {/* Lab Header */}
        <div className="border-b border-slate-200 p-5 sm:p-6 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-lg">
                ఆ
              </div>
              <h2 className="text-xl font-bold text-slate-900">ArogyaLink Diagnostic Laboratories</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-teal-600" />
              {order.collectionCentre} • NABL Accredited Pathology Chain
            </p>
          </div>

          <div className="text-right text-xs">
            <span className="text-slate-400 block font-mono">Order Reference</span>
            <span className="font-bold text-slate-800 font-mono text-sm">{order.orderId}</span>
            <span className="inline-block mt-1 bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
              Verified & Signed
            </span>
          </div>
        </div>

        {/* Patient Demographics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 sm:p-6 bg-slate-50/30 border-b border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">Patient Name</span>
            <span className="font-bold text-slate-900 text-sm flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              {order.patientName}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Age / Gender</span>
            <span className="font-semibold text-slate-800 text-sm">
              {order.age} yrs • {order.gender}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Sample Collection</span>
            <span className="font-semibold text-slate-800 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Referring Physician</span>
            <span className="font-semibold text-slate-800 flex items-center gap-1">
              <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
              {order.referringDoctor}
            </span>
          </div>
        </div>

        {/* Test Name Header */}
        <div className="px-5 sm:px-6 pt-5 pb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-100">
            {order.testName}
          </span>
        </div>

        {/* Accessible Medical Table */}
        <div className="p-5 sm:p-6 pt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="pb-3">Investigation / Parameter</th>
                <th className="pb-3">Observed Result</th>
                <th className="pb-3">Biological Reference</th>
                <th className="pb-3 text-right">Clinical Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              <tr className={isCritical ? 'bg-rose-50/40' : ''}>
                <td className="py-4 font-semibold text-slate-900">
                  {order.parameter}
                  <span className="block text-xs font-normal text-slate-400 font-mono mt-0.5">
                    Specimen: Venous Blood
                  </span>
                </td>
                <td className="py-4">
                  <span className={`text-xl font-bold font-mono ${
                    isCritical 
                      ? 'text-rose-600' 
                      : statusBadge.color.includes('amber') 
                      ? 'text-amber-700' 
                      : 'text-slate-900'
                  }`}>
                    {order.result}
                  </span>
                  <span className="text-xs text-slate-500 ml-1 font-medium">{order.unit}</span>
                </td>
                <td className="py-4 text-slate-600 font-mono text-xs">
                  {order.referenceRange} {order.unit}
                </td>
                <td className="py-4 text-right">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border ${statusBadge.color}`}>
                    <statusBadge.icon className="w-3.5 h-3.5" />
                    {statusBadge.text}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Pathologist Digital Stamp */}
        <div className="border-t border-slate-100 p-5 sm:p-6 bg-slate-50/40 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-3">
          <div>
            <p className="font-semibold text-slate-800">Electronically Verified by:</p>
            <p className="text-slate-600">Dr. K. S. Murthy, MD (Pathology), Reg #AP-41829</p>
            <p className="text-[11px] text-slate-400">Chief Pathologist, ArogyaLink Coastal AP Network</p>
          </div>
          <div className="text-right">
            <span className="font-mono text-[11px] text-slate-400 block">QR Cryptographic Hash</span>
            <span className="font-mono text-[11px] text-teal-800 font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              SHA256: 4b9f-7120-e291
            </span>
          </div>
        </div>
      </div>

      {/* Slot for Step 4.4 AI Multi-Language Summary Component */}
      {children}
    </div>
  );
}