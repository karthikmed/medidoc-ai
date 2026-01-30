import Link from 'next/link';
import { prisma } from '@/lib/prisma';

/**
 * Chart info type for checking populated fields
 */
interface ChartInfoData {
  chiefComplient: string | null;
  historyOfIllness: string | null;
  history: string | null;
  ros: string | null;
  physicalExam: string | null;
  vitalSigns: string | null;
  diagnosis: string | null;
  plan: string | null;
  rawTranscription: string | null;
}

/**
 * Check if any clinical data field in chartInfo is populated
 */
function hasAnyChartData(chartInfo: ChartInfoData | null): boolean {
  if (!chartInfo) return false;
  
  const fieldsToCheck = [
    chartInfo.chiefComplient,
    chartInfo.historyOfIllness,
    chartInfo.history,
    chartInfo.ros,
    chartInfo.physicalExam,
    chartInfo.vitalSigns,
    chartInfo.diagnosis,
    chartInfo.plan,
    chartInfo.rawTranscription,
  ];
  
  return fieldsToCheck.some(field => field !== null && field.trim() !== '');
}

/**
 * Get CDI status badge styling based on status
 */
function getCdiStatusStyle(status: string): { bg: string; text: string; label: string } {
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, '_');
  
  switch (normalizedStatus) {
    case 'pdf_generated':
      return { bg: 'bg-purple-100', text: 'text-purple-700', label: 'PDF Generated' };
    case 'approved':
      return { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Approved' };
    case 'reviewed':
      return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Reviewed' };
    case 'cdi_review_pending':
      return { bg: 'bg-amber-100', text: 'text-amber-700', label: 'CDI Review Pending' };
    case 'documentation_pending':
      return { bg: 'bg-red-100', text: 'text-red-700', label: 'Documentation Pending' };
    default:
      // For any other status from DB, display it as-is with a neutral style
      return { bg: 'bg-gray-100', text: 'text-gray-700', label: status };
  }
}

/**
 * Determine the effective CDI status for an appointment
 */
function getEffectiveCdiStatus(
  cdiStatus: string | null | undefined,
  chartInfo: ChartInfoData | null
): string {
  // If CDI record exists and has a status, use it
  if (cdiStatus) {
    return cdiStatus;
  }
  
  // Check if chart_info has any populated data
  if (hasAnyChartData(chartInfo)) {
    return 'CDI Review Pending';
  }
  
  // No chart data at all
  return 'Documentation Pending';
}

/**
 * Dashboard Page
 * Fetches appointments from the database using Prisma
 */
export default async function DashboardPage() {
  // Fetch real appointments from the database with CDI status and chart info
  const appointments = await prisma.appointment.findMany({
    include: {
      patient: true,
      appointmentType: true,
      chartInfo: {
        select: {
          chiefComplient: true,
          historyOfIllness: true,
          history: true,
          ros: true,
          physicalExam: true,
          vitalSigns: true,
          diagnosis: true,
          plan: true,
          rawTranscription: true,
        },
      },
      cdiChartInfo: {
        select: {
          cdiStatus: true,
        },
      },
    },
    orderBy: {
      appointmentDate: 'desc',
    },
  });

  return (
    <div className="p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600">Manage your schedule and patient visits</p>
        </div>
        <Link 
          href="/dashboard/patients/new"
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-100 hover:shadow-xl hover:scale-105 transition-all flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>New Patient</span>
        </Link>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 uppercase">Total Patients</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {await prisma.patient.count()}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 uppercase">Appointments Today</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {appointments.length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 uppercase">Pending Reports</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {await prisma.chartInfo.count({ where: { chiefComplient: null } })}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Today's Appointments</h2>
          <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">Patient</th>
                <th className="px-6 py-4 font-medium">Time</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">CDI Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {appointments.length > 0 ? (
                appointments.map((apt: typeof appointments[number]) => {
                  // Determine effective CDI status based on chart_info and cdi_chart_info
                  const effectiveStatus = getEffectiveCdiStatus(
                    apt.cdiChartInfo?.cdiStatus,
                    apt.chartInfo
                  );
                  const statusStyle = getCdiStatusStyle(effectiveStatus);
                  
                  return (
                    <tr key={apt.appointmentId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        <Link href={`/dashboard/appointments/${apt.appointmentId}`} className="text-indigo-600 hover:text-indigo-900 hover:underline">
                          {apt.patient.fullName}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(apt.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {apt.appointmentType.appointmentType}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
                          {statusStyle.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No appointments found for today.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
