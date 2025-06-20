import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@data-access/createSupabaseServerClient';
import { generateCSV, generatePDF, generateExcel } from '../../../../../libs/utils/export-utils';
import { 
  getComplianceExportData, 
  formatComplianceDataForExport,
  type ComplianceExportData 
} from '@data-access/graphComplianceApi';

export async function GET(req: NextRequest) {
  try {
    // Authentication and authorization
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    
    if (!user || userError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user role and organization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, org_id')
      .eq('id', user.id)
      .single();
      
    if (profileError) {
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
    }

    const { role, org_id: organizationId } = profile;
    
    // Authorization check - only admin and auditor roles can export compliance reports
    if (!['admin', 'auditor', 'compliance_officer'].includes(role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Parse request parameters
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'pdf';
    const reportType = searchParams.get('type') || 'comprehensive';
    const includeCharts = searchParams.get('includeCharts') === 'true';
    const emailRecipients = searchParams.get('emailRecipients');
    
    // Validate format
    if (!['csv', 'pdf', 'excel'].includes(format)) {
      return NextResponse.json({ error: 'Unsupported format. Use csv, pdf, or excel' }, { status: 400 });
    }

    // Fetch compliance data
    let complianceData: ComplianceExportData;
    try {
      complianceData = await getComplianceExportData(organizationId, reportType);
    } catch (error: any) {
      console.error('Error fetching compliance data:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch compliance data', 
        details: error.message 
      }, { status: 500 });
    }

    // Format data for export
    const formattedData = formatComplianceDataForExport(complianceData, format as 'csv' | 'excel' | 'pdf');
    
    // Generate file based on format
    let fileBuffer: Buffer;
    let contentType: string;
    let fileExtension: string;
    
    try {
      switch (format) {
        case 'csv':
          fileBuffer = await generateCSV(formattedData);
          contentType = 'text/csv';
          fileExtension = 'csv';
          break;
          
        case 'excel':
          fileBuffer = await generateExcel(formattedData);
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          fileExtension = 'xlsx';
          break;
          
        case 'pdf':
          fileBuffer = await generatePDF(formattedData);
          contentType = 'application/pdf';
          fileExtension = 'pdf';
          break;
          
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
    } catch (exportError: any) {
      console.error('Error generating export file:', exportError);
      return NextResponse.json({ 
        error: 'Failed to generate export file', 
        details: exportError.message 
      }, { status: 500 });
    }

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `compliance-report-${reportType}-${timestamp}.${fileExtension}`;

    // If email recipients are specified, send via email
    if (emailRecipients) {
      try {
        await sendComplianceReportEmail(
          emailRecipients.split(',').map(email => email.trim()),
          fileName,
          fileBuffer,
          contentType,
          complianceData
        );
        
        return NextResponse.json({ 
          message: 'Compliance report sent successfully',
          recipients: emailRecipients.split(',').map(email => email.trim()),
          fileName,
          reportType,
          format
        });
      } catch (emailError: any) {
        console.error('Error sending email:', emailError);
        return NextResponse.json({ 
          error: 'Failed to send email', 
          details: emailError.message 
        }, { status: 500 });
      }
    }

    // Log the export activity
    try {
      await supabase
        .from('audit_logs')
        .insert({
          user_id: user.id,
          org_id: organizationId,
          action: 'compliance_report_export',
          resource_type: 'compliance_report',
          resource_id: `${reportType}-${format}`,
          details: {
            format,
            reportType,
            fileName,
            dataPoints: {
              mfaUsers: complianceData.mfaStatus.length,
              inactiveUsers: complianceData.inactiveUsers.length,
              policies: complianceData.conditionalAccessPolicies.length,
              encryptionPolicies: complianceData.encryptionPolicies.length
            }
          },
          timestamp: new Date().toISOString()
        });
    } catch (auditError) {
      console.error('Error logging audit event:', auditError);
      // Don't fail the request for audit logging errors
    }

    // Return the file
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    });

  } catch (error: any) {
    console.error('Unexpected error in compliance export:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Authentication
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    
    if (!user || userError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body for scheduled report setup
    const body = await req.json();
    const { 
      reportType = 'comprehensive',
      format = 'pdf',
      schedule = 'weekly',
      emailRecipients = [],
      includeCharts = true,
      customFilters = {}
    } = body;

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, org_id')
      .eq('id', user.id)
      .single();
      
    if (profileError) {
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
    }

    const { role, org_id: organizationId } = profile;
    
    // Authorization check
    if (!['admin', 'auditor', 'compliance_officer'].includes(role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Validate schedule
    const validSchedules = ['daily', 'weekly', 'monthly', 'quarterly'];
    if (!validSchedules.includes(schedule)) {
      return NextResponse.json({ 
        error: 'Invalid schedule. Use: daily, weekly, monthly, or quarterly' 
      }, { status: 400 });
    }

    // Create scheduled report entry
    const { data: scheduledReport, error: scheduleError } = await supabase
      .from('scheduled_reports')
      .insert({
        org_id: organizationId,
        created_by: user.id,
        report_type: 'compliance',
        report_subtype: reportType,
        format,
        schedule,
        email_recipients: emailRecipients,
        settings: {
          includeCharts,
          customFilters
        },
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (scheduleError) {
      console.error('Error creating scheduled report:', scheduleError);
      return NextResponse.json({ 
        error: 'Failed to create scheduled report', 
        details: scheduleError.message 
      }, { status: 500 });
    }

    // Log the scheduling activity
    try {
      await supabase
        .from('audit_logs')
        .insert({
          user_id: user.id,
          org_id: organizationId,
          action: 'compliance_report_scheduled',
          resource_type: 'scheduled_report',
          resource_id: scheduledReport.id,
          details: {
            reportType,
            format,
            schedule,
            emailRecipients: emailRecipients.length
          },
          timestamp: new Date().toISOString()
        });
    } catch (auditError) {
      console.error('Error logging audit event:', auditError);
    }

    return NextResponse.json({
      message: 'Scheduled compliance report created successfully',
      scheduledReport: {
        id: scheduledReport.id,
        reportType,
        format,
        schedule,
        emailRecipients: emailRecipients.length,
        createdAt: scheduledReport.created_at
      }
    });

  } catch (error: any) {
    console.error('Unexpected error in scheduled compliance export:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}

// Helper function to send compliance reports via email
async function sendComplianceReportEmail(
  recipients: string[],
  fileName: string,
  fileBuffer: Buffer,
  contentType: string,
  complianceData: ComplianceExportData
) {
  // This would integrate with your email service (SendGrid, AWS SES, etc.)
  // For now, we'll create a placeholder implementation
  
  const emailSubject = `Compliance Report - ${complianceData.exportMetadata.reportType}`;
  const emailBody = `
    <h2>Microsoft Graph Compliance Report</h2>
    <p>Please find the attached compliance report generated on ${new Date(complianceData.exportMetadata.generatedAt).toLocaleDateString()}.</p>
    
    <h3>Report Summary:</h3>
    <ul>
      <li><strong>Overall Compliance Score:</strong> ${complianceData.summary.overallScore}%</li>
      <li><strong>MFA Adoption Rate:</strong> ${complianceData.summary.mfaCompliance.percentage}%</li>
      <li><strong>Conditional Access Coverage:</strong> ${complianceData.summary.conditionalAccessCompliance.coverage}%</li>
      <li><strong>Encryption Compliance:</strong> ${complianceData.summary.encryptionCompliance.percentage}%</li>
    </ul>
    
    <p>This report contains detailed analysis of your organization's compliance posture across multiple Microsoft Graph security controls.</p>
    
    <p><em>This is an automated report. Please do not reply to this email.</em></p>
  `;

  // TODO: Implement actual email sending logic
  // Example with a hypothetical email service:
  /*
  await emailService.send({
    to: recipients,
    subject: emailSubject,
    html: emailBody,
    attachments: [{
      filename: fileName,
      content: fileBuffer,
      contentType: contentType
    }]
  });
  */

  console.log(`Email would be sent to: ${recipients.join(', ')}`);
  console.log(`Subject: ${emailSubject}`);
  console.log(`Attachment: ${fileName} (${fileBuffer.length} bytes)`);
  
  // For development, we'll just log the email details
  // In production, integrate with your preferred email service
} 