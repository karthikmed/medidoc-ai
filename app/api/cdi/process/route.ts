import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

/**
 * API Route: Process clinical data for CDI compliance
 * Takes existing chart data and transforms it to CDI-compliant format
 */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const CDI_SYSTEM_PROMPT = `You are a Clinical Documentation Improvement (CDI) specialist. Your task is to review and enhance clinical documentation to ensure it meets CDI best practices and compliance standards.

## CDI Best Practices to Apply:

1. **Specificity**: Ensure all diagnoses are documented with maximum specificity (e.g., "Type 2 diabetes mellitus with diabetic chronic kidney disease" instead of just "diabetes")

2. **Clinical Indicators**: Add relevant clinical indicators that support diagnoses (lab values, vital signs, physical exam findings)

3. **Severity & Acuity**: Document severity levels (mild, moderate, severe) and acuity (acute, chronic, acute-on-chronic)

4. **Cause and Effect**: Establish clear relationships between conditions (e.g., "hypertensive heart disease" shows causation)

5. **Present on Admission (POA)**: Clarify if conditions were present on admission

6. **Risk Adjustment**: Ensure documentation supports accurate risk adjustment and severity of illness

7. **Medical Necessity**: Document medical necessity for all procedures and treatments

8. **Comorbidities & Complications**: Capture all relevant comorbidities and complications that affect treatment

9. **ICD-10 Alignment**: Ensure terminology aligns with ICD-10 coding requirements

10. **Completeness**: Fill in any gaps with clinically appropriate language based on the context provided

## Your Task:

Review the provided clinical documentation and enhance each section following CDI best practices. For each field:
- Improve specificity and clinical accuracy
- Add supporting clinical indicators where appropriate
- Ensure proper medical terminology
- Maintain factual accuracy (don't invent information not supported by the original data)
- Flag areas that need clarification with [NEEDS CLARIFICATION: reason]

Return the enhanced documentation in the exact same JSON structure provided.`;

interface ChartData {
  chiefComplient?: string | null;
  historyOfIllness?: string | null;
  history?: string | null;
  ros?: string | null;
  physicalExam?: string | null;
  vitalSigns?: string | null;
  diagnosis?: string | null;
  plan?: string | null;
  assessment?: string | null;
  clinicalImpression?: string | null;
}

/**
 * Patient demographics for CDI processing (HIPAA compliant - no PII)
 */
interface PatientInfo {
  age?: number | string;
  gender?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { chartData, patientInfo } = await request.json() as { 
      chartData: ChartData;
      patientInfo?: PatientInfo;
    };

    if (!chartData) {
      return NextResponse.json(
        { error: 'Chart data is required' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Build patient demographics section for the prompt (HIPAA compliant - no PII)
    const patientDemographics = patientInfo ? `
## Patient Demographics:
- Age: ${patientInfo.age || 'Unknown'}
- Gender: ${patientInfo.gender || 'Unknown'}

Use this patient demographic information to properly reference the patient in all documentation fields. Refer to the patient as "the patient" or "a ${patientInfo.age}-year-old ${patientInfo.gender} patient". Do NOT use placeholders like "[NEEDS CLARIFICATION: age and gender]" - use the actual demographics provided above.
` : '';

    const inputData = {
      chief_complaint: chartData.chiefComplient || '',
      history_of_present_illness: chartData.historyOfIllness || '',
      medical_history: chartData.history || '',
      review_of_systems: chartData.ros || '',
      physical_exam: chartData.physicalExam || '',
      vital_signs: chartData.vitalSigns || '',
      diagnosis: chartData.diagnosis || '',
      plan: chartData.plan || '',
      assessment: chartData.assessment || '',
      clinical_impression: chartData.clinicalImpression || '',
    };

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: CDI_SYSTEM_PROMPT },
        { 
          role: 'user', 
          content: `Please review and enhance the following clinical documentation to be CDI-compliant. Return the improved version in JSON format with the same field names.
${patientDemographics}
Current Clinical Documentation:
${JSON.stringify(inputData, null, 2)}

Return a JSON object with these exact fields:
{
  "chief_complaint": "enhanced text",
  "history_of_present_illness": "enhanced text",
  "medical_history": "enhanced text",
  "review_of_systems": "enhanced text",
  "physical_exam": "enhanced text",
  "vital_signs": "enhanced text",
  "diagnosis": "enhanced text with ICD-10 alignment",
  "plan": "enhanced text",
  "assessment": "enhanced text",
  "clinical_impression": "enhanced text",
  "cdi_notes": "Summary of improvements made and any areas needing clarification"
}`
        },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    const responseContent = completion.choices[0]?.message?.content;

    if (!responseContent) {
      return NextResponse.json(
        { error: 'No response from OpenAI' },
        { status: 500 }
      );
    }

    const cdiData = JSON.parse(responseContent);

    // Map back to database field names
    const normalizedCdiData = {
      chiefComplient: cdiData.chief_complaint || '',
      historyOfIllness: cdiData.history_of_present_illness || '',
      history: cdiData.medical_history || '',
      ros: cdiData.review_of_systems || '',
      physicalExam: cdiData.physical_exam || '',
      vitalSigns: cdiData.vital_signs || '',
      diagnosis: cdiData.diagnosis || '',
      plan: cdiData.plan || '',
      assessment: cdiData.assessment || '',
      clinicalImpression: cdiData.clinical_impression || '',
      cdiNotes: cdiData.cdi_notes || '',
    };

    return NextResponse.json({ 
      success: true, 
      data: normalizedCdiData,
      originalData: {
        chiefComplient: chartData.chiefComplient || '',
        historyOfIllness: chartData.historyOfIllness || '',
        history: chartData.history || '',
        ros: chartData.ros || '',
        physicalExam: chartData.physicalExam || '',
        vitalSigns: chartData.vitalSigns || '',
        diagnosis: chartData.diagnosis || '',
        plan: chartData.plan || '',
        assessment: chartData.assessment || '',
        clinicalImpression: chartData.clinicalImpression || '',
      }
    });

  } catch (error) {
    console.error('CDI processing error:', error);
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Failed to parse OpenAI response' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process CDI review' },
      { status: 500 }
    );
  }
}
