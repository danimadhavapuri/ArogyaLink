import React, { useState, useEffect } from 'react';
import LabReportViewer from './LabReportViewer';
import { 
  Stethoscope, 
  Search, 
  Calendar, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  FileText, 
  Building2, 
  UserCheck,
  Activity,
  ArrowRight,
  LogOut,
  Phone
} from 'lucide-react';

const DOCTORS_LIST = [
  { id: 'Ramanaiah', name: 'Dr. S. Ramanaiah', specialty: 'General Physician', clinic: 'Coastal Health Clinic, Vijayawada', phone: '+91 866 247 1101' },
  { id: 'Anitha', name: 'Dr. P. Anitha', specialty: 'Cardiologist', clinic: 'Coastal Heart Care, Governorpet', phone: '+91 866 247 2202' },
  { id: 'Suresh', name: 'Dr. K. Suresh', specialty: 'Nephrologist', clinic: 'AP Kidney Institute, One Town', phone: '+91 866 247 3303' }
];

export default function DoctorPortal({ onSelectPatientReport, currentUser, onLogout }) {
  // If a doctor is logged in, isolate strictly to their profile
  const getDoctorProfile = () => {
    if (!currentUser || currentUser.role === 'staff') return DOCTORS_LIST[0];
    const match = DOCTORS_LIST.find(d => 
      (currentUser.doctorName || currentUser.name || '').toLowerCase().includes(d.id.toLowerCase())
    );
    if (match) return match;
    return {
      id: currentUser.doctorName || currentUser.name,
      name: currentUser.doctorName || currentUser.name,
      specialty: currentUser.specialization || 'Consultant Clinician',
      clinic: currentUser.center || 'Company A Lab Network, Vijayawada',
      phone: currentUser.phone || '+91 866 247 1101'
    };
  };

  const [selectedDoctor, setSelectedDoctor] = useState(getDoctorProfile());
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingReport, setViewingReport] = useState(null);

  // Keep selected doctor in sync when currentUser changes
  useEffect(() => {
    setSelectedDoctor(getDoctorProfile());
  }, [currentUser]);

  const fetchDoctorReports = async (docId) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/doctors/reports?doctor=${encodeURIComponent(docId)}`);
      const data = await res.json();
      if (data.success) {
        setReports(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch doctor reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDoctor?.id) {
      fetchDoctorReports(selectedDoctor.id);
    }
  }, [selectedDoctor]);

  const filteredReports = reports.filter(r => 
    r.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.parameter.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const criticalCount = reports.filter(r => r.isCritical || (r.status && r.status.includes('critical'))).length;

  return (
    <div className="space-y-6">
      {/* Top Doctor Profile Strip */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{selectedDoctor.name}</h2>
              <span className="text-[11px] bg-teal-50 text-teal-700 font-semibold px-2.5 py-0.5 rounded-full border border-teal-200">
                Referring Clinician Portal
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
              <span>{selectedDoctor.specialty}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-teal-600" />
                {selectedDoctor.clinic}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-400">
                <Phone className="w-3 h-3 text-teal-600" />
                {selectedDoctor.phone}
              </span>
            </p>
          </div>
        </div>

        {/* 90-Day Regulatory Badge & Sign Out */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 text-xs bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-slate-700 font-medium">
            <Calendar className="w-4 h-4 text-teal-600" />
            <span>Active Window: <strong>Last 90 Days</strong></span>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl font-semibold transition-colors cursor-pointer"
              title="Sign Out of Doctor Portal"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </div>

      {/* Doctor Switcher Pill (Shown in Staff Supervision or Reviewer Demo mode) */}
      {(!currentUser || currentUser?.role === 'staff') && (
        <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-600 px-3 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-teal-600" />
            {currentUser?.role === 'staff' ? 'Staff Supervision — Select Doctor Dashboard:' : 'Reviewer Quick Switcher:'}
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {DOCTORS_LIST.map((doc) => (
              <button
                key={doc.id}
                onClick={() => setSelectedDoctor(doc)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  selectedDoctor.id === doc.id
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                {doc.name} ({doc.specialty})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Clinical Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Referred Patients</span>
            <Activity className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{reports.length}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Your patients in Coastal AP Network</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Critical Panic Values</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <p className={`text-2xl font-bold ${criticalCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {criticalCount}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Immediate clinical callback required</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Average Turnaround</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">3.8 Hours</p>
          <span className="text-[11px] text-emerald-600 font-medium mt-1 block">Pathologist sign-off to portal ready</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search ${selectedDoctor.name}'s patients, order ID, or parameters...`}
          className="w-full text-xs text-slate-800 placeholder-slate-400 outline-none"
        />
      </div>

      {/* Doctor's Patients Report Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Order ID</th>
                <th className="py-3.5 px-4">Patient Information</th>
                <th className="py-3.5 px-4">Investigation & Result</th>
                <th className="py-3.5 px-4">Reference Range</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No referred patients found for {selectedDoctor.name} in this filter.
                  </td>
                </tr>
              ) : (
                filteredReports.map((order) => {
                  const isCritical = order.isCritical || (order.status && order.status.includes('critical'));
                  return (
                    <tr
                      key={order.orderId}
                      className={`hover:bg-slate-50/60 transition-colors ${
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
                          {order.age} yrs • {order.gender}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900 block">
                          {order.parameter}
                        </span>
                        <span className={`font-mono text-sm font-bold ${
                          isCritical ? 'text-rose-600' : 'text-slate-800'
                        }`}>
                          {order.result} {order.unit}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                        {order.referenceRange} {order.unit}
                      </td>

                      <td className="py-3.5 px-4">
                        {isCritical ? (
                          <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 font-bold px-2.5 py-0.5 rounded-full text-[11px] border border-rose-300">
                            🚨 Critical Alert
                          </span>
                        ) : order.status === 'Ready' ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-0.5 rounded-full text-[11px] border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Ready
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 font-medium px-2.5 py-0.5 rounded-full text-[11px] border border-slate-200">
                            <Clock className="w-3 h-3 text-slate-400" />
                            Processing
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setViewingReport(order)}
                          className="text-xs bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold px-3 py-1.5 rounded-xl border border-teal-200 flex items-center gap-1 ml-auto transition-colors cursor-pointer"
                        >
                          <span>Open Full Report</span>
                          <ArrowRight className="w-3.5 h-3.5 text-teal-600" />
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

      {/* Doctor's Clinical Report Modal (Never leaves Doctor Portal) */}
      {viewingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto border border-slate-100 p-6">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-200">
              <div>
                <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200 uppercase tracking-wider">
                  Doctor Clinical Preview • {selectedDoctor.name}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Referred Patient Report: {viewingReport.patientName} ({viewingReport.orderId || viewingReport.id})
                </h3>
              </div>
              <button
                onClick={() => setViewingReport(null)}
                className="text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                ✕ Close Report
              </button>
            </div>
            <LabReportViewer order={viewingReport} />
          </div>
        </div>
      )}
    </div>
  );
}
