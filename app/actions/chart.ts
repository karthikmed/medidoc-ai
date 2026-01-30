'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Saves raw transcription for a specific appointment
 */
export async function saveRawTranscription(appointmentId: number, text: string) {
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
