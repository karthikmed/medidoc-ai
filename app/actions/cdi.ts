'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Type definition for CDI chart data
 */
interface CdiChartData {
  chiefComplient?: string;
  historyOfIllness?: string;
  history?: string;
  ros?: string;
  physicalExam?: string;
  vitalSigns?: string;
  diagnosis?: string;
  plan?: string;
  assessment?: string;
  clinicalImpression?: string;
  cdiNotes?: string;
}

/**
 * Helper to get patientId from appointment
 */
async function getPatientIdFromAppointment(appointmentId: number): Promise<number | null> {
  const appointment = await prisma.appointment.findUnique({
    where: { appointmentId },
    select: { patientId: true },
  });
  return appointment?.patientId ?? null;
}

/**
 * Saves CDI-compliant chart data to the t_kb_cdi_chart_info table
 */
export async function saveCdiChartInfo(
  appointmentId: number,
  cdiData: CdiChartData,
  rawTranscription?: string
) {
  try {
    const patientId = await getPatientIdFromAppointment(appointmentId);

    await prisma.cdiChartInfo.upsert({
      where: { appointmentId },
      update: {
        rawTranscription: rawTranscription || null,
        chiefComplient: cdiData.chiefComplient || null,
        historyOfIllness: cdiData.historyOfIllness || null,
        history: cdiData.history || null,
        ros: cdiData.ros || null,
        physicalExam: cdiData.physicalExam || null,
        vitalSigns: cdiData.vitalSigns || null,
        diagnosis: cdiData.diagnosis || null,
        plan: cdiData.plan || null,
        assessment: cdiData.assessment || null,
        clinicalImpression: cdiData.clinicalImpression || null,
        cdiNotes: cdiData.cdiNotes || null,
        cdiStatus: 'reviewed',
        cdiReviewedAt: new Date(),
      },
      create: {
        appointmentId,
        patientId,
        rawTranscription: rawTranscription || null,
        chiefComplient: cdiData.chiefComplient || null,
        historyOfIllness: cdiData.historyOfIllness || null,
        history: cdiData.history || null,
        ros: cdiData.ros || null,
        physicalExam: cdiData.physicalExam || null,
        vitalSigns: cdiData.vitalSigns || null,
        diagnosis: cdiData.diagnosis || null,
        plan: cdiData.plan || null,
        assessment: cdiData.assessment || null,
        clinicalImpression: cdiData.clinicalImpression || null,
        cdiNotes: cdiData.cdiNotes || null,
        cdiStatus: 'reviewed',
        cdiReviewedAt: new Date(),
      },
    });

    revalidatePath(`/dashboard/appointments/${appointmentId}`);
    return { success: true };
  } catch (error) {
    console.error('Save CDI chart info error:', error);
    return { success: false, error: 'Failed to save CDI data' };
  }
}

/**
 * Gets existing CDI chart data for an appointment
 */
export async function getCdiChartInfo(appointmentId: number) {
  try {
    const cdiData = await prisma.cdiChartInfo.findUnique({
      where: { appointmentId },
    });
    return { success: true, data: cdiData };
  } catch (error) {
    console.error('Get CDI chart info error:', error);
    return { success: false, error: 'Failed to get CDI data' };
  }
}

/**
 * Updates CDI status (pending, reviewed, approved)
 */
export async function updateCdiStatus(
  appointmentId: number,
  status: 'pending' | 'reviewed' | 'approved',
  reviewedBy?: string
) {
  try {
    await prisma.cdiChartInfo.update({
      where: { appointmentId },
      data: {
        cdiStatus: status,
        cdiReviewedBy: reviewedBy || null,
        cdiReviewedAt: new Date(),
      },
    });

    revalidatePath(`/dashboard/appointments/${appointmentId}`);
    return { success: true };
  } catch (error) {
    console.error('Update CDI status error:', error);
    return { success: false, error: 'Failed to update CDI status' };
  }
}
