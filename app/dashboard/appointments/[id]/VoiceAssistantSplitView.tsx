'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { saveTranscriptionAndStructuredNote } from '@/app/actions/chart';
import { saveCdiChartInfo } from '@/app/actions/cdi';
import StructuredNoteForm from './StructuredNoteForm';
import CdiReviewModal from './CdiReviewModal';
import CdiDiffEditor from './CdiDiffEditor';
import { StructuredNote, emptyStructuredNote } from './types';

/**
 * Serialized chart info from database
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
 * Serialized CDI chart info from database
 */
interface SerializedCdiChartInfo extends SerializedChartInfo {
  cdiStatus: string | null;
  cdiReviewedAt: string | null;
  cdiNotes: string | null;
  assessment: string | null;
  clinicalImpression: string | null;
}

interface VoiceAssistantSplitViewProps {
  appointmentId: number;
  initialChartInfo: SerializedChartInfo | null;
  initialCdiChartInfo: SerializedCdiChartInfo | null;
}

type ViewState = 'idle' | 'recording' | 'processing' | 'filling' | 'review';
type CdiViewState = 'none' | 'processing' | 'results';

interface CdiChartData {
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
  cdiNotes?: string;
}

/** Field animation order for the magical auto-fill effect */
const FIELD_ORDER = [
  'chief_complaint',
  'history_of_present_illness',
  'history.past_medical_history',
  'history.surgical_history',
  'history.family_history',
  'history.social_history',
  'review_of_systems',
  'physical_exam',
  'vitals',
  'diagnosis',
  'plan',
  'extra_info',
];

/**
 * Parses existing chart data into StructuredNote format
 */
function parseChartInfoToStructuredNote(chartInfo: SerializedChartInfo): StructuredNote {
  // Parse history text back to structured format
  const historyText = chartInfo.history || '';
  const parseHistoryField = (label: string): string => {
    const regex = new RegExp(`${label}:\\s*([\\s\\S]*?)(?=(?:Past Medical History:|Surgical History:|Family History:|Social History:|$))`, 'i');
    const match = historyText.match(regex);
    return match ? match[1].trim() : '';
  };

  // Parse vitals text
  const vitalsText = chartInfo.vitalSigns || '';
  const parseVitalField = (label: string): string => {
    const regex = new RegExp(`${label}:\\s*([^,]+)`, 'i');
    const match = vitalsText.match(regex);
    return match ? match[1].trim() : '-';
  };

  // Parse diagnosis text
  const diagnosisText = chartInfo.diagnosis || '';
  const diagnosisEntries = diagnosisText.split(/\d+\.\s+/).filter(Boolean);
  const diagnoses = diagnosisEntries.map(entry => {
    const [name, ...treatmentParts] = entry.split(/\n\s*Treatment:\s*/i);
    return {
      diagnosis_name: name.trim(),
      treatment: treatmentParts.join(' ').trim(),
    };
  });

  return {
    chief_complaint: chartInfo.chiefComplient || '',
    history_of_present_illness: chartInfo.historyOfIllness || '',
    history: {
      past_medical_history: parseHistoryField('Past Medical History'),
      surgical_history: parseHistoryField('Surgical History'),
      family_history: parseHistoryField('Family History'),
      social_history: parseHistoryField('Social History'),
    },
    review_of_systems: chartInfo.ros || '',
    physical_exam: chartInfo.physicalExam || '',
    vitals: {
      height: parseVitalField('Height'),
      weight: parseVitalField('Weight'),
      bmi: parseVitalField('BMI'),
      bp: parseVitalField('Blood Pressure'),
    },
    diagnosis: diagnoses.length > 0 ? diagnoses : [{ diagnosis_name: '', treatment: '' }],
    plan: chartInfo.plan || '',
    extra_info: '',
  };
}

/**
 * Split view component for clinical documentation
 * Shows only form if transcription exists, otherwise shows split view
 * Prioritizes CDI chart info over regular chart info when both exist
 */
