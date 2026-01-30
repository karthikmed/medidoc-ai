'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Type definition for structured note data
 * Matches the PhysicianNote schema
 */
interface StructuredNoteData {
  chief_complaint: string;
  history_of_present_illness: string;
  history: {
    past_medical_history: string;
    surgical_history: string;
    family_history: string;
    social_history: string;
  };
  review_of_systems: string;
  physical_exam: string;
  vitals: {
    height: string;
    weight: string;
    bmi: string;
    bp: string;
  };
  diagnosis: Array<{
    diagnosis_name: string;
    treatment: string;
  }>;
  plan: string;
  extra_info?: string;
}

/**
 * Saves raw transcription for a specific appointment
 */
export async function saveRawTranscription(
  appointmentId: number, 
  text: string
) {
  try {
    await prisma.chartInfo.upsert({
      where: { appointmentId },
      update: { rawTranscription: text },
      create: { 
        appointmentId, 
        rawTranscription: text 
      },
    });
    revalidatePath(`/dashboard/appointments/${appointmentId}`);
    return { success: true };
  } catch (error) {
    console.error('Save error:', error);
    return { success: false, error: 'Failed to save transcription' };
  }
}

/**
 * Saves structured note data to the chart info table
 * Maps the JSON structure to database columns
 */
export async function saveStructuredNote(
  appointmentId: number, 
  noteData: StructuredNoteData
) {
  try {
    // Format history as combined text for the history column
    const historyText = [
      noteData.history.past_medical_history && 
        `Past Medical History: ${noteData.history.past_medical_history}`,
      noteData.history.surgical_history && 
        `Surgical History: ${noteData.history.surgical_history}`,
      noteData.history.family_history && 
        `Family History: ${noteData.history.family_history}`,
      noteData.history.social_history && 
        `Social History: ${noteData.history.social_history}`,
    ].filter(Boolean).join('\n\n');

    // Format vitals as text (now using string values)
    const vitalsText = [
      noteData.vitals.height && noteData.vitals.height !== '-' && 
        `Height: ${noteData.vitals.height}`,
      noteData.vitals.weight && noteData.vitals.weight !== '-' && 
        `Weight: ${noteData.vitals.weight}`,
      noteData.vitals.bmi && noteData.vitals.bmi !== '-' && 
        `BMI: ${noteData.vitals.bmi}`,
      noteData.vitals.bp && noteData.vitals.bp !== '-' && 
        `Blood Pressure: ${noteData.vitals.bp}`,
    ].filter(Boolean).join(', ');

    // Format diagnosis as text
    const diagnosisText = noteData.diagnosis
      .filter(d => d.diagnosis_name)
      .map((d, i) => {
        let text = `${i + 1}. ${d.diagnosis_name}`;
        if (d.treatment) {
          text += `\n   Treatment: ${d.treatment}`;
        }
        return text;
      })
      .join('\n\n');

    await prisma.chartInfo.upsert({
      where: { appointmentId },
      update: {
        chiefComplient: noteData.chief_complaint || null,
        historyOfIllness: noteData.history_of_present_illness || null,
        history: historyText || null,
        ros: noteData.review_of_systems || null,
        physicalExam: noteData.physical_exam || null,
        vitalSigns: vitalsText || null,
        diagnosis: diagnosisText || null,
        plan: noteData.plan || null,
      },
      create: {
        appointmentId,
        chiefComplient: noteData.chief_complaint || null,
        historyOfIllness: noteData.history_of_present_illness || null,
        history: historyText || null,
        ros: noteData.review_of_systems || null,
        physicalExam: noteData.physical_exam || null,
        vitalSigns: vitalsText || null,
        diagnosis: diagnosisText || null,
        plan: noteData.plan || null,
      },
    });

    revalidatePath(`/dashboard/appointments/${appointmentId}`);
    return { success: true };
  } catch (error) {
    console.error('Save structured note error:', error);
    return { success: false, error: 'Failed to save structured note' };
  }
}

/**
 * Saves both raw transcription and structured note in a single transaction
 */
export async function saveTranscriptionAndStructuredNote(
  appointmentId: number,
  rawTranscription: string,
  noteData: StructuredNoteData
) {
  try {
    // Format history as combined text
    const historyText = [
      noteData.history.past_medical_history && 
        `Past Medical History: ${noteData.history.past_medical_history}`,
      noteData.history.surgical_history && 
        `Surgical History: ${noteData.history.surgical_history}`,
      noteData.history.family_history && 
        `Family History: ${noteData.history.family_history}`,
      noteData.history.social_history && 
        `Social History: ${noteData.history.social_history}`,
    ].filter(Boolean).join('\n\n');

    // Format vitals as text (now using string values)
    const vitalsText = [
      noteData.vitals.height && noteData.vitals.height !== '-' && 
        `Height: ${noteData.vitals.height}`,
      noteData.vitals.weight && noteData.vitals.weight !== '-' && 
        `Weight: ${noteData.vitals.weight}`,
      noteData.vitals.bmi && noteData.vitals.bmi !== '-' && 
        `BMI: ${noteData.vitals.bmi}`,
      noteData.vitals.bp && noteData.vitals.bp !== '-' && 
        `Blood Pressure: ${noteData.vitals.bp}`,
    ].filter(Boolean).join(', ');

    // Format diagnosis as text
    const diagnosisText = noteData.diagnosis
      .filter(d => d.diagnosis_name)
      .map((d, i) => {
        let text = `${i + 1}. ${d.diagnosis_name}`;
        if (d.treatment) {
          text += `\n   Treatment: ${d.treatment}`;
        }
        return text;
      })
      .join('\n\n');

    await prisma.chartInfo.upsert({
      where: { appointmentId },
      update: {
        rawTranscription,
        chiefComplient: noteData.chief_complaint || null,
        historyOfIllness: noteData.history_of_present_illness || null,
        history: historyText || null,
        ros: noteData.review_of_systems || null,
        physicalExam: noteData.physical_exam || null,
        vitalSigns: vitalsText || null,
        diagnosis: diagnosisText || null,
        plan: noteData.plan || null,
      },
      create: {
        appointmentId,
        rawTranscription,
        chiefComplient: noteData.chief_complaint || null,
        historyOfIllness: noteData.history_of_present_illness || null,
        history: historyText || null,
        ros: noteData.review_of_systems || null,
        physicalExam: noteData.physical_exam || null,
        vitalSigns: vitalsText || null,
        diagnosis: diagnosisText || null,
        plan: noteData.plan || null,
      },
    });

    revalidatePath(`/dashboard/appointments/${appointmentId}`);
    return { success: true };
  } catch (error) {
    console.error('Save transcription and note error:', error);
    return { success: false, error: 'Failed to save data' };
  }
}
