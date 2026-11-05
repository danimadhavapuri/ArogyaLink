import React, { useState, useEffect } from 'react';
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
  UserCheck
} from 'lucide-react';

export default function FrontDeskConsole({ onSelectOrderForPatientView }) {
  // Navigation Tabs: 'ORDERS' | 'CALLBACKS' | 'PATHOLOGIST' | 'AUDIT_LOGS'
  const [activeTab, setActiveTab] = useState('ORDERS');

  const [orders, setOrders] = useState([]);
  const [callbacks, setCallbacks] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [flaggedSummaries, setFlaggedSummaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Resend Link Modal State
  const [activeResendOrder, setActiveResendOrder] = useState(null);
  const [resending, setResending] = useState(false);
  const [resendResult, setResendResult] = useState(null);
  const [copied, setCopied] = useState(false);

  // Import CSV State
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState(null);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [ordRes, callRes, auditRes, flagRes] = await Promise.all([
        fetch('/api/orders').then(r => r.json()),
        fetch('/api/callback-tasks').then(r => r.json()),
        fetch('/api/audit-logs').then(r => r.json()),
        fetch('/api/pathologist/review-queue').then(r => r.json())
      ]);

      if (ordRes.success) setOrders(ordRes.data);
      if (callRes.success) setCallbacks(callRes.data);
      if (auditRes.success) setAuditLogs(auditRes.data);
      if (flagRes.success) setFlaggedSummaries(flagRes.data);
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
          resolvedBy: 'Front-Desk Officer (Bunder Road)',
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

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.referringDoctor.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'CRITICAL'
        ? o.isCritical || (o.status && o.status.includes('critical'))
        : o.status === statusFilter;

    return matchesSearch && matchesStatus;
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
            Real-time diagnostic dispatch, emergency callback queue, and DPDP 2023 audit monitoring
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={async () => {
              await fetchAllData();
              setImportMessage('Orders list refreshed successfully.');
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
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{importMessage}</span>
          </div>
          <button onClick={() => setImportMessage(null)} className="text-emerald-700 font-bold ml-2">✕</button>
        </div>
      )}

      {/* 4 Operations Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-1 text-xs">
        <button
          onClick={() => setActiveTab('ORDERS')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${
            activeTab === 'ORDERS'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Daily Orders Queue ({orders.length})</span>
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
          <span>🚨 Urgent Doctor Callbacks ({pendingCallbacksCount})</span>
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
      {/* TAB 1: DAILY ORDERS QUEUE */}
      {/* ========================================================= */}
      {activeTab === 'ORDERS' && (
        <div className="space-y-4">
          {/* Search and Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient name, order ID, or doctor..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:border-teal-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
              {['ALL', 'Ready', 'Processing', 'CRITICAL'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    statusFilter === st
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {st === 'CRITICAL' ? '🚨 Critical' : st}
                </button>
              ))}
            </div>
          </div>

          {/* Master Orders Table */}
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
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No orders match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => {
                      const isCritical = order.isCritical || (order.status && order.status.includes('critical'));
                      return (
                        <tr key={order.orderId} className={`hover:bg-slate-50/60 transition-colors ${isCritical ? 'bg-rose-50/30' : ''}`}>
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
                            <span className="text-slate-800 font-medium block">
                              {order.parameter}
                            </span>
                            <span className={`font-mono font-bold ${isCritical ? 'text-rose-600' : 'text-slate-700'}`}>
                              {order.result} {order.unit}
                            </span>
                            <span className="text-slate-400 text-[11px] ml-1">
                              (Ref: {order.referenceRange})
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700">
                            <span className="font-medium block">{order.referringDoctor}</span>
                            <span className="text-slate-400 text-[11px]">{order.collectionCentre}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            {isCritical ? (
                              <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 font-bold px-2.5 py-0.5 rounded-full text-[11px] border border-rose-300">
                                🚨 Critical (Callback)
                              </span>
                            ) : order.status === 'Ready' ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-0.5 rounded-full text-[11px] border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Ready (Sent)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 font-medium px-2.5 py-0.5 rounded-full text-[11px] border border-slate-200">
                                <Clock className="w-3 h-3 text-slate-400" />
                                Processing
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenResendModal(order)}
                                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
                                title="Resend 72-Hour Link via SMS"
                              >
                                <Send className="w-3 h-3 text-teal-600" />
                                <span>Resend Link</span>
                              </button>

                              <button
                                onClick={() => onSelectOrderForPatientView(order.orderId)}
                                className="text-xs bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold px-2.5 py-1.5 rounded-lg border border-teal-200 flex items-center gap-1 transition-colors cursor-pointer"
                                title="Preview Patient Mobile View"
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

      {/* ========================================================= */}
      {/* TAB 2: URGENT DOCTOR CALLBACK QUEUE */}
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
              {pendingCallbacksCount} Pending
            </span>
          </div>

          <div className="grid gap-4">
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
                      ? 'border-emerald-200 bg-emerald-50/20 opacity-75'
                      : 'border-rose-300 ring-2 ring-rose-100'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        task.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-600 text-white animate-pulse'
                      }`}>
                        {task.status === 'Completed' ? 'Resolved' : 'Urgent Panic Callback'}
                      </span>
                      <span className="font-mono text-xs text-slate-500 font-bold">{task.orderId}</span>
                      <span className="text-slate-400 text-[11px]">• {new Date(task.createdAt).toLocaleTimeString('en-IN')}</span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900">
                      {task.patientName}{' '}
                      <span className="text-rose-600 font-mono text-sm ml-2 font-bold">
                        {task.parameter}: {task.result}
                      </span>
                    </h4>

                    <p className="text-xs text-slate-600 flex items-center gap-4">
                      <span><strong>Doctor:</strong> {task.referringDoctor}</span>
                      <span><strong>Patient Phone:</strong> {task.patientPhone}</span>
                    </p>

                    {task.notes && (
                      <p className="text-xs text-emerald-700 font-medium pt-1">
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
                        className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Mark Doctor Contacted</span>
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
      {/* TAB 3: PATHOLOGIST WEEKLY REVIEW QUEUE */}
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
                    {flag.reviewedByPathologist ? (
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                        <Check className="w-4 h-4 text-emerald-600" />
                        Signed Off
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
      {/* TAB 4: DPDP 2023 ACCESS AUDIT LOGS */}
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
                className="text-slate-400 hover:text-slate-600 font-bold"
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
    </div>
  );
}