export const CHART_COLORS = {
  pulse: '#5DD62C',
  forest: '#337418',
  pulseLight: '#8FE65C',
  azure: '#123499',
  ocean: '#0a2472',
  mist: '#5eaf73',
  ink: '#0F0F0F',
  paper: '#F8F8F8',
  warning: '#F39C12',
  danger: '#E74C3C',
} as const;

export const CATEGORY_COLORS: Record<string, string> = {
  employee: '#5DD62C',
  investment: '#5eaf73',
  software: '#123499',
  rent: '#0a2472',
  taxes: '#F39C12',
  marketing: '#8FE65C',
  services: '#337418',
  other: '#94a3b8',
};

export const CATEGORY_LABELS: Record<string, string> = {
  employee: 'Funcionário',
  investment: 'Investimento',
  software: 'Software',
  rent: 'Aluguel/Infra',
  taxes: 'Impostos',
  marketing: 'Marketing',
  services: 'Serviços',
  other: 'Outro',
};
