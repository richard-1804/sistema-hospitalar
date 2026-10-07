// Valores fixos e regras do hospital, centralizados para não repetir "números mágicos" no código.

// UFs válidas para o CRM
export const VALID_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export const TRIAGE_STATUS = Object.freeze({
  WAITING: 'WAITING',         // na fila, aguardando atendimento
  IN_PROGRESS: 'IN_PROGRESS', // médico chamou o paciente
  FINISHED: 'FINISHED'        // atendimento concluído
});

// Protocolo de Manchester: rank menor = mais urgente; slaMinutes = tempo máximo de espera
export const PRIORITY = Object.freeze({
  RED:    { name: 'RED',    label: 'Emergência',     rank: 1, slaMinutes: 0 },
  ORANGE: { name: 'ORANGE', label: 'Muito urgente',  rank: 2, slaMinutes: 10 },
  YELLOW: { name: 'YELLOW', label: 'Urgente',        rank: 3, slaMinutes: 60 },
  GREEN:  { name: 'GREEN',  label: 'Pouco urgente',  rank: 4, slaMinutes: 120 },
  BLUE:   { name: 'BLUE',   label: 'Não urgente',    rank: 5, slaMinutes: 240 }
});

// Duração máxima de um plantão, em horas
export const MAX_SHIFT_HOURS = 24;
