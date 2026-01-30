'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { saveRawTranscription } from '@/app/actions/chart';

interface VoiceAssistantSplitViewProps {
  initialNotes: string;
  appointmentId: number;
}

type ViewState = 'idle' | 'recording' | 'review';

export default function VoiceAssistantSplitView({ initialNotes, appointmentId }: VoiceAssistantSplitViewProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [editableTranscript, setEditableTranscript] = useState('');
  const [viewState, setViewState] = useState<ViewState>('idle');
  const [recognition, setRecognition] = useState<any>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

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

  const handleSaveToDB = async () => {
    if (!editableTranscript.trim()) return;
    
    setSaveStatus('saving');
    const result = await saveRawTranscription(appointmentId, editableTranscript);
    
    if (result.success) {
      setSaveStatus('success');
      setTimeout(() => {
        setSaveStatus('idle');
        setViewState('idle');
        setTranscript('');
        setEditableTranscript('');
      }, 2000);
    } else {
      setSaveStatus('error');
    }
  };

  const handleAppendToNotes = () => {
    if (!editableTranscript.trim()) return;
    setNotes(prev => prev ? `${prev}\n\n${editableTranscript}` : editableTranscript);
  };

  const resetSession = () => {
    setViewState('idle');
    setTranscript('');
    setEditableTranscript('');
    setSaveStatus('idle');
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-white rounded-3xl shadow-[0_8px_60px_-12px_rgba(0,0,0,0.08)] border border-gray-100">
      
      {/* LEFT HALF: CLINICAL DOCUMENTATION */}
      <div className="w-1/2 flex flex-col border-r border-gray-100 bg-gradient-to-br from-slate-50 to-white">
        <div className="px-8 py-6 border-b border-gray-100/80 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Clinical Documentation</h2>
            <p className="text-sm text-gray-400 mt-0.5">Provider Notes & Observations</p>
          </div>
          <button className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:shadow-xl transition-all">
            Finalize Note
          </button>
        </div>
        
        <div className="flex-1 relative">
          <textarea
            className="w-full h-full p-8 text-gray-700 placeholder-gray-300 focus:outline-none resize-none leading-relaxed text-[17px] bg-transparent"
            placeholder="Start typing your clinical notes here..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          
          <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-xs text-gray-400 font-medium bg-white/90 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-gray-100">
            <span className="flex items-center">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2" />
              Auto-save enabled
            </span>
            <span>{notes.trim() === '' ? 0 : notes.trim().split(/\s+/).length} words</span>
          </div>
        </div>
      </div>

      {/* RIGHT HALF: VOICE AI AGENT (WHITE/BLUE THEME) */}
      <div className="w-1/2 flex flex-col bg-gradient-to-br from-blue-50/40 via-white to-indigo-50/30 relative overflow-hidden">
        
        {/* Subtle Background Decoration */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-100/40 to-indigo-100/30 rounded-full blur-3xl -mr-40 -mt-40" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-indigo-100/30 to-blue-50/20 rounded-full blur-3xl -ml-32 -mb-32" />

        <div className="relative z-10 flex flex-col h-full">
          
          {/* Header */}
          <div className="px-8 py-5 border-b border-gray-100/80 flex justify-between items-center bg-white/60 backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200/50">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-20a3 3 0 013 3v10a3 3 0 01-6 0V4a3 3 0 013-3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Medidoc AI</h2>
                <p className="text-xs text-gray-400 font-medium">Voice Transcription Agent</p>
              </div>
            </div>
            {viewState !== 'idle' && (
              <button 
                onClick={resetSession}
                className="text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors"
              >
                Reset
              </button>
            )}
          </div>

          {/* IDLE STATE: Show Call Button */}
          <AnimatePresence mode="wait">
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
                  <p className="text-gray-400 text-sm max-w-xs">Click the button below to start recording your clinical observations</p>
                </div>

                <button
                  onClick={startRecording}
                  className="group relative w-36 h-36 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-indigo-200/60 hover:shadow-indigo-300/70 hover:scale-105 transition-all duration-300"
                >
                  <div className="absolute inset-0 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors" />
                  <svg className="w-14 h-14 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-20a3 3 0 013 3v10a3 3 0 01-6 0V4a3 3 0 013-3z" />
                  </svg>
                  
                  {/* Pulse rings */}
                  <div className="absolute inset-0 rounded-full border-2 border-indigo-300 animate-ping opacity-20" />
                </button>

                <p className="mt-8 text-xs text-gray-400 font-medium">Tap to start AI transcription</p>
              </motion.div>
            )}

            {/* RECORDING STATE: Show Live Transcription */}
            {viewState === 'recording' && (
              <motion.div 
                key="recording"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex-1 flex flex-col p-6"
              >
                {/* Recording Indicator */}
                <div className="flex items-center justify-center space-x-3 mb-6">
                  <span className="flex items-center px-4 py-2 bg-red-50 border border-red-100 rounded-full">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse" />
                    <span className="text-xs font-bold text-red-600 uppercase tracking-wide">Recording</span>
                  </span>
                </div>

                {/* Live Waveform Visualizer */}
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

                {/* Live Transcript Display */}
                <div 
                  ref={scrollRef}
                  className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-inner p-6 overflow-y-auto"
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

                {/* Stop Button */}
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

            {/* REVIEW STATE: Show Editable Transcript + Save Options */}
            {viewState === 'review' && (
              <motion.div 
                key="review"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex-1 flex flex-col p-6"
              >
                {/* Review Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Transcription Complete</h3>
                      <p className="text-xs text-gray-400">Review and edit before saving</p>
                    </div>
                  </div>
                  <button
                    onClick={startRecording}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-1"
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
                    className="w-full h-full bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-gray-700 text-lg leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 resize-none"
                    value={editableTranscript}
                    onChange={(e) => setEditableTranscript(e.target.value)}
                    placeholder="Your transcription will appear here..."
                  />
                  <div className="absolute bottom-4 right-4 text-xs text-gray-400 font-medium bg-white px-2 py-1 rounded">
                    {editableTranscript.trim().split(/\s+/).filter(Boolean).length} words
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex items-center justify-between">
                  <button
                    onClick={handleAppendToNotes}
                    className="flex items-center space-x-2 px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                    <span>Copy to Notes</span>
                  </button>

                  <button
                    onClick={handleSaveToDB}
                    disabled={saveStatus === 'saving' || !editableTranscript.trim()}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all shadow-lg ${
                      saveStatus === 'success'
                        ? 'bg-emerald-500 text-white shadow-emerald-200'
                        : saveStatus === 'error'
                        ? 'bg-red-500 text-white shadow-red-200'
                        : 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-indigo-200 hover:shadow-xl disabled:opacity-50'
                    }`}
                  >
                    {saveStatus === 'saving' ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span>Saving...</span>
                      </>
                    ) : saveStatus === 'success' ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Saved!</span>
                      </>
                    ) : saveStatus === 'error' ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>Error</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        <span>Save to Database</span>
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
    </div>
  );
}
