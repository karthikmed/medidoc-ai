'use client';

import { useState } from 'react';

interface NotesSectionProps {
  initialNotes: string;
  appointmentId: number;
}

export default function NotesSection({ initialNotes, appointmentId }: NotesSectionProps) {
  const [notes, setNotes] = useState(initialNotes);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-900 flex items-center">
          <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Consultation Notes
        </h2>
        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors">
            Save Notes
          </button>
        </div>
      </div>
      <div className="flex-1 p-0">
        <textarea
          className="w-full h-full p-6 text-gray-800 placeholder-gray-400 focus:outline-none resize-none leading-relaxed text-lg"
          placeholder="Start typing your consultation notes here or record clinical observations..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        ></textarea>
      </div>
      <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
        <p className="text-xs text-gray-500 italic">
          Auto-saving enabled...
        </p>
        <div className="flex items-center text-xs text-gray-500">
          <span className="flex items-center mr-4">
            <span className="w-2 h-2 bg-red-500 rounded-full mr-1.5 animate-pulse"></span>
            Recording active
          </span>
          <span>Words: {notes.trim() === '' ? 0 : notes.trim().split(/\s+/).length}</span>
        </div>
      </div>
    </div>
  );
}
