import Link from 'next/link';
import { prisma } from '@/lib/prisma';

/**
 * Dashboard Page
 * Fetches appointments from the database using Prisma
 */
export default async function DashboardPage() {
  // Fetch real appointments from the database
  const appointments = await prisma.appointment.findMany({
    include: {
      patient: true,
      appointmentType: true,
    },
    orderBy: {
      appointmentDate: 'desc',
    },
  });

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
        <p className="text-gray-600">Manage your schedule and patient visits</p>
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
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {appointments.length > 0 ? (
                appointments.map((apt) => (
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
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Confirmed
                      </span>
                    </td>
                  </tr>
                ))
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
