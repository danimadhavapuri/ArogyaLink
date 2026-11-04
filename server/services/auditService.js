import { addAuditLog, getAuditLogs } from '../data/store.js';

/**
 * Logs every report access event for DPDP Act 2023 compliance
 */
export const recordAccessLog = ({ orderId, patientName, patientPhone, accessMethod, ipAddress, userAgent }) => {
  const logEntry = {
    orderId,
    patientName,
    // Mask phone for privacy in logs (e.g. +91 98765 *****)
    maskedPhone: patientPhone ? patientPhone.replace(/\d{5}$/, '*****') : 'Unknown',
    accessMethod: accessMethod || 'Mobile OTP',
    ipAddress: ipAddress || '127.0.0.1 (Local)',
    userAgent: userAgent || 'Mobile Web Browser',
    status: 'Authorized Access',
    complianceStandard: 'DPDP Act 2023 (Digital Personal Data Protection)'
  };

  return addAuditLog(logEntry);
};

export const fetchAllAuditLogs = () => {
  return getAuditLogs();
};