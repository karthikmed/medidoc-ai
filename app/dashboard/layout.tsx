'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Dashboard layout with collapsible sidebar
 * Sidebar is closed by default for a cleaner experience
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard' || pathname.startsWith('/dashboard/appointments');
    }
    return pathname === path;
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ 
          width: sidebarOpen ? 220 : 64,
          transition: { duration: 0.2, ease: 'easeInOut' }
        }}
        className="h-full bg-gradient-to-b from-indigo-700 via-indigo-800 to-indigo-900 text-white flex flex-col flex-shrink-0"
      >
        {/* Logo Section */}
        <div className="h-14 flex items-center px-3 border-b border-indigo-600/30">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-20a3 3 0 013 3v10a3 3 0 01-6 0V4a3 3 0 013-3z" />
              </svg>
            </div>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-lg font-bold tracking-tight whitespace-nowrap"
              >
                MediDoc
              </motion.span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-hidden">
          {/* Toggle Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center space-x-3 px-2 py-2 rounded-xl hover:bg-white/10 transition-colors group mb-2"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/10 group-hover:bg-white/20 transition-colors">
              <motion.svg
                animate={{ rotate: sidebarOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </motion.svg>
            </div>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm font-medium whitespace-nowrap text-white/70"
              >
                Collapse
              </motion.span>
            )}
          </button>

          {/* Appointments */}
          <Link 
            href="/dashboard" 
            className={`flex items-center space-x-3 px-2 py-2 rounded-xl transition-all group ${
              isActive('/dashboard')
                ? 'bg-white/20' 
                : 'hover:bg-white/10'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
              isActive('/dashboard') ? 'bg-white text-indigo-700' : 'bg-white/10 group-hover:bg-white/20'
            }`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm font-medium whitespace-nowrap"
              >
                Appointments
              </motion.span>
            )}
          </Link>

          {/* Settings */}
          <Link 
            href="/dashboard/settings" 
            className={`flex items-center space-x-3 px-2 py-2 rounded-xl transition-all group ${
              isActive('/dashboard/settings')
                ? 'bg-white/20' 
                : 'hover:bg-white/10'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
              isActive('/dashboard/settings') ? 'bg-white text-indigo-700' : 'bg-white/10 group-hover:bg-white/20'
            }`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm font-medium whitespace-nowrap"
              >
                Settings
              </motion.span>
            )}
          </Link>
        </nav>

        {/* Sign Out */}
        <div className="p-2 border-t border-indigo-600/30">
          <Link 
            href="/login" 
            className="flex items-center space-x-3 px-2 py-2 rounded-xl hover:bg-white/10 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/10 group-hover:bg-red-500/30 transition-colors">
              <svg className="w-5 h-5 group-hover:text-red-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm font-medium whitespace-nowrap group-hover:text-red-300 transition-colors"
              >
                Sign Out
              </motion.span>
            )}
          </Link>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {children}
      </main>
    </div>
  );
}
