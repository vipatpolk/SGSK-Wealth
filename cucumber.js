const path = require('path');

process.env.TS_NODE_PROJECT = path.resolve(__dirname, 'tsconfig.e2e.json');

module.exports = {
  default: {
    requireModule: ['ts-node/register'],
    format: ['@serenity-js/cucumber'],
    formatOptions: {
      specDirectory: 'e2e/features',
    },
    require: [
      'e2e/support/**/*.ts',
      'e2e/step_definitions/**/*.steps.ts',
    ],
    paths: [
      'e2e/features/**/*.feature',
    ],
  },
};
