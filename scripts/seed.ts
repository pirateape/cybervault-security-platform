// scripts/seed.ts
// Seed script for Supabase Auth and DB tables (local/CI/E2E)
// Usage: npx ts-node scripts/seed.ts
//
// Required dependencies:
//   npm install @supabase/supabase-js dotenv bcryptjs

// Load environment variables from .env
import * as dotenv from 'dotenv';
dotenv.config();

// Step 4: Initialize Supabase client with service role key and secure options
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    'Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your environment.'
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

// Step 5: Define deterministic test data (UUIDs, emails, passwords, etc.)
// These values should match those used in E2E/integration tests for consistency.

// Organization IDs (bigint)
const ORG_ID = 1001;
const ORG2_ID = 1002;

// User IDs (uuid)
const TESTUSER_ID = '00000000-0000-0000-0000-0000000000c1';
const NONADMIN_ID = '00000000-0000-0000-0000-0000000000c2';
const LASTADMIN_ID = '00000000-0000-0000-0000-0000000000c3';
const ORG2_ADMIN_ID = '00000000-0000-0000-0000-0000000001c1';
const ORG2_USER_ID = '00000000-0000-0000-0000-0000000001c2';

// Project IDs (bigint)
const PROJECT1_ID = 2001;
const PROJECT2_ID = 2002;

// Scan IDs (uuid)
const SCAN1_ID = '00000000-0000-0000-0000-00000000c001';
const ORG2_SCAN_ID = '00000000-0000-0000-0000-00000001c001';

// Result IDs (uuid)
const RESULT1_ID = '00000000-0000-0000-0000-00000000d001';
const ORG2_RESULT_ID = '00000000-0000-0000-0000-00000001d001';

// Audit Log IDs (bigint, will let DB auto-generate or use 3001, 3002 if needed)
const LOG1_ID = 3001;
const ORG2_LOG_ID = 3002;

// Target IDs (bigint)
const TARGET1_ID = 4001;
const ORG2_TARGET_ID = 4002;

// Test user emails and passwords
const TEST_USERS = [
  {
    id: TESTUSER_ID,
    org_id: ORG_ID,
    email: 'testuser@example.com',
    password: 'testpassword',
    full_name: 'Test Admin',
    role: 'admin',
    is_disabled: false,
  },
  {
    id: NONADMIN_ID,
    org_id: ORG_ID,
    email: 'nonadmin@example.com',
    password: 'testpassword',
    full_name: 'Non Admin',
    role: 'user',
    is_disabled: false,
  },
  {
    id: LASTADMIN_ID,
    org_id: ORG_ID,
    email: 'lastadmin@example.com',
    password: 'testpassword',
    full_name: 'Last Admin',
    role: 'admin',
    is_disabled: false,
  },
  {
    id: ORG2_ADMIN_ID,
    org_id: ORG2_ID,
    email: 'org2admin@example.com',
    password: 'org2password',
    full_name: 'Org2 Admin',
    role: 'admin',
    is_disabled: false,
  },
  {
    id: ORG2_USER_ID,
    org_id: ORG2_ID,
    email: 'org2user@example.com',
    password: 'org2password',
    full_name: 'Org2 User',
    role: 'user',
    is_disabled: false,
  },
  {
    id: '00000000-0000-0000-0000-0000000000c4',
    org_id: ORG_ID,
    email: 'testuser2@example.com',
    password: 'testpassword',
    full_name: 'Test User 2',
    role: 'user',
    is_disabled: false,
  },
  {
    id: '00000000-0000-0000-0000-0000000000c5',
    org_id: ORG_ID,
    email: 'regularuser@example.com',
    password: 'testpassword',
    full_name: 'Regular User',
    role: 'user',
    is_disabled: false,
  },
];

// Organizations (bigint id)
const ORGANIZATIONS = [
  { name: 'Org One', slug: 'org-one', plan_type: 'free' },
  { name: 'Org Two', slug: 'org-two', plan_type: 'pro' },
];

// Projects (bigint id, org_id bigint)
const PROJECTS = [
  { org_slug: 'org-one', name: 'Project One', description: 'First project' },
  { org_slug: 'org-two', name: 'Project Two', description: 'Second project' },
];

