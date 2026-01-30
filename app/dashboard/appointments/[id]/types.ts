/**
 * Type definitions for structured clinical note
 * Matches the PhysicianNote schema for AI transcription output
 */

export interface History {
  past_medical_history: string;
  surgical_history: string;
  family_history: string;
  social_history: string;
}

export interface Vitals {
  height: string;
  weight: string;
  bmi: string;
  bp: string;
}

export interface Diagnosis {
  diagnosis_name: string;
  treatment: string;
}

export interface StructuredNote {
  chief_complaint: string;
  history_of_present_illness: string;
  history: History;
  review_of_systems: string;
  physical_exam: string;
  vitals: Vitals;
  diagnosis: Diagnosis[];
  plan: string;
  extra_info: string;
}

export const emptyStructuredNote: StructuredNote = {
  chief_complaint: '',
  history_of_present_illness: '',
  history: {
    past_medical_history: '',
    surgical_history: '',
    family_history: '',
    social_history: '',
  },
  review_of_systems: '',
  physical_exam: '',
  vitals: {
    height: '',
    weight: '',
    bmi: '',
    bp: '',
  },
  diagnosis: [{ diagnosis_name: '', treatment: '' }],
  plan: '',
  extra_info: '',
};
