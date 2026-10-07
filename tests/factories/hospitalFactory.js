// Gerador de dados de Médicos
export const createDoctorData = (overrides = {}) => ({
  id: 1,
  name: 'Dra. Ana Silva',
  crm: '123456',
  uf: 'SP',
  specialty: 'Pediatria',
  phone: '11999999999',
  email: 'ana.silva@hospital.com',
  ...overrides,
});

// Gerador de dados de Plantões
export const createShiftData = (overrides = {}) => ({
  id: 100,
  doctorId: 1,
  startTime: '2026-10-07T07:00:00.000Z',
  endTime: '2026-10-07T19:00:00.000Z',
  ...overrides,
});

// Gerador de dados de Triagem
export const createTriageData = (overrides = {}) => ({
  id: 50,
  patientId: 10,
  symptoms: 'Dor no peito intensa e falta de ar',
  vitalSigns: { 
    temperature: 36.5, 
    heartRate: 110, 
    bloodPressure: '14/9',
    oxygenSaturation: 95
  },
  ...overrides,
});