// Scans (uuid id, org_id bigint, user_id uuid)
const SCANS = [
  {
    id: SCAN1_ID,
    org_id: ORG_ID,
    user_id: TESTUSER_ID,
    scan_type: 'type',
    status: 'pending',
    target: 'target',
    metadata: {},
  },
  {
    id: ORG2_SCAN_ID,
    org_id: ORG2_ID,
    user_id: ORG2_ADMIN_ID,
    scan_type: 'type',
    status: 'pending',
    target: 'target',
    metadata: {},
  },
];

// Results (uuid id, org_id bigint, scan_id uuid, user_id uuid)
const RESULTS = [
  {
    id: RESULT1_ID,
    org_id: ORG_ID,
    scan_id: SCAN1_ID,
    user_id: TESTUSER_ID,
    finding: 'finding',
    severity: 'high',
    compliance_framework: 'NIST',
    details: {},
  },
  {
    id: ORG2_RESULT_ID,
    org_id: ORG2_ID,
    scan_id: ORG2_SCAN_ID,
    user_id: ORG2_ADMIN_ID,
    finding: 'finding',
    severity: 'high',
    compliance_framework: 'NIST',
    details: {},
  },
];

// Audit logs (bigint org_id, uuid user_id, text action, bigint target_id, text target_table, jsonb details)
const AUDIT_LOGS = [
  {
    org_id: ORG_ID,
    user_id: TESTUSER_ID,
    action: 'login',
    target_id: TARGET1_ID,
    target_table: 'users',
    details: {},
  },
  {
    org_id: ORG2_ID,
    user_id: ORG2_ADMIN_ID,
    action: 'login',
    target_id: ORG2_TARGET_ID,
    target_table: 'users',
    details: {},
  },
];

// Profiles (uuid id, username unique, full_name, org_id bigint)
const PROFILES = [
  {
    id: TESTUSER_ID,
    username: 'testuser',
    full_name: 'Test Admin',
    bio: 'Seeded admin',
  },
  {
    id: NONADMIN_ID,
    username: 'nonadmin',
    full_name: 'Non Admin',
    bio: 'Seeded user',
  },
  {
    id: LASTADMIN_ID,
    username: 'lastadmin',
    full_name: 'Last Admin',
    bio: 'Seeded admin',
  },
  {
    id: ORG2_ADMIN_ID,
    username: 'org2admin',
    full_name: 'Org2 Admin',
    bio: 'Seeded admin',
  },
  {
    id: ORG2_USER_ID,
    username: 'org2user',
    full_name: 'Org2 User',
    bio: 'Seeded user',
  },
];

// Org members (bigint id auto, org_id bigint, user_id uuid, role)
const ORG_MEMBERS = [
  { org_id: ORG_ID, user_id: TESTUSER_ID, role: 'owner' },
  { org_id: ORG_ID, user_id: NONADMIN_ID, role: 'member' },
  { org_id: ORG_ID, user_id: LASTADMIN_ID, role: 'admin' },
  { org_id: ORG2_ID, user_id: ORG2_ADMIN_ID, role: 'owner' },
  { org_id: ORG2_ID, user_id: ORG2_USER_ID, role: 'member' },
];

// Step 6: Seed Supabase Auth users
import type { User } from '@supabase/supabase-js';

async function seedAuthUsers() {
  console.log('Seeding Supabase Auth users...');
  // List all existing users (may need to paginate for large sets)
  const { data: userList, error: listError } =
    await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Error listing users:', listError.message);
    process.exit(1);
  }
  const existingEmails = new Set(
    (userList?.users || []).map((u: any) => u.email)
  );

  for (const user of TEST_USERS) {
    if (existingEmails.has(user.email)) {
      console.log(`Auth user ${user.email} already exists.`);
      continue;
    }
    // Create user with email_confirm: true
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
    });
    if (error) {
      console.error(`Error creating Auth user ${user.email}:`, error.message);
    } else {
      console.log(`Created Auth user: ${user.email}`);
    }
  }
}

// Step 7: Hash passwords for DB users using bcryptjs
import * as bcrypt from 'bcryptjs';

async function hashUserPasswords(users: typeof TEST_USERS) {
  console.log('Hashing user passwords for DB...');
  const usersWithHashes: any[] = [];
  for (const user of users) {
    const password_hash = await bcrypt.hash(user.password, 10);
    usersWithHashes.push({ ...user, password_hash });
  }
  return usersWithHashes;
}

