'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StructuredNote, History, Vitals, Diagnosis } from './types';

interface StructuredNoteFormProps {
  note: StructuredNote;
  onChange: (note: StructuredNote) => void;
  disabled?: boolean;
  animatingField?: string | null;
}

/**
 * Structured clinical note form component
 * Displays form fields matching the PhysicianNote schema
 * Supports disabled state and animated field highlighting
 */
export default function StructuredNoteForm({ 
  note, 
  onChange, 
  disabled = false,
  animatingField = null
}: StructuredNoteFormProps) {
  
  const handleChange = (field: keyof StructuredNote, value: string) => {
    onChange({ ...note, [field]: value });
  };

  const handleHistoryChange = (field: keyof History, value: string) => {
    onChange({
      ...note,
      history: { ...note.history, [field]: value },
    });
  };

  const handleVitalsChange = (field: keyof Vitals, value: string) => {
    onChange({
      ...note,
      vitals: { ...note.vitals, [field]: value },
    });
  };

  const handleDiagnosisChange = (
    index: number, 
    field: keyof Diagnosis, 
    value: string
  ) => {
    const newDiagnosis = [...note.diagnosis];
    newDiagnosis[index] = { ...newDiagnosis[index], [field]: value };
    onChange({ ...note, diagnosis: newDiagnosis });
  };

  const addDiagnosis = () => {
    if (disabled) return;
    onChange({
      ...note,
      diagnosis: [...note.diagnosis, { diagnosis_name: '', treatment: '' }],
    });
  };

  const removeDiagnosis = (index: number) => {
    if (disabled) return;
    const newDiagnosis = note.diagnosis.filter((_, i) => i !== index);
    onChange({ ...note, diagnosis: newDiagnosis });
  };

  const baseInputClass = `w-full p-4 bg-white border border-gray-200 rounded-2xl 
    focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none 
    transition-all duration-300 text-gray-800`;
  
  const disabledClass = disabled 
    ? 'opacity-50 cursor-not-allowed bg-gray-50' 
    : '';

  const getFieldAnimation = (fieldName: string) => {
    if (animatingField === fieldName) {
      return 'ring-2 ring-indigo-400 ring-offset-2 bg-indigo-50/50 border-indigo-300 shadow-lg shadow-indigo-100';
    }
    return '';
  };

  const FieldWrapper = ({ 
    fieldName, 
    children 
  }: { 
    fieldName: string; 
    children: React.ReactNode 
  }) => (
    <motion.div
      data-field={fieldName}
      initial={false}
      animate={animatingField === fieldName ? {
        scale: [1, 1.01, 1],
        transition: { duration: 0.3 }
      } : {}}
    >
      {children}
      {animatingField === fieldName && (
        <motion.div 
          className="flex items-center mt-2 text-indigo-600"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="flex space-x-1"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="text-xs font-medium">AI filling...</span>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );

  return (
    <div className={`space-y-6 p-6 pb-32 ${disabled ? 'pointer-events-none' : ''}`}>
      {/* Disabled Overlay Banner */}
      <AnimatePresence>
        {disabled && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="sticky top-0 z-10 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-center shadow-lg"
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse absolute" />
                <span className="w-3 h-3 bg-red-400 rounded-full animate-ping" />
              </div>
              <span className="text-amber-800 font-semibold text-sm">
                Recording in progress - form is read-only
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chief Complaint */}
      <section>
        <label className="block text-xs font-black text-indigo-600 uppercase tracking-widest mb-2">
          Chief Complaint
        </label>
        <FieldWrapper fieldName="chief_complaint">
          <textarea
            className={`${baseInputClass} ${disabledClass} ${getFieldAnimation('chief_complaint')}`}
            rows={2}
            value={note.chief_complaint}
            onChange={(e) => handleChange('chief_complaint', e.target.value)}
            placeholder="Primary reason for visit..."
            disabled={disabled}
          />
        </FieldWrapper>
      </section>

      {/* History of Present Illness */}
      <section>
        <label className="block text-xs font-black text-indigo-600 uppercase tracking-widest mb-2">
          History of Present Illness
        </label>
        <FieldWrapper fieldName="history_of_present_illness">
          <textarea
            className={`${baseInputClass} ${disabledClass} ${getFieldAnimation('history_of_present_illness')}`}
            rows={3}
            value={note.history_of_present_illness}
            onChange={(e) => handleChange('history_of_present_illness', e.target.value)}
            placeholder="Onset, duration, quality, location, severity, exacerbating/relieving factors..."
            disabled={disabled}
          />
        </FieldWrapper>
      </section>

      {/* History Sections */}
      <section className="space-y-3">
        <label className="block text-xs font-black text-indigo-600 uppercase tracking-widest">
          Medical History
        </label>
        <div className="grid grid-cols-2 gap-4">
          <FieldWrapper fieldName="history.past_medical_history">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">
                Past Medical History
              </label>
              <textarea
                className={`w-full p-3 bg-white border border-gray-200 rounded-xl text-sm transition-all duration-300 ${disabledClass} ${getFieldAnimation('history.past_medical_history')}`}
                rows={2}
                value={note.history.past_medical_history}
                onChange={(e) => handleHistoryChange('past_medical_history', e.target.value)}
                placeholder="Prior conditions, surgeries..."
                disabled={disabled}
              />
            </div>
          </FieldWrapper>
          <FieldWrapper fieldName="history.surgical_history">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">
                Surgical History
              </label>
              <textarea
                className={`w-full p-3 bg-white border border-gray-200 rounded-xl text-sm transition-all duration-300 ${disabledClass} ${getFieldAnimation('history.surgical_history')}`}
                rows={2}
                value={note.history.surgical_history}
                onChange={(e) => handleHistoryChange('surgical_history', e.target.value)}
                placeholder="Past surgeries..."
                disabled={disabled}
              />
            </div>
          </FieldWrapper>
          <FieldWrapper fieldName="history.family_history">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">
                Family History
              </label>
              <textarea
                className={`w-full p-3 bg-white border border-gray-200 rounded-xl text-sm transition-all duration-300 ${disabledClass} ${getFieldAnimation('history.family_history')}`}
                rows={2}
                value={note.history.family_history}
                onChange={(e) => handleHistoryChange('family_history', e.target.value)}
                placeholder="Family medical conditions..."
                disabled={disabled}
              />
            </div>
          </FieldWrapper>
          <FieldWrapper fieldName="history.social_history">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">
                Social History
              </label>
              <textarea
                className={`w-full p-3 bg-white border border-gray-200 rounded-xl text-sm transition-all duration-300 ${disabledClass} ${getFieldAnimation('history.social_history')}`}
                rows={2}
                value={note.history.social_history}
                onChange={(e) => handleHistoryChange('social_history', e.target.value)}
                placeholder="Smoking, alcohol, occupation..."
                disabled={disabled}
              />
            </div>
          </FieldWrapper>
        </div>
      </section>

      {/* Review of Systems */}
      <section>
        <label className="block text-xs font-black text-indigo-600 uppercase tracking-widest mb-2">
          Review of Systems
        </label>
        <FieldWrapper fieldName="review_of_systems">
          <textarea
            className={`${baseInputClass} ${disabledClass} ${getFieldAnimation('review_of_systems')}`}
            rows={3}
            value={note.review_of_systems}
            onChange={(e) => handleChange('review_of_systems', e.target.value)}
            placeholder="Symptoms by body system (cardiovascular, respiratory, etc.)..."
            disabled={disabled}
          />
        </FieldWrapper>
      </section>

      {/* Physical Exam */}
      <section>
        <label className="block text-xs font-black text-indigo-600 uppercase tracking-widest mb-2">
          Physical Exam
        </label>
        <FieldWrapper fieldName="physical_exam">
          <textarea
            className={`${baseInputClass} ${disabledClass} ${getFieldAnimation('physical_exam')}`}
            rows={3}
            value={note.physical_exam}
            onChange={(e) => handleChange('physical_exam', e.target.value)}
            placeholder="General appearance, organ system evaluations..."
            disabled={disabled}
          />
        </FieldWrapper>
      </section>

      {/* Vitals */}
      <section className="space-y-3">
        <label className="block text-xs font-black text-indigo-600 uppercase tracking-widest">
          Vitals
        </label>
        <FieldWrapper fieldName="vitals">
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">
                Height
              </label>
              <input
                type="text"
                className={`w-full p-3 bg-white border border-gray-200 rounded-xl text-sm transition-all duration-300 ${disabledClass} ${getFieldAnimation('vitals')}`}
                value={note.vitals.height}
                onChange={(e) => handleVitalsChange('height', e.target.value)}
                placeholder="5'10&quot;"
                disabled={disabled}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">
                Weight
              </label>
              <input
                type="text"
                className={`w-full p-3 bg-white border border-gray-200 rounded-xl text-sm transition-all duration-300 ${disabledClass} ${getFieldAnimation('vitals')}`}
                value={note.vitals.weight}
                onChange={(e) => handleVitalsChange('weight', e.target.value)}
                placeholder="180 lbs"
                disabled={disabled}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">
                BMI
              </label>
              <input
                type="text"
                className={`w-full p-3 bg-white border border-gray-200 rounded-xl text-sm transition-all duration-300 ${disabledClass} ${getFieldAnimation('vitals')}`}
                value={note.vitals.bmi}
                onChange={(e) => handleVitalsChange('bmi', e.target.value)}
                placeholder="25.8"
                disabled={disabled}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">
                Blood Pressure
              </label>
              <input
                type="text"
                className={`w-full p-3 bg-white border border-gray-200 rounded-xl text-sm transition-all duration-300 ${disabledClass} ${getFieldAnimation('vitals')}`}
                value={note.vitals.bp}
                onChange={(e) => handleVitalsChange('bp', e.target.value)}
                placeholder="120/80"
                disabled={disabled}
              />
            </div>
          </div>
        </FieldWrapper>
      </section>

      {/* Diagnosis */}
      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="block text-xs font-black text-indigo-600 uppercase tracking-widest">
            Diagnosis & Treatment
          </label>
          <button
            onClick={addDiagnosis}
            disabled={disabled}
            className={`text-[10px] font-bold text-indigo-600 hover:text-indigo-800 
              uppercase tracking-widest flex items-center px-3 py-1.5 rounded-lg
              hover:bg-indigo-50 transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
            </svg>
            Add Diagnosis
          </button>
        </div>
        <FieldWrapper fieldName="diagnosis">
          <div className="space-y-3">
            <AnimatePresence>
              {note.diagnosis.map((d, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className={`p-4 bg-gradient-to-br from-gray-50 to-white border border-gray-200 
                    rounded-2xl relative group shadow-sm hover:shadow-md transition-all duration-300
                    ${disabledClass} ${getFieldAnimation('diagnosis')}`}
                >
                  {!disabled && (
                    <button
                      onClick={() => removeDiagnosis(index)}
                      className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center
                        text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg
                        opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">
                        Diagnosis Name
                      </label>
                      <input
                        type="text"
                        className={`w-full p-3 bg-white border border-gray-200 rounded-xl text-sm 
                          transition-all duration-300 ${disabledClass}`}
                        value={d.diagnosis_name}
                        onChange={(e) => handleDiagnosisChange(index, 'diagnosis_name', e.target.value)}
                        placeholder="Condition name..."
                        disabled={disabled}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">
                        Treatment Details
                      </label>
                      <textarea
                        className={`w-full p-3 bg-white border border-gray-200 rounded-xl text-sm 
                          transition-all duration-300 ${disabledClass}`}
                        rows={2}
                        value={d.treatment}
                        onChange={(e) => handleDiagnosisChange(index, 'treatment', e.target.value)}
                        placeholder="Lab tests, imaging, medications, procedures..."
                        disabled={disabled}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </FieldWrapper>
      </section>

      {/* Plan */}
      <section>
        <label className="block text-xs font-black text-indigo-600 uppercase tracking-widest mb-2">
          Plan
        </label>
        <FieldWrapper fieldName="plan">
          <textarea
            className={`${baseInputClass} font-medium ${disabledClass} ${getFieldAnimation('plan')}`}
            rows={3}
            value={note.plan}
            onChange={(e) => handleChange('plan', e.target.value)}
            placeholder="Follow-up decisions, lifestyle changes, additional relevant details..."
            disabled={disabled}
          />
        </FieldWrapper>
      </section>

      {/* Extra Info */}
      <section>
        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
          Additional Notes
        </label>
        <FieldWrapper fieldName="extra_info">
          <textarea
            className={`${baseInputClass} bg-gray-50 ${disabledClass} ${getFieldAnimation('extra_info')}`}
            rows={2}
            value={note.extra_info}
            onChange={(e) => handleChange('extra_info', e.target.value)}
            placeholder="Other information mentioned but not included above..."
            disabled={disabled}
          />
        </FieldWrapper>
      </section>
    </div>
  );
}
