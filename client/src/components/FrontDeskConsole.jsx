import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Upload, 
  Send, 
  RefreshCw, 
  FileSpreadsheet, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ExternalLink, 
  Check, 
  Copy,
  Users
} from 'lucide-react';

export default function FrontDeskConsole({ onSelectOrderForPatientView }) {
  const [orders, setOrders] = useState([]);
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

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
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
        fetchOrders();
      }
    } catch (err) {
      console.error('CSV import failed:', err);
    } finally {
      setImporting(false);
    }
  };

  const handleCopyLink = () => {
    if (resendResult && resendResult.portalUrl) {
      navigator.clipboard.writeText(resendResult.portalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Filter orders by search & status
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

  return (
    <div className="space-y-6">
      {/* Top Operations Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            Front-Desk Dispatch & Ingestion Console
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage daily diagnostic orders, monitor 72-hour link dispatch, and upload LIS batches
          </p>
        </div>

        <div className="flex items-center gap-2.5">
                    <button
            onClick={async () => {
              await fetchOrders();
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

      {/* CSV Import Success Banner */}
      {importMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{importMessage}</span>
          </div>
          <button onClick={() => setImportMessage(null)} className="text-emerald-700 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        {/* Search Input */}
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

        {/* Status Filter Tabs */}
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
                {/* Simulated SMS Message Preview Card */}
                <div>
                  <span className="font-semibold text-slate-700 block mb-1.5">
                    Outgoing SMS Dispatch Preview (Sent to {resendResult.patientPhone}):
                  </span>
                  <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl font-mono text-[11px] leading-relaxed border border-slate-800 shadow-inner">
                    {resendResult.mockSmsMessage}
                  </div>
                </div>

                {/* Expiry Details */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Expires: <strong>{new Date(resendResult.expiresAt).toLocaleString('en-IN')}</strong></span>
                  </div>
                  <span className="text-[11px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                    72 Hours
                  </span>
                </div>

                {/* Magic URL */}
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