export default function VoiceAssistantSplitView({ 
  appointmentId,
  initialChartInfo,
  initialCdiChartInfo
}: VoiceAssistantSplitViewProps) {
  // Determine if we have CDI data (prioritize CDI over regular chart info)
  const hasCdiData = Boolean(initialCdiChartInfo);
  
  // Use CDI data if available, otherwise use regular chart info
  const activeChartInfo = hasCdiData ? initialCdiChartInfo : initialChartInfo;
  
  // Determine if we have existing transcription
  const hasExistingTranscription = Boolean(activeChartInfo?.rawTranscription);
  
  // Initialize structured note from existing data or empty
  const initialNote = activeChartInfo && hasExistingTranscription
    ? parseChartInfoToStructuredNote(activeChartInfo)
    : emptyStructuredNote;

  const [structuredNote, setStructuredNote] = useState<StructuredNote>(initialNote);
  const [showVoicePanel, setShowVoicePanel] = useState(!hasExistingTranscription);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [editableTranscript, setEditableTranscript] = useState('');
  const [viewState, setViewState] = useState<ViewState>('idle');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [recognition, setRecognition] = useState<any>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [animatingField, setAnimatingField] = useState<string | null>(null);
  const [fillingProgress, setFillingProgress] = useState(0);
  const [showCdiModal, setShowCdiModal] = useState(false);
  const [cdiViewState, setCdiViewState] = useState<CdiViewState>('none');
  const [cdiOriginalData, setCdiOriginalData] = useState<CdiChartData | null>(null);
  const [cdiImprovedData, setCdiImprovedData] = useState<CdiChartData | null>(null);
  const [cdiError, setCdiError] = useState<string | null>(null);
  const [cdiSaving, setCdiSaving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const formScrollRef = useRef<HTMLDivElement>(null);

  // Format CDI review date for display
  const cdiReviewedDate = initialCdiChartInfo?.cdiReviewedAt 
    ? new Date(initialCdiChartInfo.cdiReviewedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : null;

  // Prepare chart data for CDI review (use original chart info, not CDI)
  const chartDataForCdi: CdiChartData = {
    chiefComplient: initialChartInfo?.chiefComplient,
    historyOfIllness: initialChartInfo?.historyOfIllness,
    history: initialChartInfo?.history,
    ros: initialChartInfo?.ros,
    physicalExam: initialChartInfo?.physicalExam,
    vitalSigns: initialChartInfo?.vitalSigns,
    diagnosis: initialChartInfo?.diagnosis,
    plan: initialChartInfo?.plan,
  };

  /** Handles CDI option selection from modal */
  const handleCdiOptionSelect = async (option: 1 | 2) => {
    if (option === 1) {
      setCdiViewState('processing');
      setCdiError(null);
      
      try {
        const response = await fetch('/api/cdi/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chartData: chartDataForCdi }),
        });

        if (!response.ok) {
          throw new Error('Failed to process CDI review');
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'CDI processing failed');
        }

        setCdiOriginalData(result.originalData);
        setCdiImprovedData(result.data);
        setCdiViewState('results');
      } catch (err) {
        setCdiError(err instanceof Error ? err.message : 'An error occurred');
        setCdiViewState('none');
      }
    }
    // Option 2 is coming soon
  };

  /** Handles saving CDI data and going back to normal view */
  const handleCdiProceed = async () => {
    if (!cdiImprovedData) return;

    setCdiSaving(true);
    try {
      // Convert null values to undefined for the server action
      const cleanedCdiData = {
        chiefComplient: cdiImprovedData.chiefComplient || undefined,
        historyOfIllness: cdiImprovedData.historyOfIllness || undefined,
        history: cdiImprovedData.history || undefined,
        ros: cdiImprovedData.ros || undefined,
        physicalExam: cdiImprovedData.physicalExam || undefined,
        vitalSigns: cdiImprovedData.vitalSigns || undefined,
        diagnosis: cdiImprovedData.diagnosis || undefined,
        plan: cdiImprovedData.plan || undefined,
        assessment: cdiImprovedData.assessment || undefined,
        clinicalImpression: cdiImprovedData.clinicalImpression || undefined,
        cdiNotes: cdiImprovedData.cdiNotes || undefined,
      };
      
      const result = await saveCdiChartInfo(
        appointmentId,
        cleanedCdiData,
        initialChartInfo?.rawTranscription || undefined
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to save');
      }

      // Reset CDI view and go back to normal
      setCdiViewState('none');
      setCdiOriginalData(null);
      setCdiImprovedData(null);
    } catch (err) {
      setCdiError(err instanceof Error ? err.message : 'Failed to save CDI data');
    } finally {
      setCdiSaving(false);
    }
  };

  /** Cancels CDI review and goes back to normal view */
  const handleCdiCancel = () => {
    setCdiViewState('none');
    setCdiOriginalData(null);
    setCdiImprovedData(null);
    setCdiError(null);
  };

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rec.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rec.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        setViewState('idle');
      };

      rec.onend = () => {
        setIsListening(false);
      };

      setRecognition(rec);
    }
  }, []);

  const startRecording = () => {
    if (!recognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    setTranscript('');
    setEditableTranscript('');
    recognition.start();
    setIsListening(true);
    setViewState('recording');
    setSaveStatus('idle');
  };

  const stopRecording = () => {
    if (recognition) {
      recognition.stop();
    }
    setIsListening(false);
    setEditableTranscript(transcript);
    setViewState('review');
  };

  /**
   * Animate filling fields one by one with magical effect
   */
  const animateFieldFilling = async (data: StructuredNote) => {
    setViewState('filling');
    setFillingProgress(0);
    
    let currentNote = { ...emptyStructuredNote };
    setStructuredNote(currentNote);

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    for (let i = 0; i < FIELD_ORDER.length; i++) {
      const field = FIELD_ORDER[i];
      setAnimatingField(field);
      setFillingProgress(Math.round(((i + 1) / FIELD_ORDER.length) * 100));
      
      if (formScrollRef.current) {
        const fieldElement = formScrollRef.current.querySelector(`[data-field="${field}"]`);
        if (fieldElement) {
          fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }

      await delay(150);
      
      if (field === 'chief_complaint') {
        currentNote = { ...currentNote, chief_complaint: data.chief_complaint };
      } else if (field === 'history_of_present_illness') {
        currentNote = { ...currentNote, history_of_present_illness: data.history_of_present_illness };
      } else if (field === 'history.past_medical_history') {
        currentNote = { 
          ...currentNote, 
          history: { ...currentNote.history, past_medical_history: data.history.past_medical_history }
        };
      } else if (field === 'history.surgical_history') {
        currentNote = { 
          ...currentNote, 
          history: { ...currentNote.history, surgical_history: data.history.surgical_history }
        };
      } else if (field === 'history.family_history') {
        currentNote = { 
          ...currentNote, 
          history: { ...currentNote.history, family_history: data.history.family_history }
        };
      } else if (field === 'history.social_history') {
        currentNote = { 
          ...currentNote, 
          history: { ...currentNote.history, social_history: data.history.social_history }
        };
      } else if (field === 'review_of_systems') {
        currentNote = { ...currentNote, review_of_systems: data.review_of_systems };
      } else if (field === 'physical_exam') {
        currentNote = { ...currentNote, physical_exam: data.physical_exam };
      } else if (field === 'vitals') {
        currentNote = { ...currentNote, vitals: data.vitals };
      } else if (field === 'diagnosis') {
        currentNote = { ...currentNote, diagnosis: data.diagnosis };
      } else if (field === 'plan') {
        currentNote = { ...currentNote, plan: data.plan };
      } else if (field === 'extra_info') {
        currentNote = { ...currentNote, extra_info: data.extra_info || '' };
      }
      
      setStructuredNote({ ...currentNote });
      await delay(350);
    }
    
    setAnimatingField(null);
    await delay(500);
  };

  /**
   * Process transcription with OpenAI and save to database
   */
  const handleProcessAndSave = async () => {
    if (!editableTranscript.trim()) return;
    
    setViewState('processing');
    setProcessingStatus('Analyzing with AI...');
    
    try {
      const response = await fetch('/api/transcription/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcription: editableTranscript }),
      });

      if (!response.ok) {
        throw new Error('Failed to process transcription');
      }

      const result = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Processing failed');
      }

      setProcessingStatus('Extracting clinical data...');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      await animateFieldFilling(result.data);
      
      setProcessingStatus('Saving to database...');
      
      const saveResult = await saveTranscriptionAndStructuredNote(
        appointmentId,
        editableTranscript,
        result.data
      );

      if (!saveResult.success) {
        throw new Error(saveResult.error || 'Failed to save');
      }

      setSaveStatus('success');
      setProcessingStatus('Complete!');
      
      setTimeout(() => {
        setViewState('idle');
        setTranscript('');
        setEditableTranscript('');
        setSaveStatus('idle');
        setProcessingStatus('');
        setFillingProgress(0);
        setShowVoicePanel(false); // Hide voice panel after successful save
      }, 2000);

    } catch (error) {
      console.error('Processing error:', error);
      setSaveStatus('error');
      setProcessingStatus('Error processing transcription');
      setViewState('review');
    }
  };

  const resetSession = () => {
    setViewState('idle');
    setTranscript('');
    setEditableTranscript('');
    setSaveStatus('idle');
    setProcessingStatus('');
    setAnimatingField(null);
    setFillingProgress(0);
  };

  const isFormDisabled = viewState === 'recording' || viewState === 'processing' || viewState === 'filling';

  // Full width form when voice panel is hidden
  if (!showVoicePanel) {
    return (
      <div className="flex h-full w-full overflow-hidden bg-white rounded-3xl shadow-[0_8px_60px_-12px_rgba(0,0,0,0.08)] border border-gray-100">
        {/* CDI Processing Overlay */}
        <AnimatePresence>
          {cdiViewState === 'processing' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center rounded-3xl"
            >
              <div className="w-20 h-20 mb-6 relative">
                <motion.div 
                  className="absolute inset-0 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  style={{ 
                    background: 'conic-gradient(from 0deg, #6366f1, #a855f7, #ec4899, #6366f1)',
                    maskImage: 'radial-gradient(transparent 60%, black 60%)',
                    WebkitMaskImage: 'radial-gradient(transparent 60%, black 60%)'
                  }}
                />
                <div className="absolute inset-3 rounded-full bg-white flex items-center justify-center">
                  <motion.span
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-2xl"
                  >
                    🔍
                  </motion.span>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Analyzing Documentation</h3>
              <p className="text-gray-400 text-sm text-center max-w-sm">
                AI is reviewing your clinical documentation and applying CDI best practices...
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CDI Results View */}
        {cdiViewState === 'results' && cdiOriginalData && cdiImprovedData ? (
          <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-50 to-white relative">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100/80 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">CDI Review Results</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Edit the improved fields below, then proceed to save</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleCdiCancel}
                  className="px-4 py-2.5 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCdiProceed}
                  disabled={cdiSaving}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl text-sm font-semibold 
                    shadow-lg shadow-indigo-100 hover:shadow-xl transition-all disabled:opacity-70"
                >
                  {cdiSaving ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span>Proceed & Save</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Error message */}
            {cdiError && (
              <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {cdiError}
              </div>
            )}
            
            {/* CDI Diff Editor */}
            <div className="flex-1 overflow-hidden">
              <CdiDiffEditor
                originalData={cdiOriginalData}
                cdiData={cdiImprovedData}
                onCdiDataChange={setCdiImprovedData}
              />
            </div>
          </div>
        ) : (
          /* Normal Form View */
          <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-50 to-white relative">
            <div className="px-6 py-4 border-b border-gray-100/80 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                {hasCdiData && (
                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs font-bold text-emerald-700">CDI Reviewed</span>
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {hasCdiData ? 'CDI-Compliant Documentation' : 'Clinical Documentation'}
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {hasCdiData && cdiReviewedDate
                      ? `Reviewed on ${cdiReviewedDate}`
                      : activeChartInfo?.rawTranscription 
                        ? 'Transcription on file' 
                        : 'Structured Note Fields'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowVoicePanel(true)}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-gray-100 text-gray-600 rounded-2xl text-sm font-semibold hover:bg-gray-200 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-20a3 3 0 013 3v10a3 3 0 01-6 0V4a3 3 0 013-3z" />
                  </svg>
                  <span>New Recording</span>
                </button>
                <button 
                  onClick={() => setShowCdiModal(true)}
                  className={`flex items-center space-x-2 px-5 py-2.5 rounded-2xl text-sm font-semibold shadow-lg transition-all ${
                    hasCdiData 
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-100 hover:shadow-xl'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-indigo-100 hover:shadow-xl'
                  }`}
                >
                  {hasCdiData ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Regenerate CDI</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>CDI Review</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* CDI Notes Banner */}
            {hasCdiData && initialCdiChartInfo?.cdiNotes && (
              <div className="mx-6 mt-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-emerald-800">CDI Review Notes</p>
                    <p className="text-xs text-emerald-600 mt-1">
                      {initialCdiChartInfo.cdiNotes}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Show existing transcription preview */}
            {activeChartInfo?.rawTranscription && (
              <div className="mx-6 mt-4 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-blue-800">Original Transcription</p>
                    <p className="text-xs text-blue-600 mt-1 line-clamp-2">
                      {activeChartInfo.rawTranscription}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={formScrollRef} className="flex-1 overflow-y-auto relative scroll-smooth">
              <StructuredNoteForm
                note={structuredNote}
                onChange={setStructuredNote}
                disabled={false}
                animatingField={null}
              />
            </div>
          </div>
        )}

        {/* CDI Review Modal - Simple option selector */}
        <CdiReviewModal
          isOpen={showCdiModal}
          onClose={() => setShowCdiModal(false)}
          onSelectOption={handleCdiOptionSelect}
        />
      </div>
    );
  }

  // Split view with voice panel
  return (
    <div className="flex h-full w-full overflow-hidden bg-white rounded-3xl shadow-[0_8px_60px_-12px_rgba(0,0,0,0.08)] border border-gray-100">
      
      {/* LEFT HALF: STRUCTURED CLINICAL DOCUMENTATION */}
      <div className="w-1/2 flex flex-col border-r border-gray-100 bg-gradient-to-br from-slate-50 to-white relative">
        {/* Filling Progress Overlay */}
        <AnimatePresence>
          {viewState === 'filling' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 pointer-events-none"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200">
                <motion.div 
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                  initial={{ width: '0%' }}
                  animate={{ width: `${fillingProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="px-6 py-4 border-b border-gray-100/80 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Clinical Documentation</h2>
            <p className="text-xs text-gray-400 mt-0.5">Structured Note Fields</p>
          </div>
          <div className="flex items-center space-x-3">
            {viewState === 'filling' && (
              <motion.span 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold"
              >
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="mr-2"
                >
                  ✨
                </motion.span>
                AI Filling {fillingProgress}%
              </motion.span>
            )}
            <button 
              onClick={() => setShowCdiModal(true)}
              disabled={isFormDisabled}
              className={`flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl text-sm font-semibold 
                shadow-lg shadow-indigo-100 hover:shadow-xl transition-all
                ${isFormDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>CDI Review</span>
            </button>
          </div>
        </div>
        
        <div ref={formScrollRef} className="flex-1 overflow-y-auto relative scroll-smooth">
          <StructuredNoteForm
            note={structuredNote}
            onChange={setStructuredNote}
            disabled={isFormDisabled}
            animatingField={animatingField}
          />
        </div>
      </div>

      {/* RIGHT HALF: VOICE AI AGENT */}
      <div className="w-1/2 flex flex-col bg-gradient-to-br from-blue-50/40 via-white to-indigo-50/30 relative overflow-hidden">
        
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-100/40 to-indigo-100/30 rounded-full blur-3xl -mr-40 -mt-40" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-indigo-100/30 to-blue-50/20 rounded-full blur-3xl -ml-32 -mb-32" />

        <div className="relative z-10 flex flex-col h-full">
          
          {/* Header */}
          <div className="px-8 py-5 border-b border-gray-100/80 flex justify-between items-center bg-white/60 backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200/50">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-20a3 3 0 013 3v10a3 3 0 01-6 0V4a3 3 0 013-3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Medidoc AI</h2>
                <p className="text-xs text-gray-400 font-medium">Voice Transcription</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {hasExistingTranscription && viewState === 'idle' && (
                <button 
                  onClick={() => setShowVoicePanel(false)}
                  className="text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors px-3 py-1.5 hover:bg-gray-100 rounded-xl"
                >
                  Close
                </button>
              )}
              {viewState !== 'idle' && viewState !== 'processing' && viewState !== 'filling' && (
                <button 
                  onClick={resetSession}
                  className="text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors px-3 py-1.5 hover:bg-gray-100 rounded-xl"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* IDLE STATE */}
            {viewState === 'idle' && (
              <motion.div 
                key="idle"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex-1 flex flex-col items-center justify-center p-8"
              >
                <div className="text-center mb-10">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Ready to Transcribe</h3>
                  <p className="text-gray-400 text-sm max-w-xs">
                    Click the button below to start recording your clinical observations
                  </p>
                </div>

                <button
                  onClick={startRecording}
                  className="group relative w-36 h-36 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-indigo-200/60 hover:shadow-indigo-300/70 hover:scale-105 transition-all duration-300"
                >
                  <div className="absolute inset-0 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors" />
                  <svg className="w-14 h-14 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-20a3 3 0 013 3v10a3 3 0 01-6 0V4a3 3 0 013-3z" />
                  </svg>
                  <div className="absolute inset-0 rounded-full border-2 border-indigo-300 animate-ping opacity-20" />
                </button>

                <p className="mt-8 text-xs text-gray-400 font-medium">Tap to start AI transcription</p>
              </motion.div>
            )}

            {/* RECORDING STATE */}
            {viewState === 'recording' && (
              <motion.div 
                key="recording"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex-1 flex flex-col p-6"
              >
                <div className="flex items-center justify-center space-x-3 mb-6">
                  <span className="flex items-center px-4 py-2 bg-red-50 border border-red-100 rounded-2xl">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse" />
                    <span className="text-xs font-bold text-red-600 uppercase tracking-wide">Recording</span>
                  </span>
                </div>

                {/* Live Waveform */}
                <div className="flex items-center justify-center space-x-1 h-16 mb-6">
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        height: [12, Math.random() * 40 + 20, 12],
                      }}
                      transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        delay: i * 0.08,
                        ease: "easeInOut"
                      }}
                      className="w-1.5 bg-gradient-to-t from-indigo-500 to-blue-400 rounded-full"
                    />
                  ))}
                </div>

                {/* Live Transcript */}
                <div 
                  ref={scrollRef}
                  className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-inner p-6 overflow-y-auto"
                >
                  <p className={`text-lg leading-relaxed ${transcript ? 'text-gray-700' : 'text-gray-300 italic'}`}>
                    {transcript || "Listening for clinical observations..."}
                  </p>
                  {transcript && (
                    <motion.span 
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="inline-block w-0.5 h-5 bg-indigo-500 ml-1 align-middle"
                    />
                  )}
                </div>

                <div className="mt-6 flex justify-center">
                  <button
                    onClick={stopRecording}
                    className="flex items-center space-x-3 px-8 py-4 bg-gray-900 text-white rounded-2xl font-semibold shadow-xl hover:bg-gray-800 transition-all"
                  >
                    <div className="w-4 h-4 bg-white rounded-sm" />
                    <span>Stop Recording</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* PROCESSING STATE */}
            {viewState === 'processing' && (
              <motion.div 
                key="processing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex-1 flex flex-col items-center justify-center p-8"
              >
                <div className="w-24 h-24 mb-8 relative">
                  <motion.div 
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    style={{ 
                      background: 'conic-gradient(from 0deg, #6366f1, #a855f7, #ec4899, #6366f1)',
                      maskImage: 'radial-gradient(transparent 60%, black 60%)',
                      WebkitMaskImage: 'radial-gradient(transparent 60%, black 60%)'
                    }}
                  />
                  <div className="absolute inset-3 rounded-full bg-white flex items-center justify-center">
                    <motion.span
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="text-3xl"
                    >
                      🧠
                    </motion.span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Processing Transcription</h3>
                <p className="text-gray-400 text-sm">{processingStatus}</p>
                
                <div className="flex space-x-1 mt-4">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-indigo-500 rounded-full"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* FILLING STATE */}
            {viewState === 'filling' && (
              <motion.div 
                key="filling"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex-1 flex flex-col items-center justify-center p-8"
              >
                <motion.div 
                  className="w-32 h-32 mb-8 relative"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl" />
                  <div className="absolute inset-2 bg-white rounded-2xl flex items-center justify-center shadow-inner">
                    <motion.span
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 10, -10, 0]
                      }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      className="text-5xl"
                    >
                      ✨
                    </motion.span>
                  </div>
                  
                  {/* Floating sparkles */}
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                      initial={{ 
                        x: 64, 
                        y: 64,
                        opacity: 0 
                      }}
                      animate={{
                        x: [64, 64 + Math.cos(i * 60 * Math.PI / 180) * 60],
                        y: [64, 64 + Math.sin(i * 60 * Math.PI / 180) * 60],
                        opacity: [0, 1, 0],
                        scale: [0.5, 1, 0.5]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.2
                      }}
                    />
                  ))}
                </motion.div>
                
                <h3 className="text-xl font-bold text-gray-800 mb-2">AI Magic in Progress</h3>
                <p className="text-gray-400 text-sm mb-4">Filling clinical documentation...</p>
                
                <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                    initial={{ width: '0%' }}
                    animate={{ width: `${fillingProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-xs text-indigo-600 font-bold mt-2">{fillingProgress}% Complete</p>
              </motion.div>
            )}

            {/* REVIEW STATE */}
            {viewState === 'review' && (
              <motion.div 
                key="review"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex-1 flex flex-col p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Transcription Complete</h3>
                      <p className="text-xs text-gray-400">Review and edit before processing</p>
                    </div>
                  </div>
                  <button
                    onClick={startRecording}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-1 px-3 py-1.5 hover:bg-indigo-50 rounded-xl transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Re-record</span>
                  </button>
                </div>

                {/* Editable Transcript */}
                <div className="flex-1 relative">
                  <textarea
                    className="w-full h-full bg-white rounded-3xl border border-gray-200 shadow-sm p-6 text-gray-700 text-lg leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 resize-none"
                    value={editableTranscript}
                    onChange={(e) => setEditableTranscript(e.target.value)}
                    placeholder="Your transcription will appear here..."
                  />
                  <div className="absolute bottom-4 right-4 text-xs text-gray-400 font-medium bg-white px-3 py-1.5 rounded-xl border border-gray-100">
                    {editableTranscript.trim().split(/\s+/).filter(Boolean).length} words
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex items-center justify-end">
                  <button
                    onClick={handleProcessAndSave}
                    disabled={saveStatus === 'saving' || !editableTranscript.trim()}
                    className={`flex items-center space-x-2 px-6 py-3.5 rounded-2xl font-semibold transition-all shadow-lg ${
                      saveStatus === 'success'
                        ? 'bg-emerald-500 text-white shadow-emerald-200'
                        : saveStatus === 'error'
                        ? 'bg-red-500 text-white shadow-red-200'
                        : 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-indigo-200 hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100'
                    }`}
                  >
                    {saveStatus === 'saving' ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span>Processing...</span>
                      </>
                    ) : saveStatus === 'success' ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Done!</span>
                      </>
                    ) : saveStatus === 'error' ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>Error - Try Again</span>
                      </>
                    ) : (
                      <>
                        <span className="text-lg">✨</span>
                        <span>Process with AI</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100/80 bg-white/40">
            <p className="text-[10px] text-gray-400 font-medium text-center tracking-wide">
              HIPAA Compliant • End-to-End Encrypted • Powered by Medidoc AI
            </p>
          </div>
        </div>
      </div>

      {/* CDI Review Modal - Simple option selector */}
      <CdiReviewModal
        isOpen={showCdiModal}
        onClose={() => setShowCdiModal(false)}
        onSelectOption={handleCdiOptionSelect}
      />
    </div>
  );
}
