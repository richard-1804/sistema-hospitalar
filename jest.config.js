// Jest com ES Modules. `transform: {}` desliga o Babel (o Node já entende ESM).
// Os scripts do package.json já rodam com a flag --experimental-vm-modules.
export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['**/tests/**/*.test.js'],
  clearMocks: true,

  // Cobertura medida na pasta de serviços (onde ficam as regras de negócio)
  collectCoverageFrom: ['src/services/**/*.js'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],

  // Exigência da atividade: mínimo de 80%
  coverageThreshold: {
    global: { statements: 80, branches: 80, functions: 80, lines: 80 },
  },
};