// Step 8: Upsert users into the users table
async function upsertDbUsers(usersWithHashes: any[]) {
  console.log('Upserting users into the users table...');
  for (const user of usersWithHashes) {
    // Remove plaintext password before upsert
    const { password, ...userRecord } = user;
    const { data, error } = await supabase
      .from('users')
      .upsert(userRecord)
      .select();
    if (error) {
      console.error(`Error upserting DB user ${user.email}:`, error.message);
    } else {
      console.log(`Upserted DB user: ${user.email}`);
    }
  }
}

// Step 9: Upsert records into scans, results, and audit_logs tables

function getIdTypes(record: any) {
  const idFields = Object.keys(record).filter(
    (k) => k.endsWith('id') || k === 'id' || k === 'user_id' || k === 'org_id'
  );
  return idFields
    .map((k) => `${k}: ${record[k]} (${typeof record[k]})`)
    .join(', ');
}

// Supabase JS v2 does not support .onConflict; upsert uses PK/unique constraints by default
async function upsertTable(table: string, records: any[]) {
  console.log(`Upserting records into ${table}...`);
  for (const record of records) {
    try {
      const { data, error } = await supabase
        .from(table)
        .upsert(record)
        .select();
      if (error) {
        const recId = record.id ?? record.user_id ?? record.org_id ?? 'unknown';
        console.error(
          `Error upserting ${table} record (id: ${recId}):`,
          error.message
        );
        console.error('  Offending record:', JSON.stringify(record));
        console.error('  ID/foreign key types:', getIdTypes(record));
      } else {
        const recId = record.id ?? record.user_id ?? record.org_id ?? 'unknown';
        console.log(`Upserted ${table} record (id: ${recId})`);
      }
    } catch (err) {
      const recId = record.id ?? record.user_id ?? record.org_id ?? 'unknown';
      console.error(`Exception upserting ${table} record (id: ${recId}):`, err);
      console.error('  Offending record:', JSON.stringify(record));
      console.error('  ID/foreign key types:', getIdTypes(record));
    }
  }
}

// After seeding Auth users, fetch all users from auth.users and build an email-to-UUID map
async function getUserEmailToIdMap() {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Error fetching users from auth.users:', error.message);
    process.exit(1);
  }
  const emailToId = {};
  for (const user of data.users) {
    emailToId[user.email] = user.id;
  }
  return emailToId;
}

