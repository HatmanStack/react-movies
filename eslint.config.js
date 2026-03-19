const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  { ignores: ['node_modules/', 'dist/', '.expo/', 'coverage/', 'android/', 'ios/', 'web-build/'] },
  ...expoConfig.map(config => {
    if (config.rules && config.rules['react-hooks/immutability']) {
      const { 'react-hooks/immutability': _, ...rest } = config.rules;
      return { ...config, rules: rest };
    }
    return config;
  }),
  {
    files: ['**/*.test.{ts,tsx,js,jsx}', '**/jest.setup.js', '**/__tests__/**'],
    languageOptions: {
      globals: {
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
    rules: {
      'react/display-name': 'off',
    },
  },
];
