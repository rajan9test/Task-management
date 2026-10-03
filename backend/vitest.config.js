import { defineConfig } from 'vitest/config';
import { loadTestEnv } from './tests/loadTestEnv.js';

export default defineConfig({
  test: {
    env: loadTestEnv(),
    globalSetup: './tests/globalSetup.js',
    // All test files share one database, so run them one at a time.
    fileParallelism: false,
    testTimeout: 15000,
  },
});
