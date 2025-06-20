import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { RuleSchema } from 'libs/types/src/rule';
import { z } from 'zod';

// TODO: Replace with real env vars or config
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Mock data for when Supabase is not available
const mockRules = [
  {
    id: '1',
    name: 'Password Policy Rule',
    description: 'Ensures strong password requirements',
    framework: 'NIST',
    severity: 'high',
    code: JSON.stringify({
      conditions: {
        all: [
          {
            fact: 'password',
            operator: 'length',
            value: 8,
            path: '$.length'
          }
        ]
      },
      event: {
        type: 'password-policy-violation',
        params: { message: 'Password must be at least 8 characters' }
      }
    }, null, 2),
    language: 'json',
    conditions: {
      all: [
        {
          fact: 'password',
          operator: 'length',
          value: 8,
          path: '$.length'
        }
      ]
    },
    event: {
      type: 'password-policy-violation',
      params: { message: 'Password must be at least 8 characters' }
    },
    is_active: true,
    org_id: 'test-org-uuid',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Multi-Factor Authentication Rule',
    description: 'Requires MFA for admin accounts',
    framework: 'SOX',
    severity: 'critical',
    code: JSON.stringify({
      conditions: {
        all: [
          {
            fact: 'user',
            operator: 'equal',
            value: 'admin',
            path: '$.role'
          },
          {
            fact: 'mfa',
            operator: 'equal',
            value: false,
            path: '$.enabled'
          }
        ]
      },
      event: {
        type: 'mfa-required',
        params: { message: 'MFA is required for admin accounts' }
      }
    }, null, 2),
    language: 'json',
    conditions: {
      all: [
        {
          fact: 'user',
          operator: 'equal',
          value: 'admin',
          path: '$.role'
        },
        {
          fact: 'mfa',
          operator: 'equal',
          value: false,
          path: '$.enabled'
        }
      ]
    },
    event: {
      type: 'mfa-required',
      params: { message: 'MFA is required for admin accounts' }
    },
    is_active: true,
    org_id: 'test-org-uuid',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  // Additional rules for org-123
  {
    id: '3',
    name: 'Data Encryption Rule',
    description: 'Ensures data is encrypted at rest',
    framework: 'GDPR',
    severity: 'high',
    code: JSON.stringify({
      conditions: {
        all: [
          {
            fact: 'data',
            operator: 'equal',
            value: false,
            path: '$.encrypted'
          }
        ]
      },
      event: {
        type: 'encryption-required',
        params: { message: 'Data must be encrypted at rest' }
      }
    }, null, 2),
    language: 'json',
    conditions: {
      all: [
        {
          fact: 'data',
          operator: 'equal',
          value: false,
          path: '$.encrypted'
        }
      ]
    },
    event: {
      type: 'encryption-required',
      params: { message: 'Data must be encrypted at rest' }
    },
    is_active: true,
    org_id: 'org-123',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// TODO: Integrate with real session/user context and RBAC
const getUserRole = async (req: NextRequest) => 'admin'; // stub

export async function GET(req: NextRequest) {
  try {
    const orgId = req.nextUrl.searchParams.get('org_id');
    if (!orgId)
      return NextResponse.json({ error: 'Missing org_id' }, { status: 400 });
    
    // If Supabase is not available, return mock data
    if (!supabase) {
      console.log('Supabase not configured, returning mock rules data');
      const filteredMockRules = mockRules.filter(rule => rule.org_id === orgId);
      return NextResponse.json(filteredMockRules);
    }
    
    // TODO: RBAC check
    const { data, error } = await supabase
      .from('rules')
      .select('*')
      .eq('org_id', orgId);
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Rules API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const orgId = req.nextUrl.searchParams.get('org_id');
    if (!orgId)
      return NextResponse.json({ error: 'Missing org_id' }, { status: 400 });
    const role = await getUserRole(req);
    if (role !== 'admin' && role !== 'auditor')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const body = await req.json();
    const parse = RuleSchema.safeParse({ ...body, org_id: orgId });
    if (!parse.success)
      return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
    
    // If Supabase is not available, return mock response
    if (!supabase) {
      console.log('Supabase not configured, returning mock create response');
      const newRule = {
        ...parse.data,
        id: `mock-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      return NextResponse.json(newRule);
    }
    
    // TODO: Audit logging
    const { data, error } = await supabase
      .from('rules')
      .insert([{ ...parse.data }])
      .select()
      .single();
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Rules POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const orgId = req.nextUrl.searchParams.get('org_id');
    const ruleId = req.nextUrl.searchParams.get('rule_id');
    if (!orgId || !ruleId)
      return NextResponse.json(
        { error: 'Missing org_id or rule_id' },
        { status: 400 }
      );
    const role = await getUserRole(req);
    if (role !== 'admin' && role !== 'auditor')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const body = await req.json();
    const parse = RuleSchema.safeParse({ ...body, org_id: orgId });
    if (!parse.success)
      return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
    
    // If Supabase is not available, return mock response
    if (!supabase) {
      console.log('Supabase not configured, returning mock update response');
      const updatedRule = {
        ...parse.data,
        id: ruleId,
        updated_at: new Date().toISOString()
      };
      return NextResponse.json(updatedRule);
    }
    
    // TODO: Audit logging, versioning
    const { data, error } = await supabase
      .from('rules')
      .update({ ...parse.data })
      .eq('id', ruleId)
      .eq('org_id', orgId)
      .select()
      .single();
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Rules PUT error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const orgId = req.nextUrl.searchParams.get('org_id');
    const ruleId = req.nextUrl.searchParams.get('rule_id');
    if (!orgId || !ruleId)
      return NextResponse.json(
        { error: 'Missing org_id or rule_id' },
        { status: 400 }
      );
    const role = await getUserRole(req);
    if (role !== 'admin')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    
    // If Supabase is not available, return mock response
    if (!supabase) {
      console.log('Supabase not configured, returning mock delete response');
      return NextResponse.json({ success: true });
    }
    
    // TODO: Audit logging
    const { error } = await supabase
      .from('rules')
      .delete()
      .eq('id', ruleId)
      .eq('org_id', orgId);
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Rules DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
