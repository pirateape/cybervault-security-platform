/**
 * Minimal integration test: Fetch Microsoft Graph token and upsert to Supabase
 *
 * Required environment variables:
 * - CLIENT_ID, CLIENT_SECRET, TENANT_ID (for MSAL)
 * - SUPABASE_URL, SUPABASE_ANON_KEY (for Supabase backend access)
 */
import 'dotenv/config';
import { fetchGraphData } from '../libs/data-access/graphClient.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zkapyrvkdidxglpwctfk.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  try {
    // 1. Fetch users from Microsoft Graph API
    const usersResponse = await fetchGraphData('/users');
    const users = usersResponse.value;
    if (!users || users.length === 0) {
      console.log('No users returned from Microsoft Graph.');
      process.exit(0);
    }
    const user = users[0];
    console.log('Fetched user:', user);

    // 2. Map user to ms_graph_users table
    const msGraphUser = {
      id: user.id, // UUID from Graph
      display_name: user.displayName,
      user_principal_name: user.userPrincipalName,
      given_name: user.givenName,
      surname: user.surname,
      mail: user.mail,
      job_title: user.jobTitle,
      mobile_phone: user.mobilePhone,
      office_location: user.officeLocation,
      preferred_language: user.preferredLanguage,
    };
    console.log('Inserting ms_graph_user into Supabase:', msGraphUser);
    const { data, error } = await supabase
      .from('ms_graph_users')
      .upsert(msGraphUser, { onConflict: 'id' })
      .select();
    if (error) {
      console.error('Insert error:', error);
      throw error;
    }
    console.log('Inserted ms_graph_user:', data);
    process.exit(0);
  } catch (err) {
    console.error('Integration test failed:', err);
    process.exit(1);
  }
}

main();
