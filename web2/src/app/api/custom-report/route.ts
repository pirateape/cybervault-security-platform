import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from 'libs/data-access/createSupabaseServerClient';
import { generateCSV, generatePDF, generateExcel } from 'libs/utils/export-utils';

// TODO: Integrate with Supabase and RBAC/session logic

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (!user || userError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch user role from Supabase (profiles or user_roles table)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profileError) {
    return NextResponse.json({ error: 'Failed to fetch user role' }, { status: 500 });
  }
  const role = profile?.role;
  if (role !== 'admin' && role !== 'auditor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const filters = body.filters || {};
  const format = body.format || 'json';

  // Fetch data from Supabase using reporting views/RPCs and filters
  const { data, error } = await supabase
    .from('custom_report_view')
    .select('*')
    .match(filters);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (format === 'json') {
    return NextResponse.json(data);
  }

  let fileBuffer: Buffer;
  let contentType = 'text/csv';
  const fileName = `custom-report.${format}`;

  try {
    if (format === 'csv') {
      fileBuffer = await generateCSV(data || []);
      contentType = 'text/csv';
    } else if (format === 'pdf') {
      fileBuffer = await generatePDF(data || []);
      contentType = 'application/pdf';
    } else if (format === 'excel') {
      fileBuffer = await generateExcel(data || []);
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else {
      return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
    }
  } catch (exportError: any) {
    return NextResponse.json({ error: exportError.message }, { status: 500 });
  }

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  });
}
