'use client';

import React from 'react';
import { motion } from 'framer-motion';

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

interface CdiData extends ChartData {
  cdiNotes?: string;
}

interface CdiDiffEditorProps {
  originalData: ChartData;
  cdiData: CdiData;
  onCdiDataChange: (data: CdiData) => void;
}

/** Field labels for display */
const FIELD_CONFIG: Array<{ key: keyof ChartData; label: string }> = [
  { key: 'chiefComplient', label: 'Chief Complaint' },
  { key: 'historyOfIllness', label: 'History of Present Illness' },
  { key: 'history', label: 'Medical History' },
  { key: 'ros', label: 'Review of Systems' },
  { key: 'physicalExam', label: 'Physical Exam' },
  { key: 'vitalSigns', label: 'Vital Signs' },
  { key: 'diagnosis', label: 'Diagnosis' },
  { key: 'plan', label: 'Plan' },
  { key: 'assessment', label: 'Assessment' },
  { key: 'clinicalImpression', label: 'Clinical Impression' },
];

/**
 * CDI Diff Editor Component
 * Shows side-by-side comparison with editable CDI data
 */
export default function CdiDiffEditor({
  originalData,
  cdiData,
  onCdiDataChange,
}: CdiDiffEditorProps) {
  const handleFieldChange = (field: keyof ChartData, value: string) => {
    onCdiDataChange({
      ...cdiData,
      [field]: value,
    });
  };

  // Filter to only show fields that have content
  const fieldsWithContent = FIELD_CONFIG.filter(
    ({ key }) => originalData[key] || cdiData[key]
  );

  const changedFields = fieldsWithContent.filter(
    ({ key }) => originalData[key] !== cdiData[key]
  ).length;

  return (
    <div className="h-full flex flex-col">
      {/* Header Summary */}
      <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-emerald-800">CDI Analysis Complete</h3>
            <p className="text-sm text-emerald-600">
              {changedFields} of {fieldsWithContent.length} fields improved • Edit below if needed
            </p>
          </div>
        </div>
      </div>

      {/* CDI Notes */}
      {cdiData.cdiNotes && (
        <div className="mx-4 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <h4 className="font-semibold text-amber-800 text-sm flex items-center mb-1">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            AI Notes
          </h4>
          <p className="text-xs text-amber-700">{cdiData.cdiNotes}</p>
        </div>
      )}

      {/* Scrollable Diff Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {fieldsWithContent.map(({ key, label }, index) => {
          const originalValue = originalData[key] || '';
          const improvedValue = cdiData[key] || '';
          const hasChanges = originalValue !== improvedValue;

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`rounded-2xl border overflow-hidden ${
                hasChanges 
                  ? 'bg-gradient-to-br from-indigo-50/50 to-purple-50/50 border-indigo-200' 
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              {/* Field Header */}
              <div className="px-4 py-2.5 bg-white/60 border-b border-gray-100 flex items-center justify-between">
                <h4 className="font-bold text-gray-800 text-sm">{label}</h4>
                {hasChanges ? (
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-lg uppercase">
                    Improved
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-medium rounded-lg">
                    No changes
                  </span>
                )}
              </div>

              <div className="p-4">
                {hasChanges ? (
                  <div className="space-y-3">
                    {/* Original (Read-only) */}
                    <div className="p-3 bg-red-50/80 border border-red-200 rounded-xl">
                      <div className="flex items-center mb-1.5">
                        <span className="w-5 h-5 bg-red-200 text-red-700 rounded flex items-center justify-center text-xs font-bold mr-2">−</span>
                        <span className="text-[10px] font-bold text-red-600 uppercase">Original</span>
                      </div>
                      <p className="text-sm text-red-800 whitespace-pre-wrap leading-relaxed">
                        {originalValue || <span className="italic text-red-400">Empty</span>}
                      </p>
                    </div>
                    
                    {/* Improved (Editable) */}
                    <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl">
                      <div className="flex items-center mb-1.5">
                        <span className="w-5 h-5 bg-emerald-200 text-emerald-700 rounded flex items-center justify-center text-xs font-bold mr-2">+</span>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase">CDI Improved (Editable)</span>
                      </div>
                      <textarea
                        value={improvedValue}
                        onChange={(e) => handleFieldChange(key, e.target.value)}
                        className="w-full bg-white/80 border border-emerald-300 rounded-lg p-2.5 text-sm text-emerald-900 
                          focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent
                          resize-none leading-relaxed"
                        rows={Math.max(3, Math.ceil((improvedValue.length || 0) / 80))}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                    {originalValue || <span className="italic text-gray-400">No data</span>}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
