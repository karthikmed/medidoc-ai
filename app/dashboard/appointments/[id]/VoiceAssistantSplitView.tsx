'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { saveRawTranscription } from '@/app/actions/chart';

interface VoiceAssistantSplitViewProps {
  initialNotes: string;
  appointmentId: number;
}

export default function VoiceAssistantSplitView({ initialNotes, appointmentId }: VoiceAssistantSplitViewProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<any>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize Speech Recognition
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
        // Auto scroll to bottom of transcript
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      setRecognition(rec);
    }
  }, []);

  const toggleListening = () => {
    if (!recognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      setTranscript('');
      recognition.start();
      setIsListening(true);
      setSaveStatus('idle');
    }
  };

  const handleSaveToDB = async () => {
    if (!transcript.trim()) return;
    
    setSaveStatus('saving');
    const result = await saveRawTranscription(appointmentId, transcript);
    
    if (result.success) {
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } else {
      setSaveStatus('error');
    }
  };

  const handleAppendToNotes = () => {
    if (!transcript.trim()) return;
    setNotes(prev => prev ? `${prev}\n\n[Voice Note]: ${transcript}` : `[Voice Note]: ${transcript}`);
    setTranscript('');
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-white rounded-2xl shadow-2xl border border-gray-100">
      
      {/* LEFT HALF: PROVIDER NOTES / TASKS */}
      <div className="w-1/2 flex flex-col border-r border-gray-100 bg-gray-50/30">
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Clinical Documentation</h2>
            <p className="text-sm text-gray-500 font-medium">Provider Notes & Observations</p>
          </div>
          <button className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 transition-all">
            Finalize Note
          </button>
        </div>
        
        <div className="flex-1 relative">
          <textarea
            className="w-full h-full p-8 text-gray-800 placeholder-gray-400 focus:outline-none resize-none leading-relaxed text-lg bg-transparent font-medium"
            placeholder="Start typing your clinical notes here..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          
          <div className="absolute bottom-6 left-8 right-8 flex items-center justify-between text-xs text-gray-400 font-bold uppercase tracking-widest bg-white/80 backdrop-blur-sm p-3 rounded-lg border border-gray-50">
            <span className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
              Auto-Sync Enabled
            </span>
            <span>Words: {notes.trim() === '' ? 0 : notes.trim().split(/\s+/).length}</span>
          </div>
        </div>
      </div>

      {/* RIGHT HALF: VOICE AI ASSISTANT */}
      <div className="w-1/2 flex flex-col bg-gray-900 relative overflow-hidden">
        
        {/* Professional Wavy Background (inspired by image) */}
        <div className="absolute inset-0 z-0">
          <motion.div 
            animate={{ 
              scale: isListening ? [1, 1.1, 1] : 1,
              opacity: isListening ? [0.1, 0.2, 0.1] : 0.05
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-full blur-[120px]"
          />
        </div>

        <div className="relative z-10 flex flex-col h-full">
          {/* Header */}
          <div className="px-8 py-6 border-b border-white/10 flex justify-between items-center backdrop-blur-md">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center">
                <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3 animate-pulse" />
                Medidoc AI Agent
              </h2>
              <p className="text-sm text-gray-400 font-medium">Continuous Speech Transcription</p>
            </div>
            {isListening && (
              <span className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-[10px] font-bold uppercase tracking-widest animate-pulse">
                Live Recording
              </span>
            )}
          </div>

          {/* Center: Wavy Visualizer or Large Button */}
          <div className="flex-1 flex flex-col items-center justify-center p-12">
            
            <div className="relative flex items-center justify-center mb-12">
              <AnimatePresence>
                {isListening && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    {[1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.1, 0.3, 0.1],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          delay: i * 0.8,
                          ease: "easeInOut"
                        }}
                        className="absolute w-64 h-64 border-2 border-indigo-400/30 rounded-full"
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={toggleListening}
                className={`group relative z-10 w-48 h-48 rounded-full flex flex-col items-center justify-center transition-all duration-700 shadow-[0_0_80px_rgba(99,102,241,0.2)] ${
                  isListening 
                    ? 'bg-red-500/20 border-2 border-red-500 shadow-[0_0_100px_rgba(239,68,68,0.3)]' 
                    : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-105'
                }`}
              >
                <div className={`p-5 rounded-full mb-3 ${isListening ? 'bg-red-500' : 'bg-indigo-600'}`}>
                  {isListening ? (
                    <div className="w-8 h-8 flex items-center justify-center">
                      <div className="w-4 h-4 bg-white rounded-sm" />
                    </div>
                  ) : (
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-20a3 3 0 013 3v10a3 3 0 01-6 0V4a3 3 0 013-3z" />
                    </svg>
                  )}
                </div>
                <span className={`text-sm font-bold tracking-wider uppercase ${isListening ? 'text-red-400' : 'text-gray-300'}`}>
                  {isListening ? 'Stop' : 'Call AI Agent'}
                </span>
                
                {/* 50% Off Label (inspired by image) */}
                {!isListening && (
                  <p className="absolute -bottom-12 text-[10px] text-gray-500 font-bold uppercase tracking-widest whitespace-nowrap">
                    In-development calls are 50% off.
                  </p>
                )}
              </button>
            </div>

            {/* Transcript Area */}
            <div 
              ref={scrollRef}
              className="w-full max-w-xl h-48 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 overflow-y-auto scrollbar-hide flex flex-col"
            >
              <p className={`text-lg leading-relaxed ${transcript ? 'text-gray-200' : 'text-gray-500 italic'}`}>
                {transcript || "The AI agent is waiting for your clinical observations. Tap the button above to start transcribing..."}
              </p>
            </div>

            {/* Save Options */}
            <AnimatePresence>
              {transcript && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center space-x-4 mt-8"
                >
                  <button 
                    onClick={handleAppendToNotes}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl text-sm font-bold transition-all flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Append to Notes
                  </button>
                  <button 
                    onClick={handleSaveToDB}
                    disabled={saveStatus === 'saving'}
                    className={`px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center shadow-2xl ${
                      saveStatus === 'success' 
                        ? 'bg-green-500 text-white' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/30'
                    }`}
                  >
                    {saveStatus === 'saving' ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : saveStatus === 'success' ? (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Saved to Database
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        Save Raw Transcript
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Text */}
          <div className="px-8 py-4 border-t border-white/5 text-center">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
              HIPAA Compliant • End-to-End Encrypted • Powered by Medidoc AI
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