// Main entry point
async function main() {
  // Insert organizations and capture generated IDs
  const { data: orgRows, error: orgError } = await supabase
    .from('organizations')
    .insert(ORGANIZATIONS)
    .select();
  if (orgError) {
    console.error('Error inserting organizations:', orgError.message);
    process.exit(1);
  }
  const orgSlugToId = {};
  for (const org of orgRows) {
    orgSlugToId[org.slug] = org.id;
  }

  // Seed Auth users
  await seedAuthUsers();
  // Fetch real user UUIDs from auth.users
  const emailToId = await getUserEmailToIdMap();

  // Upsert profiles using real UUIDs
  const PROFILES = [
    {
      id: emailToId['testuser@example.com'],
      username: 'testuser',
      full_name: 'Test Admin',
      bio: 'Seeded admin',
    },
    {
      id: emailToId['nonadmin@example.com'],
      username: 'nonadmin',
      full_name: 'Non Admin',
      bio: 'Seeded user',
    },
    {
      id: emailToId['lastadmin@example.com'],
      username: 'lastadmin',
      full_name: 'Last Admin',
      bio: 'Seeded admin',
    },
    {
      id: emailToId['org2admin@example.com'],
      username: 'org2admin',
      full_name: 'Org2 Admin',
      bio: 'Seeded admin',
    },
    {
      id: emailToId['org2user@example.com'],
      username: 'org2user',
      full_name: 'Org2 User',
      bio: 'Seeded user',
    },
    {
      id: emailToId['testuser2@example.com'],
      username: 'testuser2',
      full_name: 'Test User 2',
      bio: 'Seeded user',
    },
    {
      id: emailToId['regularuser@example.com'],
      username: 'regularuser',
      full_name: 'Regular User',
      bio: 'Seeded user',
    },
  ];
  await upsertTable('profiles', PROFILES);

  // Prepare and upsert org_members using real UUIDs
  const ORG_MEMBERS = [
    {
      org_id: orgSlugToId['org-one'],
      user_id: emailToId['testuser@example.com'],
      role: 'owner',
    },
    {
      org_id: orgSlugToId['org-one'],
      user_id: emailToId['nonadmin@example.com'],
      role: 'member',
    },
    {
      org_id: orgSlugToId['org-one'],
      user_id: emailToId['lastadmin@example.com'],
      role: 'admin',
    },
    {
      org_id: orgSlugToId['org-two'],
      user_id: emailToId['org2admin@example.com'],
      role: 'owner',
    },
    {
      org_id: orgSlugToId['org-two'],
      user_id: emailToId['org2user@example.com'],
      role: 'member',
    },
  ];
  await upsertTable('org_members', ORG_MEMBERS);

  // Prepare and insert projects using captured org IDs
  const PROJECTS_WITH_IDS = PROJECTS.map((p) => ({
    org_id: orgSlugToId[p.org_slug],
    name: p.name,
    description: p.description,
  }));
  const { data: projectRows, error: projectError } = await supabase
    .from('projects')
    .insert(PROJECTS_WITH_IDS)
    .select();
  if (projectError) {
    console.error('Error inserting projects:', projectError.message);
    process.exit(1);
  }
  // Map project names to generated IDs if needed for child records
  const projectNameToId: Record<string, number> = {};
  for (const project of projectRows) {
    projectNameToId[project.name] = project.id;
  }

  // Prepare and upsert scans using real UUIDs
  const SCANS = [
    {
      id: SCAN1_ID,
      org_id: orgSlugToId['org-one'],
      user_id: emailToId['testuser@example.com'],
      scan_type: 'type',
      status: 'pending',
      target: 'target',
      metadata: {},
    },
    {
      id: ORG2_SCAN_ID,
      org_id: orgSlugToId['org-two'],
      user_id: emailToId['org2admin@example.com'],
      scan_type: 'type',
      status: 'pending',
      target: 'target',
      metadata: {},
    },
  ];
  await upsertTable('scans', SCANS);

  // Prepare and upsert results using real UUIDs
  const RESULTS = [
    {
      id: RESULT1_ID,
      org_id: orgSlugToId['org-one'],
      scan_id: SCAN1_ID,
      user_id: emailToId['testuser@example.com'],
      finding: 'finding',
      severity: 'high',
      compliance_framework: 'NIST',
      details: {},
    },
    {
      id: ORG2_RESULT_ID,
      org_id: orgSlugToId['org-two'],
      scan_id: ORG2_SCAN_ID,
      user_id: emailToId['org2admin@example.com'],
      finding: 'finding',
      severity: 'high',
      compliance_framework: 'NIST',
      details: {},
    },
  ];
  await upsertTable('results', RESULTS);

  // Prepare and upsert audit_logs using real UUIDs
  const AUDIT_LOGS = [
    {
      org_id: orgSlugToId['org-one'],
      user_id: emailToId['testuser@example.com'],
      action: 'login',
      target_id: projectNameToId['Project One'],
      target_table: 'projects',
      details: {},
    },
    {
      org_id: orgSlugToId['org-two'],
      user_id: emailToId['org2admin@example.com'],
      action: 'login',
      target_id: projectNameToId['Project Two'],
      target_table: 'projects',
      details: {},
    },
  ];
  await upsertTable('audit_logs', AUDIT_LOGS);

  // Print summary
  console.log('\nSeeded users:');
  for (const user of TEST_USERS) {
    console.log(`  ${user.email} (${user.role}) / ${user.password}`);
  }
  console.log('\nSeeded organizations:', Object.values(orgSlugToId).join(', '));
  console.log('Seeded profiles:', PROFILES.map((p) => p.username).join(', '));
  console.log(
    'Seeded org members:',
    ORG_MEMBERS.map((m) => `${m.user_id}@${m.org_id}`).join(', ')
  );
  console.log('Seeded projects:', Object.values(projectNameToId).join(', '));
  console.log('Seeded scans:', SCANS.map((s) => s.id).join(', '));
  console.log('Seeded results:', RESULTS.map((r) => r.id).join(', '));
  console.log(
    'Seeded audit logs:',
    AUDIT_LOGS.map((a) => `user_id: ${a.user_id}, org_id: ${a.org_id}`).join(
      ' | '
    )
  );
  console.log('\nSeeding complete.');
}

main().catch((err) => {
  console.error('Seed script failed:', err);
  process.exit(1);
});
