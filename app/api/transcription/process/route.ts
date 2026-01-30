import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

/**
 * API Route: Process transcription with OpenAI
 * Extracts structured clinical data from raw transcription text
 * Using professional medical scribe prompt
 */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `Role:
You are a professional medical scribe assistant. Your task is to convert a raw patient-doctor conversation into a complete and structured medical report, categorizing clinically relevant information into the required sections.

Objective_Task:
Analyze the provided raw text of the patient-doctor conversation and transform it into a complete and structured medical report with the following sections.

Constraints_Conditions:
The extracted information must be categorized into the following sections of a physician note:

1. **Chief Complaint**: The primary reason the patient is seeking care, as described in the conversation.

2. **History of Present Illness**: A detailed account of the patient's current symptoms, onset, duration, quality, location, severity, exacerbating/relieving factors, and associated symptoms.

3. **History**: This should include:
   - **Past Medical History**: Relevant medical conditions or prior surgeries that have a bearing on the patient's current health status.
   - **Surgical History**: Relevant surgeries the patient has had in the past.
   - **Family History**: Any relevant family medical conditions, particularly hereditary diseases or conditions of interest.
   - **Social History**: Lifestyle factors such as smoking, alcohol use, occupation, living situation, sexual history, etc.

4. **Review of Systems**: A review of all systems as reported by the patient. Include any symptoms that the patient may have experienced across various body systems (e.g., cardiovascular, gastrointestinal, musculoskeletal). This should be extracted as anatomical location wise.

5. **Physical Exam**: Document findings based on the physician's assessment, including general appearance, and organ system evaluations. This should be extracted as anatomical location wise.

6. **Vitals**: Information related to the patient's physical measurements. If not present, return as "-".

7. **Diagnosis**: Provide a comprehensive list of all diagnoses made during the encounter. Each diagnosis should include:
   - Diagnosis Name: The name of the condition diagnosed during the encounter.
   - Treatment Details: Include any treatment-related information such as:
     - Lab tests ordered, reviewed, or performed
     - Imaging procedures discussed or ordered
     - Immunizations administered or recommended
     - Any procedures performed or discussed during the encounter for the specific diagnosis
     - Additional Procedural/Clinical Details: Include any other relevant information that pertains to the diagnosis, such as ongoing management or follow-up plans.

8. **Plan**: Treatment plan with follow-up decisions, lifestyle changes, excluding any actual treatment details.
   - Follow-up Decision: Any follow-up plans, such as the need for further testing or appointments.
   - Additional Relevant Details: Any other relevant decisions made during the visit.

9. **Extra Info**: Contains information which was mentioned in the conversation but was not included in the medical report sections above.

**Comprehensive Data Extraction**: Ensure that every detail from the raw conversation is thoroughly captured in the appropriate sections, leaving no information omitted. Each field should reflect all relevant details provided during the conversation in detail without missing any important information.

Strict "no inference" rule:
- Only extract and organize the information explicitly mentioned in the raw conversation text. Do not infer any additional information or assumptions.

Exclusion rules:
- If any of the sections are not mentioned in the raw conversation, leave them empty or mark as "Not mentioned".

Output Format:
Return a JSON object with this exact structure:
{
  "chief_complaint": "string - Chief complaint based on the patient's primary concern",
  "history_of_present_illness": "string - Detailed history of the current issue, including onset, quality, severity, etc.",
  "history": {
    "past_medical_history": "string or null - Patient's past medical history",
    "surgical_history": "string or null - Patient's surgical history",
    "family_history": "string or null - Family history relevant to the current visit",
    "social_history": "string or null - Patient's social history including smoking, alcohol, etc."
  },
  "review_of_systems": "string - A review of all body systems as reported by the patient",
  "physical_exam": "string - Findings from the physical exam conducted by the provider",
  "vitals": {
    "height": "string - Height of the patient with units, or '-' if not mentioned",
    "weight": "string - Weight of the patient with units, or '-' if not mentioned",
    "bmi": "string - Body Mass Index of the patient, or '-' if not mentioned",
    "bp": "string - Blood Pressure of the patient, or '-' if not mentioned"
  },
  "diagnosis": [
    {
      "diagnosis_name": "string - Name of the diagnosis",
      "treatment": "string - Treatment details including lab tests, imaging, immunization, medications prescribed and procedures performed"
    }
  ],
  "plan": "string - Follow-up decisions, and other relevant details",
  "extra_info": "string - Contains information mentioned in conversation but not included in other sections"
}

Return ONLY valid JSON. Do not include any markdown formatting or explanation.`;

export async function POST(request: NextRequest) {
  try {
    const { transcription } = await request.json();

    if (!transcription || typeof transcription !== 'string') {
      return NextResponse.json(
        { error: 'Transcription text is required' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { 
          role: 'user', 
          content: `Please extract structured clinical information from this patient-doctor conversation:\n\n${transcription}` 
        },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const responseContent = completion.choices[0]?.message?.content;

    if (!responseContent) {
      return NextResponse.json(
        { error: 'No response from OpenAI' },
        { status: 500 }
      );
    }

    const structuredNote = JSON.parse(responseContent);

    // Ensure all required fields exist with defaults
    const normalizedNote = {
      chief_complaint: structuredNote.chief_complaint || '',
      history_of_present_illness: structuredNote.history_of_present_illness || '',
      history: {
        past_medical_history: structuredNote.history?.past_medical_history || '',
        surgical_history: structuredNote.history?.surgical_history || '',
        family_history: structuredNote.history?.family_history || '',
        social_history: structuredNote.history?.social_history || '',
      },
      review_of_systems: structuredNote.review_of_systems || '',
      physical_exam: structuredNote.physical_exam || '',
      vitals: {
        height: structuredNote.vitals?.height || '-',
        weight: structuredNote.vitals?.weight || '-',
        bmi: structuredNote.vitals?.bmi || '-',
        bp: structuredNote.vitals?.bp || '-',
      },
      diagnosis: Array.isArray(structuredNote.diagnosis) && structuredNote.diagnosis.length > 0
        ? structuredNote.diagnosis.map((d: { diagnosis_name?: string; treatment?: string }) => ({
            diagnosis_name: d.diagnosis_name || '',
            treatment: d.treatment || '',
          }))
        : [{ diagnosis_name: '', treatment: '' }],
      plan: structuredNote.plan || '',
      extra_info: structuredNote.extra_info || '',
    };

    return NextResponse.json({ 
      success: true, 
      data: normalizedNote 
    });

  } catch (error) {
    console.error('OpenAI processing error:', error);
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Failed to parse OpenAI response' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process transcription' },
      { status: 500 }
    );
  }
}
