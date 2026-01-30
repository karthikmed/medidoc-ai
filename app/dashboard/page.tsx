const appointments = [
  { id: 1, patient: 'John Doe', time: '09:00 AM', type: 'Checkup', status: 'Confirmed' },
  { id: 2, patient: 'Jane Smith', time: '10:30 AM', type: 'Follow-up', status: 'Pending' },
  { id: 3, patient: 'Robert Johnson', time: '01:00 PM', type: 'Consultation', status: 'Confirmed' },
  { id: 4, patient: 'Emily Davis', time: '02:30 PM', type: 'Checkup', status: 'Cancelled' },
  { id: 5, patient: 'Michael Wilson', time: '04:00 PM', type: 'Urgent', status: 'Confirmed' },
];

export default function DashboardPage() {
  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600">Welcome back, Dr. Shashvi</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 uppercase">Total Patients</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">1,284</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 uppercase">Appointments Today</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">12</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 uppercase">Pending Reports</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">5</p>
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
              {appointments.map((apt) => (
                <tr key={apt.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{apt.patient}</td>
                  <td className="px-6 py-4 text-gray-600">{apt.time}</td>
                  <td className="px-6 py-4 text-gray-600">{apt.type}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      apt.status === 'Confirmed' ? 'bg-green-100 text-green-700' :
                      apt.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {apt.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
