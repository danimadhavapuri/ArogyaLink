/**
 * Robust, lightweight CSV parser for Lab Information System (LIS) exports.
 * Automatically normalizes common column headers (e.g. "Order ID", "Patient", "Referring Doctor").
 */
export const parseLISCSV = (csvText) => {
  if (!csvText || typeof csvText !== 'string') {
    throw new Error('CSV input must be a non-empty string');
  }

  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) {
    throw new Error('CSV file is empty or missing data rows');
  }

  // Helper to normalize column headers
  const normalizeHeaderKey = (raw) => {
    const clean = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (clean === 'orderid' || clean === 'order') return 'orderId';
    if (clean === 'patient' || clean === 'patientname' || clean === 'name') return 'patientName';
    if (clean === 'phone' || clean === 'patientphone' || clean === 'mobile') return 'patientPhone';
    if (clean === 'age') return 'age';
    if (clean === 'gender' || clean === 'sex') return 'gender';
    if (clean === 'testname' || clean === 'test') return 'testName';
    if (clean === 'parameter' || clean === 'investigation') return 'parameter';
    if (clean === 'result' || clean === 'value') return 'result';
    if (clean === 'unit') return 'unit';
    if (clean === 'referencerange' || clean === 'ref' || clean === 'range') return 'referenceRange';
    if (clean === 'status') return 'status';
    if (clean === 'referringdoctor' || clean === 'doctor') return 'referringDoctor';
    if (clean === 'collectioncentre' || clean === 'collectioncenter' || clean === 'centre') return 'collectionCentre';
    return clean;
  };

  const rawHeaders = lines[0].split(',').map((h) => h.trim());
  const normalizedHeaders = rawHeaders.map(normalizeHeaderKey);
  const orders = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',').map((v) => v.trim());
    const row = {};

    normalizedHeaders.forEach((header, index) => {
      row[header] = values[index] || null;
    });

    if (!row.orderId || !row.patientName) continue;

    const isCritical =
      (row.status && row.status.toLowerCase().includes('critical')) ||
      (row.parameter === 'Potassium' && parseFloat(row.result) >= 6.0);

    orders.push({
      orderId: row.orderId,
      patientName: row.patientName,
      patientPhone: row.patientPhone || '+91 99999 00000',
      age: parseInt(row.age, 10) || 45,
      gender: row.gender || 'Not Specified',
      testName: row.testName || 'Diagnostic Panel',
      parameter: row.parameter || 'Clinical Value',
      result: parseFloat(row.result) || row.result,
      unit: row.unit || (row.parameter === 'Haemoglobin' ? 'g/dL' : row.parameter === 'Glucose' ? 'mg/dL' : ''),
      referenceRange: row.referenceRange || '',
      status: row.status || 'Ready',
      isCritical: Boolean(isCritical),
      referringDoctor: row.referringDoctor || 'Attending Physician',
      doctorSpecialty: row.doctorSpecialty || 'General Medicine, Vijayawada',
      collectionCentre: row.collectionCentre || 'Main Lab, Vijayawada',
      createdAt: new Date().toISOString(),
      signedAt: row.status === 'Ready' || isCritical ? new Date().toISOString() : null
    });
  }

  return orders;
};
