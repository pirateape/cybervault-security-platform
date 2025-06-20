import { promises as fs } from 'fs';
import * as path from 'path';

const testResultsDir = path.join(__dirname, '../../test-results');

async function ensureTestResultsDir() {
  try {
    await fs.mkdir(testResultsDir, { recursive: true });
    // Optionally, clean up old results here if desired
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to create test-results directory:', err);
    process.exit(1);
  }
}

ensureTestResultsDir();
