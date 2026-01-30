import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { renderToBuffer } from '@react-pdf/renderer';
import CdiReportTemplate, { CdiReportData } from '@/app/lib/pdf/CdiReportTemplate';

/**
 * API Route: Generate CDI Report PDF
 * GET /api/cdi/pdf?appointmentId=123
 * Returns a PDF buffer of the CDI-compliant clinical report
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const appointmentId = searchParams.get('appointmentId');

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'Appointment ID is required' },
        { status: 400 }
      );
    }

    const appointmentIdNum = parseInt(appointmentId);

    if (isNaN(appointmentIdNum)) {
      return NextResponse.json(
        { error: 'Invalid appointment ID' },
        { status: 400 }
      );
    }

    // Fetch CDI chart info with patient and appointment data
    const cdiChartInfo = await prisma.cdiChartInfo.findUnique({
      where: { appointmentId: appointmentIdNum },
      include: {
        appointment: {
          include: {
            patient: true,
          },
        },
      },
    });

    if (!cdiChartInfo) {
      return NextResponse.json(
        { error: 'CDI chart info not found for this appointment' },
        { status: 404 }
      );
    }

    const { appointment } = cdiChartInfo;
    const { patient } = appointment;

    // Format dates for display
    const formatDate = (date: Date | null): string => {
      if (!date) return 'N/A';
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    const formatDateTime = (date: Date | null): string => {
      if (!date) return 'N/A';
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    // Prepare report data - only include fields that are used in the application
    const reportData: CdiReportData = {
      patientName: patient.fullName,
      patientId: patient.patientId,
      dateOfBirth: formatDate(patient.dateOfBirth),
      gender: patient.gender || 'N/A',
      appointmentDate: formatDate(appointment.appointmentDate),
      appointmentId: appointment.appointmentId,
      
      // Main clinical fields used in the application
      chiefComplaint: cdiChartInfo.chiefComplient,
      historyOfPresentIllness: cdiChartInfo.historyOfIllness,
      history: cdiChartInfo.history,
      reviewOfSystems: cdiChartInfo.ros,
      physicalExam: cdiChartInfo.physicalExam,
      vitalSigns: cdiChartInfo.vitalSigns,
      diagnosis: cdiChartInfo.diagnosis,
      plan: cdiChartInfo.plan,
      
      // These are not used in current UI but kept for compatibility
      assessment: null,
      clinicalImpression: null,
      
      // CDI metadata
      cdiStatus: cdiChartInfo.cdiStatus,
      cdiReviewedAt: formatDateTime(cdiChartInfo.cdiReviewedAt),
      cdiNotes: cdiChartInfo.cdiNotes,
    };

    // Generate PDF buffer
    const pdfBuffer = await renderToBuffer(
      CdiReportTemplate({ data: reportData })
    );

    // Return PDF response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="CDI_Report_${patient.fullName.replace(/\s+/g, '_')}_${appointmentId}.pdf"`,
      },
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
