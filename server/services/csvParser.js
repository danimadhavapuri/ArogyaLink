/**
 * Lightweight, zero-dependency CSV parser for Lab Information System (LIS) exports
 */
export const parseLISCSV = (csvText) => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV file is empty or missing data rows');
  }

  // Read header row
  const headers = lines[0].split(',').map((h) => h.trim());
  const orders = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',').map((v) => v.trim());
    const row = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || null;
    });

    // Validate required fields
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
      unit: row.unit || '',
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