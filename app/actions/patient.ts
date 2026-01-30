'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';

/**
 * Patient creation input type
 */
interface CreatePatientInput {
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
}

/**
 * Creates a new patient in the database
 */
export async function createPatient(input: CreatePatientInput) {
  try {
    const contactInfo = {
      phone: input.phone || null,
      email: input.email || null,
      address: input.address || null,
    };

    const insurance = input.insuranceProvider ? {
      provider: input.insuranceProvider,
      policyNumber: input.insurancePolicyNumber || null,
    } : Prisma.JsonNull;

    const patient = await prisma.patient.create({
      data: {
        fullName: input.fullName,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
        gender: input.gender || null,
        contactInfo: contactInfo as Prisma.InputJsonValue,
        insurance: insurance,
      },
    });

    revalidatePath('/dashboard');
    return { success: true, patientId: patient.patientId };
  } catch (error) {
    console.error('Create patient error:', error);
    return { success: false, error: 'Failed to create patient' };
  }
}

/**
 * Appointment creation input type
 */
interface CreateAppointmentInput {
  patientId: number;
  providerId: number;
  appointmentTypeId: number;
  appointmentDate: string;
  durationMin?: number;
}

/**
 * Creates a new appointment for a patient
 */
export async function createAppointment(input: CreateAppointmentInput) {
  try {
    // Use raw SQL or unchecked create for relationships
    const appointment = await prisma.$queryRaw<{ appointment_id: number }[]>`
      INSERT INTO t_kb_appointment (patient_id, provider_id, appointment_type_id, appointment_date, duration_min, created_at, updated_at)
      VALUES (${input.patientId}, ${input.providerId}, ${input.appointmentTypeId}, ${new Date(input.appointmentDate)}, ${input.durationMin || 30}, NOW(), NOW())
      RETURNING appointment_id
    `;

    revalidatePath('/dashboard');
    return { success: true, appointmentId: appointment[0].appointment_id };
  } catch (error) {
    console.error('Create appointment error:', error);
    return { success: false, error: 'Failed to create appointment' };
  }
}

/**
 * Creates a patient and appointment in a single flow
 */
export async function createPatientWithAppointment(
  patientInput: CreatePatientInput,
  appointmentDate: string,
  appointmentTypeId: number,
  providerId: number
) {
  try {
    const contactInfo = {
      phone: patientInput.phone || null,
      email: patientInput.email || null,
      address: patientInput.address || null,
    };

    const insurance = patientInput.insuranceProvider ? {
      provider: patientInput.insuranceProvider,
      policyNumber: patientInput.insurancePolicyNumber || null,
    } : Prisma.JsonNull;

    // Create patient first
    const patient = await prisma.patient.create({
      data: {
        fullName: patientInput.fullName,
        dateOfBirth: patientInput.dateOfBirth ? new Date(patientInput.dateOfBirth) : null,
        gender: patientInput.gender || null,
        contactInfo: contactInfo as Prisma.InputJsonValue,
        insurance: insurance,
      },
    });

    // Create appointment using raw SQL to avoid type issues
    const appointment = await prisma.$queryRaw<{ appointment_id: number }[]>`
      INSERT INTO t_kb_appointment (patient_id, provider_id, appointment_type_id, appointment_date, duration_min, created_at, updated_at)
      VALUES (${patient.patientId}, ${providerId}, ${appointmentTypeId}, ${new Date(appointmentDate)}, 30, NOW(), NOW())
      RETURNING appointment_id
    `;

    revalidatePath('/dashboard');
    return { 
      success: true, 
      patientId: patient.patientId,
      appointmentId: appointment[0].appointment_id 
    };
  } catch (error) {
    console.error('Create patient with appointment error:', error);
    return { success: false, error: 'Failed to create patient and appointment' };
  }
}

/**
 * Fetches all providers for dropdown
 */
export async function getProviders() {
  try {
    const providers = await prisma.provider.findMany({
      orderBy: { providerName: 'asc' },
    });
    return { success: true, providers };
  } catch (error) {
    console.error('Get providers error:', error);
    return { success: false, providers: [] };
  }
}

/**
 * Fetches all appointment types for dropdown
 */
export async function getAppointmentTypes() {
  try {
    // Use raw SQL since appointmentType model may not be in sync
    const types = await prisma.$queryRaw<{ appointment_type_id: number; appointment_type: string }[]>`
      SELECT appointment_type_id, appointment_type FROM t_kb_appointment_type ORDER BY appointment_type ASC
    `;
    return { 
      success: true, 
      types: types.map(t => ({
        appointmentTypeId: t.appointment_type_id,
        appointmentType: t.appointment_type
      }))
    };
  } catch (error) {
    console.error('Get appointment types error:', error);
    return { success: false, types: [] };
  }
}
