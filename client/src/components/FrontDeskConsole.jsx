import React, { useState, useEffect } from 'react';
import LabReportViewer from './LabReportViewer';
import { 
  Search, 
  Upload, 
  Send, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Check, 
  Copy,
  Users,
  ShieldAlert,
  ClipboardList,
  ShieldCheck,
  PhoneCall,
  UserCheck,
  Stethoscope,
  Phone,
  Building2,
  BellRing,
  ArrowRight,
  LogOut
} from 'lucide-react';

export default function FrontDeskConsole({ onSelectOrderForPatientView, currentUser, onLogout }) {
  // Navigation Tabs: 'ORDERS' | 'CALLBACKS' | 'PATHOLOGIST' | 'AUDIT_LOGS' | 'DOCTOR_ROSTERS'
  const [activeTab, setActiveTab] = useState('ORDERS');

  const [orders, setOrders] = useState([]);
  const [callbacks, setCallbacks] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [flaggedSummaries, setFlaggedSummaries] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorRoster, setSelectedDoctorRoster] = useState('Ramanaiah');

  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [sortBy, setSortBy] = useState('PRIORITY');

  // Resend Link Modal State
  const [activeResendOrder, setActiveResendOrder] = useState(null);
  const [resending, setResending] = useState(false);
  const [resendResult, setResendResult] = useState(null);
  const [copied, setCopied] = useState(false);

  // Import CSV State
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState(null);
  const [previewOrder, setPreviewOrder] = useState(null);
  const [remindedDocId, setRemindedDocId] = useState(null);
  const [rosterMessage, setRosterMessage] = useState(null);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [ordRes, callRes, auditRes, flagRes, docRes] = await Promise.all([
        fetch('/api/orders').then(r => r.json()),
        fetch('/api/callback-tasks').then(r => r.json()),
        fetch('/api/audit-logs').then(r => r.json()),
        fetch('/api/pathologist/review-queue').then(r => r.json()),
        fetch('/api/auth/doctors').then(r => r.json())
      ]);

      if (ordRes.success) setOrders(ordRes.data);
      if (callRes.success) setCallbacks(callRes.data);
      if (auditRes.success) setAuditLogs(auditRes.data);
      if (flagRes.success) setFlaggedSummaries(flagRes.data);
      if (docRes.success) setDoctors(docRes.data);
    } catch (err) {
      console.error('Failed to fetch console data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Handle Resend Link
  const handleOpenResendModal = async (order) => {
    setActiveResendOrder(order);
    setResending(true);
    setResendResult(null);
    setCopied(false);

    try {
      const res = await fetch('/api/reports/generate-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.orderId })
      });
      const data = await res.json();
      if (data.success) {
        setResendResult(data);
      }
    } catch (err) {
      console.error('Failed to generate link:', err);
    } finally {
      setResending(false);
    }
  };

  // Handle 1-Click LIS CSV Import
  const handleImportLISBatch = async () => {
    setImporting(true);
    setImportMessage(null);
    try {
      const res = await fetch('/api/orders/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        setImportMessage(data.message);
        fetchAllData();
      }
    } catch (err) {
      console.error('CSV import failed:', err);
    } finally {
      setImporting(false);
    }
  };

  // Handle Resolving a Callback Task
  const handleResolveCallback = async (taskId) => {
    try {
      const res = await fetch(`/api/callback-tasks/${taskId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolvedBy: currentUser ? `${currentUser.name} (${currentUser.department})` : 'Front-Desk Officer (Bunder Road)',
          notes: 'Spoke directly with Referring Doctor. Patient instructed to visit hospital.'
        })
      });
      const data = await res.json();
      if (data.success) {
        setImportMessage('Emergency Callback marked as completed.');
        fetchAllData();
      }
    } catch (err) {
      console.error('Failed to resolve callback:', err);
    }
  };

  // Handle Pathologist Resolving a Flag
  const handleResolveFlag = async (flagId) => {
    try {
      const res = await fetch(`/api/pathologist/review/${flagId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pathologistNotes: 'Reviewed test reference range against patient clinical history. Verified accurate.'
        })
      });
      const data = await res.json();
      if (data.success) {
        setImportMessage('Patient flag signed off by Chief Pathologist.');
        setFlaggedSummaries(prev => prev.map(f => (f.id === flagId || f.orderId === flagId) ? { ...f, status: 'RESOLVED', reviewedByPathologist: true, pathologistNotes: 'Reviewed test reference range against patient clinical history. Verified accurate.' } : f));
        fetchAllData();
      }
    } catch (err) {
      console.error('Failed to resolve flag:', err);
    }
  };

  const handleCopyLink = () => {
    if (resendResult && resendResult.portalUrl) {
      navigator.clipboard.writeText(resendResult.portalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Send Reminder SMS to Doctor
  const handleSendDoctorReminder = (doctor) => {
    const docKey = doctor.doctorKey || doctor.name || doctor.id;
    setRemindedDocId(docKey);
    setRosterMessage(`✓ SMS Reminder dispatched to ${doctor.name} (${doctor.phone}): "ArogyaLink AP: Dr. ${doctor.name}, you have ${doctor.patientCount || 0} patient reports updated."`);
    setImportMessage(`✓ SMS Reminder dispatched to ${doctor.name} (${doctor.phone}): "ArogyaLink AP: Dr. ${doctor.name}, you have ${doctor.patientCount || 0} patient reports updated."`);
    setTimeout(() => {
      setRemindedDocId(null);
      setRosterMessage(null);
    }, 4000);
  };

  // Deduplicate orders by orderId so each patient record appears exactly once
  const uniqueOrders = Array.from(new Map(orders.map(o => [o.orderId || o.id, o])).values());

  // Filter and sort orders
  const isSearching = searchQuery.trim().length > 0;
  const isFilterActive = statusFilter !== 'ALL';

  const filteredOrders = uniqueOrders
    .filter((o) => {
      // Only hide if unsearched, not showing all, and filter is ALL
      if (!isSearching && !showAllOrders && !isFilterActive) return false;

      const q = searchQuery.toLowerCase().trim();
      const cleanDigits = q.replace(/[^0-9]/g, '');
      const patientPhoneDigits = (o.patientPhone || '').replace(/[^0-9]/g, '');

      const matchesName = (o.patientName || '').toLowerCase().includes(q);
      const matchesId = (o.orderId || '').toLowerCase().includes(q);
      const matchesPhone = cleanDigits.length >= 3 && patientPhoneDigits.includes(cleanDigits);
      const matchesParam = 
        (o.parameter || '').toLowerCase().includes(q) ||
        (o.tests && Array.isArray(o.tests) && o.tests.some(t => (t.parameter || t.name || '').toLowerCase().includes(q)));
      const matchesDoc = (o.referringDoctor || '').toLowerCase().includes(q);

      const matchesSearch = !q || matchesName || matchesId || matchesPhone || matchesParam || matchesDoc;

      const isCritical = o.isCritical || (o.status && o.status.toLowerCase().includes('critical'));
      const isReady = !isCritical && (o.status && o.status.toLowerCase().startsWith('ready'));
      const isProcessing = (o.status && o.status.toLowerCase().includes('process'));

      const matchesStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'CRITICAL'
          ? isCritical
          : statusFilter === 'Ready'
          ? isReady
          : statusFilter === 'Processing'
          ? isProcessing
          : o.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'NAME') {
        return (a.patientName || '').localeCompare(b.patientName || '');
      }
      if (sortBy === 'ORDER_ID') {
        return (b.orderId || '').localeCompare(a.orderId || '');
      }
      // Default: 'PRIORITY' - Critical panic orders first, then Ready, then Processing
      const getPriorityRank = (item) => {
        if (item.isCritical || (item.status && item.status.toLowerCase().includes('critical'))) return 1;
        if (item.status && item.status.toLowerCase().startsWith('ready')) return 2;
        return 3;
      };
      const rankDiff = getPriorityRank(a) - getPriorityRank(b);
      if (rankDiff !== 0) return rankDiff;
      return (b.orderId || '').localeCompare(a.orderId || '');
    });

  const pendingCallbacksCount = callbacks.filter(c => c.status === 'Pending').length;

  return (
    <div className="space-y-6">
      {/* Top Operations Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            Front-Desk Operations & Compliance Console
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time diagnostic dispatch, emergency callback queue, doctor rosters, and DPDP 2023 audit monitoring
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {currentUser && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-slate-800 font-semibold">{currentUser.name}</span>
              <span className="text-slate-400 text-[11px]">({currentUser.department || 'Operations'})</span>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="ml-1 text-rose-600 hover:text-rose-700 font-bold hover:underline cursor-pointer flex items-center gap-1"
                  title="Sign Out"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Logout</span>
                </button>
              )}
            </div>
          )}

          <button
            onClick={async () => {
              await fetchAllData();
              setImportMessage('Data refreshed successfully.');
              setTimeout(() => setImportMessage(null), 2000);
            }}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer flex items-center gap-1"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 text-teal-600 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleImportLISBatch}
            disabled={importing}
            className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>{importing ? 'Processing Batch...' : 'Import Daily LIS Batch (CSV)'}</span>
          </button>
        </div>
      </div>

      {/* CSV Import / Action Success Banner */}
      {importMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{importMessage}</span>
          </div>
          <button onClick={() => setImportMessage(null)} className="text-emerald-700 font-bold ml-2 cursor-pointer">✕</button>
        </div>
      )}

      {/* 5 Operations Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-1 text-xs">
        <button
          onClick={() => setActiveTab('ORDERS')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${
            activeTab === 'ORDERS'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Patient Search & Reports</span>
        </button>

        <button
          onClick={() => setActiveTab('DOCTOR_ROSTERS')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${
            activeTab === 'DOCTOR_ROSTERS'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'text-teal-800 hover:bg-teal-50'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          <span>Doctor Portfolios & Rosters ({doctors.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('CALLBACKS')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${
            activeTab === 'CALLBACKS'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-rose-700 hover:bg-rose-50'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>🚨 Urgent Doctor Callbacks ({callbacks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('PATHOLOGIST')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${
            activeTab === 'PATHOLOGIST'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-indigo-700 hover:bg-indigo-50'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Pathologist Audit Queue ({flaggedSummaries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('AUDIT_LOGS')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${
            activeTab === 'AUDIT_LOGS'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>DPDP 2023 Access Logs ({auditLogs.length})</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: PATIENT SEARCH & DISPATCH */}
      {/* ========================================================= */}
      {activeTab === 'ORDERS' && (
        <div className="space-y-4">
          {/* Patient Search and Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[280px]">
                <Search className="w-4 h-4 text-teal-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value.trim() === '') setShowAllOrders(false);
                  }}
                  placeholder="Search patient by name, order ID (e.g. ORD-71204), mobile (+91...), or test parameter..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-teal-500 outline-none transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setShowAllOrders(false);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Status Filter Buttons with Live Counts */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                  {['ALL', 'Ready', 'Processing', 'CRITICAL'].map((st) => {
                    const count = st === 'ALL'
                      ? uniqueOrders.length
                      : st === 'CRITICAL'
                      ? uniqueOrders.filter(o => o.isCritical || (o.status && o.status.toLowerCase().includes('critical'))).length
                      : st === 'Ready'
                      ? uniqueOrders.filter(o => !o.isCritical && (o.status && o.status.toLowerCase().startsWith('ready'))).length
                      : uniqueOrders.filter(o => (o.status && o.status.toLowerCase().includes('process'))).length;

                    return (
                      <button
                        key={st}
                        onClick={() => {
                          setStatusFilter(st);
                          if (st !== 'ALL') setShowAllOrders(true);
                        }}
                        className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1 text-[11px] ${
                          statusFilter === st
                            ? 'bg-white text-slate-900 shadow-xs font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span>{st === 'CRITICAL' ? '🚨 Critical' : st}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          st === 'CRITICAL' && count > 0 
                            ? 'bg-rose-100 text-rose-800' 
                            : statusFilter === st 
                            ? 'bg-slate-200 text-slate-800' 
                            : 'bg-slate-200/60 text-slate-500'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Sort Option Control */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                  <span className="text-[11px] text-slate-400 pl-1 font-semibold">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-white border border-slate-200 text-slate-800 text-[11px] font-semibold rounded-lg px-2 py-1 outline-none cursor-pointer"
                  >
                    <option value="PRIORITY">Priority (🚨 Panic First)</option>
                    <option value="NAME">Patient Name (A-Z)</option>
                    <option value="ORDER_ID">Order ID</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Quick 1-Click Search Suggestions */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-500">
              <span className="font-semibold text-slate-600">Quick Searches:</span>
              <button
                type="button"
                onClick={() => { setSearchQuery('Lakshmi Prasanna'); setShowAllOrders(false); }}
                className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
              >
                Lakshmi Prasanna (ORD-71204)
              </button>
              <button
                type="button"
                onClick={() => { setSearchQuery('Farzana'); setShowAllOrders(false); }}
                className="px-2 py-0.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 transition-colors cursor-pointer font-medium"
              >
                🚨 Farzana Begum (Potassium - Panic)
              </button>
              <button
                type="button"
                onClick={() => { setSearchQuery('Venkata'); setShowAllOrders(false); }}
                className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
              >
                Venkata Rao (LDL 142)
              </button>
              <button
                type="button"
                onClick={() => { setSearchQuery('98480'); setShowAllOrders(false); }}
                className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
              >
                Mobile: 98480...
              </button>
              <button
                type="button"
                onClick={() => { setSearchQuery('Glucose'); setShowAllOrders(false); }}
                className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
              >
                Glucose (168)
              </button>
            </div>
          </div>

          {/* INITIAL SCREEN: When Front-Desk has not performed a search and filter is ALL */}
          {!isSearching && !showAllOrders && statusFilter === 'ALL' ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center shadow-xs">
              <div className="w-16 h-16 rounded-3xl bg-teal-50 text-teal-600 mx-auto flex items-center justify-center mb-4 border border-teal-100">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                Search Patient Diagnostic Records
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                Enter a patient name, order ID, registered mobile number, or test parameter above to retrieve lab reports and dispatch SMS links.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto mt-6 text-left">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Criterion 1</span>
                  <p className="text-xs font-semibold text-slate-800 mt-0.5">👤 Patient Name</p>
                  <span className="text-[10px] text-slate-500">e.g. Lakshmi Prasanna</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Criterion 2</span>
                  <p className="text-xs font-semibold text-slate-800 mt-0.5">🏷️ Order ID</p>
                  <span className="text-[10px] text-slate-500">e.g. ORD-71204</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Criterion 3</span>
                  <p className="text-xs font-semibold text-slate-800 mt-0.5">📱 Mobile Number</p>
                  <span className="text-[10px] text-slate-500">e.g. 98480 12345</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Criterion 4</span>
                  <p className="text-xs font-semibold text-slate-800 mt-0.5">🧪 Test Parameter</p>
                  <span className="text-[10px] text-slate-500">e.g. Potassium, Glucose</span>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowAllOrders(true)}
                  className="text-xs text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Or Browse All Active Orders in Queue ({orders.length})
                </button>
              </div>
            </div>
          ) : (
            /* SEARCH RESULTS: Displayed only after searching or when viewing all */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-slate-600 font-medium">
                  {isSearching ? (
                    <>Showing <strong>{filteredOrders.length}</strong> matching record{filteredOrders.length === 1 ? '' : 's'} for &ldquo;<span className="text-teal-700 font-bold">{searchQuery}</span>&rdquo;</>
                  ) : (
                    <>Showing all <strong>{filteredOrders.length}</strong> patient records in network</>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setShowAllOrders(false);
                  }}
                  className="text-teal-600 hover:text-teal-800 font-semibold underline cursor-pointer text-[11px]"
                >
                  Back to Search Prompt
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                        <th className="py-3.5 px-4">Order ID</th>
                        <th className="py-3.5 px-4">Patient Demographics</th>
                        <th className="py-3.5 px-4">Investigation & Result</th>
                        <th className="py-3.5 px-4">Referring Doctor</th>
                        <th className="py-3.5 px-4">Report Status</th>
                        <th className="py-3.5 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400">
                            No patient records match &ldquo;{searchQuery}&rdquo;. Try another name, mobile number, or Order ID.
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((order) => {
                          const isCritical = order.isCritical || (order.status && order.status.includes('critical'));
                          return (
                            <tr
                              key={order.orderId}
                              className={`hover:bg-slate-50/70 transition-colors ${
                                isCritical ? 'bg-rose-50/40' : ''
                              }`}
                            >
                              <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                                {order.orderId}
                              </td>

                              <td className="py-3.5 px-4">
                                <span className="font-semibold text-slate-900 block text-sm">
                                  {order.patientName}
                                </span>
                                <span className="text-slate-500 text-[11px]">
                                  {order.age} yrs • {order.gender} • {order.patientPhone}
                                </span>
                              </td>

                              <td className="py-3.5 px-4">
                                <span className="font-medium text-slate-900 block">
                                  {order.parameter}
                                </span>
                                <span className={`font-mono text-xs ${
                                  isCritical ? 'text-rose-600 font-bold' : 'text-slate-600'
                                }`}>
                                  <strong>{order.result}</strong> {order.unit}
                                  <span className="text-slate-400 ml-1.5 font-sans text-[11px]">
                                    (Ref: {order.referenceRange})
                                  </span>
                                </span>
                              </td>

                              <td className="py-3.5 px-4 text-slate-700">
                                <span className="font-medium block">{order.referringDoctor}</span>
                                <span className="text-slate-400 text-[11px]">{order.collectionCenter}</span>
                              </td>

                              <td className="py-3.5 px-4">
                                {isCritical ? (
                                  <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 font-bold px-2.5 py-1 rounded-full text-[11px] border border-rose-300">
                                    🚨 Critical (Callback)
                                  </span>
                                ) : order.status === 'Ready' ? (
                                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-1 rounded-full text-[11px] border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    Ready (Sent)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 font-medium px-2.5 py-1 rounded-full text-[11px] border border-slate-200">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    Processing
                                  </span>
                                )}
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => handleOpenResendModal(order)}
                                    className="text-slate-700 hover:text-teal-700 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1 text-[11px] transition-colors cursor-pointer"
                                    title="Resend 72-Hour Expiring Link via SMS"
                                  >
                                    <Send className="w-3 h-3 text-teal-600" />
                                    <span>Resend Link</span>
                                  </button>

                                  <button
                                    onClick={() => setPreviewOrder(order)}
                                    className="text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1 text-[11px] transition-colors cursor-pointer"
                                    title="Open Diagnostic Report Preview"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    <span>Preview</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: DOCTOR PORTFOLIOS & ROSTERS (STAFF VIEW) */}
      {/* ========================================================= */}
      {activeTab === 'DOCTOR_ROSTERS' && (
        <div className="space-y-6">
          <div className="bg-teal-50/70 border border-teal-200 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs text-teal-900">
            <div className="flex items-center gap-2.5">
              <Stethoscope className="w-5 h-5 text-teal-700 shrink-0" />
              <span>
                <strong>Referring Doctor Supervision Station:</strong> Front-desk staff can monitor individual doctor patient lists, send bulk status reminders, and assist clinicians with pending tests.
              </span>
            </div>
            <span className="font-bold bg-teal-200/80 text-teal-900 px-3 py-1 rounded-full text-[11px]">
              {doctors.length} Registered Clinicians
            </span>
          </div>

          {rosterMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs rounded-xl flex items-center justify-between animate-fadeIn shadow-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="text-base">📲</span>
                <span>{rosterMessage}</span>
              </div>
              <button onClick={() => setRosterMessage(null)} className="text-emerald-700 hover:text-emerald-950 cursor-pointer text-sm font-bold">✕</button>
            </div>
          )}

          {/* Doctor Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {doctors.map((doc) => {
              const dKey = (doc.doctorKey || doc.name || doc.id || '').toLowerCase();
              const isSelected = (selectedDoctorRoster || '').toLowerCase().includes(dKey) || dKey.includes((selectedDoctorRoster || '').toLowerCase());
              return (
                <div
                  key={doc.id}
                  className={`bg-white rounded-2xl p-5 border transition-all cursor-pointer ${
                    isSelected 
                      ? 'border-teal-500 shadow-md ring-2 ring-teal-500/20' 
                      : 'border-slate-200 shadow-xs hover:border-slate-300'
                  }`}
                  onClick={() => setSelectedDoctorRoster(doc.doctorKey || doc.name)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    {doc.criticalCount > 0 && (
                      <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-200">
                        🚨 {doc.criticalCount} Critical
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{doc.name}</h3>
                  <p className="text-xs text-slate-500">{doc.specialty}</p>

                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-600">
                    <p className="flex items-center gap-1.5 text-[11px]">
                      <Building2 className="w-3.5 h-3.5 text-teal-600" />
                      <span className="truncate">{doc.clinic}</span>
                    </p>
                    <p className="flex items-center gap-1.5 text-[11px]">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{doc.phone}</span>
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 text-[10px] block uppercase font-semibold">Patients</span>
                      <strong className="text-slate-800 text-sm">{doc.patientCount || 0}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block uppercase font-semibold">Pending</span>
                      <strong className="text-amber-600 text-sm">{doc.pendingCount || 0}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block uppercase font-semibold">Ready</span>
                      <strong className="text-emerald-600 text-sm">{Math.max(0, (doc.patientCount || 0) - (doc.pendingCount || 0))}</strong>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSendDoctorReminder(doc);
                      }}
                      className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        remindedDocId === (doc.doctorKey || doc.name || doc.id)
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 border-slate-200'
                      }`}
                      title="Send SMS update to doctor"
                    >
                      <BellRing className={`w-3 h-3 ${remindedDocId === (doc.doctorKey || doc.name || doc.id) ? 'text-white animate-bounce' : 'text-teal-600'}`} />
                      <span>{remindedDocId === (doc.doctorKey || doc.name || doc.id) ? '✓ Dispatched to Doctor!' : 'Remind Doctor'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Doctor's Detailed Patient Roster */}
          {(() => {
            const activeDocObj = doctors.find(d => {
              const dKey = (d.doctorKey || d.name || '').toLowerCase();
              const sel = (selectedDoctorRoster || '').toLowerCase();
              return dKey.includes(sel) || sel.includes(dKey);
            }) || doctors[0];

            const docPatients = activeDocObj?.patients && activeDocObj.patients.length > 0
              ? activeDocObj.patients
              : orders.filter(o => o.referringDoctor?.toLowerCase().includes((activeDocObj?.name || selectedDoctorRoster || '').toLowerCase().replace('dr.', '').trim()));

            return (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-teal-600" />
                      Active Patient Roster for {activeDocObj ? activeDocObj.name : 'Doctor'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Staff inspection view: {docPatients.length} patient reports assigned to this physician
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <button
                      onClick={() => activeDocObj && handleSendDoctorReminder(activeDocObj)}
                      className={`font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                        remindedDocId
                          ? 'bg-emerald-600 text-white'
                          : 'bg-teal-600 hover:bg-teal-700 text-white'
                      }`}
                    >
                      <Send className="w-3 h-3" />
                      <span>{remindedDocId ? '✓ Summary Dispatched via SMS!' : 'Send Summary to Doctor Phone'}</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4">Order ID</th>
                        <th className="py-3 px-4">Patient Name</th>
                        <th className="py-3 px-4">Investigation</th>
                        <th className="py-3 px-4">Result</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {docPatients.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            No patient reports found for this clinician.
                          </td>
                        </tr>
                      ) : (
                        docPatients.map((p) => {
                          const isCrit = p.isCritical || (p.status && p.status.includes('critical'));
                          return (
                            <tr key={p.orderId} className={`hover:bg-slate-50/60 ${isCrit ? 'bg-rose-50/30' : ''}`}>
                              <td className="py-3 px-4 font-mono font-bold text-slate-800">{p.orderId}</td>
                              <td className="py-3 px-4">
                                <span className="font-semibold text-slate-900 block">{p.patientName}</span>
                                <span className="text-slate-500 text-[11px]">{p.age} yrs • {p.gender} • {p.patientPhone}</span>
                              </td>
                              <td className="py-3 px-4 font-medium text-slate-800">{p.parameter}</td>
                              <td className="py-3 px-4 font-mono">
                                <span className={isCrit ? 'text-rose-600 font-bold' : 'text-slate-900'}>
                                  {p.result} {p.unit}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                {isCrit ? (
                                  <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-200">
                                    🚨 Critical Panic
                                  </span>
                                ) : p.status === 'Ready' ? (
                                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                                    Ready
                                  </span>
                                ) : (
                                  <span className="bg-slate-100 text-slate-600 text-[10px] font-medium px-2 py-0.5 rounded-full border border-slate-200">
                                    Processing
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() => setPreviewOrder(p)}
                                  className="text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 font-semibold px-2.5 py-1 rounded-lg text-[11px] transition-colors cursor-pointer inline-flex items-center gap-1"
                                >
                                  <span>View Report</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: URGENT DOCTOR CALLBACKS */}
      {/* ========================================================= */}
      {activeTab === 'CALLBACKS' && (
        <div className="space-y-4">
          <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center justify-between text-xs text-rose-900">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
              <span>
                <strong>Clinical Safety Protocol:</strong> Routine AI summaries are withheld for panic values. Staff must contact the referring physician immediately.
              </span>
            </div>
            <span className="font-bold bg-rose-200 px-2.5 py-0.5 rounded-full">
              {pendingCallbacksCount} Pending • {callbacks.length} Total
            </span>
          </div>

          <div className="grid gap-3">
            {callbacks.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
                No urgent callbacks at this time. All panic values have been notified.
              </div>
            ) : (
              callbacks.map((task) => (
                <div
                  key={task.id}
                  className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-wrap items-center justify-between gap-4 transition-all ${
                    task.status === 'Completed'
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : 'border-rose-200 bg-rose-50/30'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        task.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-600 text-white'
                      }`}>
                        {task.status === 'Completed' ? 'RESOLVED' : 'URGENT NOTIFICATION REQUIRED'}
                      </span>
                      <span className="font-mono text-slate-500 font-bold">{task.orderId}</span>
                      <span className="text-slate-400 text-[11px]">
                        • {new Date(task.createdAt).toLocaleTimeString('en-IN')}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900">
                      {task.patientName} <span className="text-rose-600 font-mono text-sm ml-1">({task.parameter}: {task.result})</span>
                    </h4>

                    <p className="text-xs text-slate-600 flex items-center gap-3">
                      <span><strong>Doctor:</strong> {task.referringDoctor}</span>
                      <span>•</span>
                      <span><strong>Patient Phone:</strong> {task.patientPhone}</span>
                    </p>

                    {task.notes && (
                      <p className="text-xs text-emerald-700 font-medium">
                        ✓ {task.notes}
                      </p>
                    )}
                  </div>

                  <div>
                    {task.status === 'Completed' ? (
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                        <Check className="w-4 h-4 text-emerald-600" />
                        Doctor Contacted
                      </span>
                    ) : (
                      <button
                        onClick={() => handleResolveCallback(task.id)}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Confirm Doctor Contacted</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: PATHOLOGIST WEEKLY REVIEW QUEUE */}
      {/* ========================================================= */}
      {activeTab === 'PATHOLOGIST' && (
        <div className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl flex items-center justify-between text-xs text-indigo-900">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-600 shrink-0" />
              <span>
                <strong>Chief Pathologist Audit Station:</strong> Reviewing patient-flagged summaries to maintain clinical quality standards (50 reviews/week quota).
              </span>
            </div>
            <span className="font-bold bg-indigo-200 px-2.5 py-0.5 rounded-full">
              {flaggedSummaries.length} Records
            </span>
          </div>

          <div className="grid gap-3">
            {flaggedSummaries.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
                No patient flags pending review. All summaries validated.
              </div>
            ) : (
              flaggedSummaries.map((flag) => (
                <div key={flag.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-md text-[11px]">
                        Flag Reason: {flag.reason}
                      </span>
                      <span className="font-mono font-bold text-slate-700">{flag.orderId}</span>
                      <span className="text-slate-400 text-[11px]">• {new Date(flag.createdAt).toLocaleTimeString('en-IN')}</span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">
                      Patient: {flag.patientName} ({flag.parameter}: {flag.result})
                    </h4>

                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <strong>Patient Note:</strong> "{flag.patientComment}"
                    </p>

                    {flag.pathologistNotes && (
                      <p className="text-xs text-emerald-700 font-medium">
                        ✓ Pathologist Action: {flag.pathologistNotes}
                      </p>
                    )}
                  </div>

                  <div>
                    {(flag.reviewedByPathologist || flag.status === 'RESOLVED') ? (
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-300 shadow-xs">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>✓ Signed Off by Pathologist</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleResolveFlag(flag.id)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Sign Off as Pathologist</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: DPDP 2023 ACCESS AUDIT LOGS */}
      {/* ========================================================= */}
      {activeTab === 'AUDIT_LOGS' && (
        <div className="space-y-4">
          <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>
                <strong>DPDP Act 2023 Statutory Compliance Log:</strong> All report decryptions and OTP authentications are immutably logged with timestamp and masked identifiers.
              </span>
            </div>
            <span className="bg-slate-800 text-emerald-400 px-3 py-1 rounded-full font-mono text-[11px] border border-slate-700">
              {auditLogs.length} Events Logged
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                    <th className="py-3 px-4">Event ID</th>
                    <th className="py-3 px-4">Timestamp (IST)</th>
                    <th className="py-3 px-4">Order Ref</th>
                    <th className="py-3 px-4">Patient Name</th>
                    <th className="py-3 px-4">Masked Phone</th>
                    <th className="py-3 px-4">Access Protocol</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No report access events logged yet. Open a report in the Patient Portal to generate an audit record.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 text-slate-500 font-bold">{log.id}</td>
                        <td className="py-3 px-4 text-slate-600">
                          {new Date(log.timestamp).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-teal-700 font-bold">{log.orderId}</td>
                        <td className="py-3 px-4 text-slate-800 font-sans font-medium">{log.patientName}</td>
                        <td className="py-3 px-4 text-slate-600">{log.maskedPhone}</td>
                        <td className="py-3 px-4 text-slate-600 font-sans">{log.accessMethod}</td>
                        <td className="py-3 px-4 text-right">
                          <span className="inline-block bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold text-[10px] border border-emerald-200">
                            Authorized
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Resend Link & SMS Preview Modal */}
      {activeResendOrder && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-900 flex items-center gap-2 text-base">
                <Send className="w-4 h-4 text-teal-600" />
                Resend 72-Hour Expiring Link
              </h4>
              <button
                onClick={() => setActiveResendOrder(null)}
                className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {resending ? (
              <div className="py-8 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 text-teal-600 animate-spin" />
                <span>Generating fresh HMAC-SHA256 secure token...</span>
              </div>
            ) : resendResult ? (
              <div className="space-y-4 text-xs">
                <div>
                  <span className="font-semibold text-slate-700 block mb-1.5">
                    Outgoing SMS Dispatch Preview (Sent to {resendResult.patientPhone}):
                  </span>
                  <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl font-mono text-[11px] leading-relaxed border border-slate-800 shadow-inner">
                    {resendResult.mockSmsMessage}
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Expires: <strong>{new Date(resendResult.expiresAt).toLocaleString('en-IN')}</strong></span>
                  </div>
                  <span className="text-[11px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                    72 Hours
                  </span>
                </div>

                <div>
                  <span className="font-semibold text-slate-700 block mb-1">
                    Direct Patient Portal URL:
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={resendResult.portalUrl}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-[11px] text-slate-700 select-all outline-none"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setActiveResendOrder(null)}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
      {/* Staff Diagnostic Report Preview Modal */}
      {previewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto border border-slate-100 p-6">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-200">
              <div>
                <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200 uppercase tracking-wider">
                  Front-Desk Diagnostic Report Preview
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Report: {previewOrder.patientName} ({previewOrder.orderId || previewOrder.id})
                </h3>
              </div>
              <button
                onClick={() => setPreviewOrder(null)}
                className="text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                ✕ Close Preview
              </button>
            </div>
            <LabReportViewer order={previewOrder} />
          </div>
        </div>
      )}
    </div>
  );
}
