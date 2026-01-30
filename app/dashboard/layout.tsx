import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-indigo-700 text-white flex flex-col">
        <div className="p-6">
          <h2 className="text-2xl font-bold tracking-tight">MediDoc</h2>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <Link href="/dashboard" className="block px-4 py-2 rounded-md bg-indigo-800 hover:bg-indigo-600 transition-colors">
            Dashboard
          </Link>
          <Link href="/dashboard/appointments" className="block px-4 py-2 rounded-md hover:bg-indigo-600 transition-colors">
            Appointments
          </Link>
          <Link href="/dashboard/patients" className="block px-4 py-2 rounded-md hover:bg-indigo-600 transition-colors">
            Patients
          </Link>
          <Link href="/dashboard/settings" className="block px-4 py-2 rounded-md hover:bg-indigo-600 transition-colors">
            Settings
          </Link>
        </nav>
        <div className="p-4 border-t border-indigo-600">
          <Link href="/login" className="block px-4 py-2 rounded-md hover:bg-indigo-600 transition-colors text-sm">
            Sign Out
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
