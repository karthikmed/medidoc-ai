import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import VoiceAssistantSplitView from './VoiceAssistantSplitView';

/**
 * Serialized chart info for client component
 */
interface SerializedChartInfo {
  rawTranscription: string | null;
  chiefComplient: string | null;
  historyOfIllness: string | null;
  history: string | null;
  ros: string | null;
  physicalExam: string | null;
  vitalSigns: string | null;
  diagnosis: string | null;
  plan: string | null;
}

/**
 * Serialized CDI chart info for client component
 */
interface SerializedCdiChartInfo extends SerializedChartInfo {
  cdiStatus: string | null;
  cdiReviewedAt: string | null;
  cdiNotes: string | null;
  assessment: string | null;
  clinicalImpression: string | null;
}

/**
 * Appointment Detail Page
 * Fetches specific appointment and patient data from the database
 */
export default async function AppointmentDetailPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const appointmentId = parseInt(params.id);

  if (isNaN(appointmentId)) {
    return notFound();
  }

  // Fetch appointment with patient, chart info, and CDI chart info from DB
  const appointment = await prisma.appointment.findUnique({
    where: { appointmentId },
    include: {
      patient: true,
      chartInfo: true,
      cdiChartInfo: true,
    },
  });

  if (!appointment) {
    return notFound();
  }

  const { patient, chartInfo, cdiChartInfo } = appointment;

  // Serialize chart info for client component
  const serializedChartInfo: SerializedChartInfo | null = chartInfo ? {
    rawTranscription: chartInfo.rawTranscription,
    chiefComplient: chartInfo.chiefComplient,
    historyOfIllness: chartInfo.historyOfIllness,
    history: chartInfo.history,
    ros: chartInfo.ros,
    physicalExam: chartInfo.physicalExam,
    vitalSigns: chartInfo.vitalSigns,
    diagnosis: chartInfo.diagnosis,
    plan: chartInfo.plan,
  } : null;

  // Serialize CDI chart info for client component
  const serializedCdiChartInfo: SerializedCdiChartInfo | null = cdiChartInfo ? {
    rawTranscription: cdiChartInfo.rawTranscription,
    chiefComplient: cdiChartInfo.chiefComplient,
    historyOfIllness: cdiChartInfo.historyOfIllness,
    history: cdiChartInfo.history,
    ros: cdiChartInfo.ros,
    physicalExam: cdiChartInfo.physicalExam,
    vitalSigns: cdiChartInfo.vitalSigns,
    diagnosis: cdiChartInfo.diagnosis,
    plan: cdiChartInfo.plan,
    cdiStatus: cdiChartInfo.cdiStatus,
    cdiReviewedAt: cdiChartInfo.cdiReviewedAt?.toISOString() || null,
    cdiNotes: cdiChartInfo.cdiNotes,
    assessment: cdiChartInfo.assessment,
    clinicalImpression: cdiChartInfo.clinicalImpression,
  } : null;

  // Calculate age from DOB
  const calculateAge = (dob: Date | null) => {
    if (!dob) return 'N/A';
    const diff = Date.now() - dob.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Topbar: Patient Info */}
      <div className="bg-white border-b border-gray-200 px-8 py-3 shadow-sm z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link 
              href="/dashboard" 
              className="text-indigo-600 hover:text-indigo-800 text-sm font-bold flex items-center bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Link>
            
            <div className="h-8 w-px bg-gray-200" />

            <div className="flex items-center space-x-8">
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Patient</p>
                <p className="text-sm font-bold text-gray-900">{patient.fullName}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Age / Gender</p>
                <p className="text-sm font-bold text-gray-900">
                  {calculateAge(patient.dateOfBirth)} • {patient.gender || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Last Visit</p>
                <p className="text-sm font-bold text-gray-900">
                  {patient.updatedAt ? new Date(patient.updatedAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-[10px] font-black px-3 py-1.5 bg-gray-100 text-gray-500 rounded-full border border-gray-200 uppercase tracking-widest">
              ID: #{appointmentId}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content: Split View */}
      <div className="flex-1 p-6 overflow-hidden">
        <VoiceAssistantSplitView 
          appointmentId={appointmentId}
          initialChartInfo={serializedChartInfo}
          initialCdiChartInfo={serializedCdiChartInfo}
        />
      </div>
    </div>
  );
}
