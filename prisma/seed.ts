import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const fieldDefinitions = [
  { fieldKey: 'calculated_age', displayName: 'Age', description: 'Represents the patient\'s age at the time of the medical encounter. Age may be expressed in days, months, or years.' },
  { fieldKey: 'patient_gender', displayName: 'Gender', description: 'Indicates the patient\'s gender (male, female, or other), relevant for clinical decisions.' },
  { fieldKey: 'assessment', displayName: 'Clinical Assessment', description: 'The provider\'s evaluation and clinical judgment based on symptoms, history, and findings. Includes diagnostic reasoning.' },
  { fieldKey: 'chief_complient', displayName: 'Chief Complaint', description: 'Describes the patient\'s main concern and history of present illness, including onset, severity, and progression.' },
  { fieldKey: 'description_of_procedure', displayName: 'Procedure Description', description: 'A detailed summary of how a medical or surgical procedure was performed, including tools and observations.' },
  { fieldKey: 'diagnosis', displayName: 'Diagnosis', description: 'A formally recognized medical condition based on clinical evaluation and diagnostic testing.' },
  { fieldKey: 'history', displayName: 'Patient History', description: 'Includes medical, surgical, family, and social history relevant to the current encounter.' },
  { fieldKey: 'insurance_categories', displayName: 'Insurance Categories', description: 'Categorization of patient\'s insurance coverage type or plan.' },
  { fieldKey: 'insurance_companies', displayName: 'Insurance Companies', description: 'The name(s) of the insurance provider(s) covering the patient\'s care.' },
  { fieldKey: 'operative_procedure', displayName: 'Operative Procedure', description: 'The surgical procedure(s) performed during the operative session.' },
  { fieldKey: 'physical_exam', displayName: 'Detailed Physical Exam', description: 'Findings from a structured physical examination across body systems.' },
  { fieldKey: 'place_of_service_code_id', displayName: 'Place of Service Code', description: 'A standardized code indicating the location where care was provided (e.g., office, hospital).' },
  { fieldKey: 'plan', displayName: 'Treatment Plan', description: 'Details of planned interventions, medications, referrals, and follow-up steps.' },
  { fieldKey: 'plan_and_prognosis', displayName: 'Plan & Prognosis', description: 'Outlines both the treatment plan and the expected health outcomes or recovery path.' },
  { fieldKey: 'post_of_impression', displayName: 'Post-treatment Impression', description: 'Provider\'s interpretation of the patient\'s status after a procedure or treatment.' },
  { fieldKey: 'post_op_diagnosis', displayName: 'Postoperative Diagnosis', description: 'The confirmed diagnosis after surgery, reflecting intraoperative findings.' },
  { fieldKey: 'pre_op_diagnosis', displayName: 'Preoperative Diagnosis', description: 'Diagnosis established prior to surgery to justify and plan the procedure.' },
  { fieldKey: 'time_duration_min', displayName: 'Encounter Duration (Minutes)', description: 'Duration of the patient visit in minutes.' },
  { fieldKey: 'type_of_service_id', displayName: 'Type of Service', description: 'Identifies the nature of the service provided (e.g., consultation, follow-up).' },
  { fieldKey: 'type_of_visit_id', displayName: 'Type of Visit', description: 'A classification of the visit (e.g., new patient, established patient, emergency).' },
  { fieldKey: 'post_op_order', displayName: 'Post-Operative Orders', description: 'Physician instructions issued after a surgical procedure to guide immediate post-operative care and recovery.' },
  { fieldKey: 'clinical_impression', displayName: 'Clinical Impression', description: 'Clinician\'s assessment or diagnosis after evaluating the patient, based on symptoms, history, physical exam, and diagnostic tests.' },
  { fieldKey: 'ros', displayName: 'Review of System', description: 'Structured series of questions asked by a clinician to identify symptoms the patient might be experiencing across all body systems.' },
  { fieldKey: 'procedure', displayName: 'Procedure', description: 'A detailed summary of how a medical or surgical procedure was performed, including tools and observations.' },
  { fieldKey: 'vital_signs', displayName: 'Vital Signs', description: '' },
  { fieldKey: 'test_and_orders', displayName: 'Test and Orders', description: '' },
  { fieldKey: 'history_of_illness', displayName: 'History of Present Illness', description: '' },
];

async function main() {
  console.log('Seeding field definitions...');
  
  for (const field of fieldDefinitions) {
    await prisma.fieldDefinition.upsert({
      where: { fieldKey: field.fieldKey },
      update: {},
      create: field,
    });
  }
  
  console.log(`✅ Seeded ${fieldDefinitions.length} field definitions`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
