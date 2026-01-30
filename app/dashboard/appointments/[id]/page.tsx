import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import NotesSection from './NotesSection';

/**
 * Appointment Detail Page
 * Fetches specific appointment and patient data from the database
 */
export default async function AppointmentDetailPage({ params }: { params: { id: string } }) {
  const appointmentId = parseInt(params.id);

  if (isNaN(appointmentId)) {
    return notFound();
  }

  // Fetch appointment with patient and chart info from DB
  const appointment = await prisma.appointment.findUnique({
    where: { appointmentId },
    include: {
      patient: true,
      chartInfo: true,
    },
  });

  if (!appointment) {
    return notFound();
  }

  const { patient, chartInfo } = appointment;

  // Calculate age from DOB
  const calculateAge = (dob: Date | null) => {
    if (!dob) return 'N/A';
    const diff = Date.now() - dob.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Topbar: Patient Info */}
      <div className="bg-white border-b border-gray-200 px-8 py-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Appointments
          </Link>
          <span className="text-xs font-semibold px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">
            Appointment ID: #{appointmentId}
          </span>
        </div>
        
        <div className="flex flex-wrap items-center gap-x-12 gap-y-4 mt-4">
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Patient Name</p>
            <p className="text-xl font-bold text-gray-900">{patient.fullName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Age</p>
            <p className="text-lg font-medium text-gray-900">{calculateAge(patient.dateOfBirth)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Gender</p>
            <p className="text-lg font-medium text-gray-900">{patient.gender || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Last Visit</p>
            <p className="text-lg font-medium text-gray-900">
              {patient.updatedAt ? new Date(patient.updatedAt).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content: Doctor's Notes (Client Component) */}
      <div className="flex-1 p-8">
        <NotesSection 
          initialNotes={chartInfo?.historyOfIllness || ''} 
          appointmentId={appointmentId} 
        />
      </div>
    </div>
  );
}
