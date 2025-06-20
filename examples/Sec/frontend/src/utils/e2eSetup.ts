import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';

/**
 * Comprehensive E2E test setup utility
 * Ensures all prerequisites are met before running Playwright tests
 */
export async function setupE2EEnvironment(): Promise<void> {
  console.log('🔧 Setting up E2E test environment...');

  // 1. Ensure test-results directory exists
  const testResultsDir = path.join(process.cwd(), 'test-results');
  if (!existsSync(testResultsDir)) {
    mkdirSync(testResultsDir, { recursive: true });
    console.log('✅ Created test-results directory');
  }

  // 2. Ensure Playwright browsers are installed
  try {
    execSync('npx playwright install', { stdio: 'inherit' });
    console.log('✅ Playwright browsers installed');
  } catch (error) {
    console.error('❌ Failed to install Playwright browsers:', error);
    throw error;
  }

  // 3. Check if backend is running (optional check)
  try {
    const response = await fetch('http://localhost:8000/health');
    if (response.ok) {
      console.log('✅ Backend is running');
    } else {
      console.warn('⚠️ Backend health check failed - tests may fail');
    }
  } catch {
    console.warn(
      "⚠️ Backend not accessible - ensure it's running for E2E tests"
    );
  }

  // 4. Seed test database (if script exists)
  try {
    execSync('python tests/integration/seed_test_db_rest.py', {
      stdio: 'inherit',
      cwd: path.join(process.cwd(), '..'),
    });
    console.log('✅ Test database seeded');
  } catch (error) {
    console.warn(
      '⚠️ Failed to seed test database - some tests may fail:',
      error
    );
  }

  console.log('🎉 E2E environment setup complete!');
}

// Run setup if called directly
if (require.main === module) {
  setupE2EEnvironment().catch(console.error);
}
