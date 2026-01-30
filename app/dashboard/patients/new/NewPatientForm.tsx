'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createPatientWithAppointment } from '@/app/actions/patient';

interface Provider {
  providerId: number;
  providerName: string;
  specialty: string | null;
}

interface AppointmentType {
  appointmentTypeId: number;
  appointmentType: string;
}

interface NewPatientFormProps {
  providers: Provider[];
  appointmentTypes: AppointmentType[];
}

type Step = 'patient' | 'appointment' | 'processing' | 'complete';

/** Month names for the date picker */
const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

/** Generate array of years from current year back to 120 years ago */
function generateYears(): number[] {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let year = currentYear; year >= currentYear - 120; year--) {
    years.push(year);
  }
  return years;
}

/** Get number of days in a given month/year */
function getDaysInMonth(month: number, year: number): number {
  if (!month || !year) return 31;
  return new Date(year, month, 0).getDate();
}

export default function NewPatientForm({ providers, appointmentTypes }: NewPatientFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('patient');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdAppointmentId, setCreatedAppointmentId] = useState<number | null>(null);

  // Date of birth separate state
  const [dobMonth, setDobMonth] = useState<number>(0);
  const [dobDay, setDobDay] = useState<number>(0);
  const [dobYear, setDobYear] = useState<number>(0);

  // Generate years list
  const years = useMemo(() => generateYears(), []);

  // Calculate days based on selected month and year
  const daysInMonth = useMemo(() => {
    return getDaysInMonth(dobMonth, dobYear || new Date().getFullYear());
  }, [dobMonth, dobYear]);

  // Generate days array
  const days = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }, [daysInMonth]);

  // Format date of birth as ISO string for storage
  const formattedDateOfBirth = useMemo(() => {
    if (dobYear && dobMonth && dobDay) {
      const month = dobMonth.toString().padStart(2, '0');
      const day = dobDay.toString().padStart(2, '0');
      return `${dobYear}-${month}-${day}`;
    }
    return '';
  }, [dobYear, dobMonth, dobDay]);

  // Patient form state
  const [patientData, setPatientData] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    insuranceProvider: '',
    insurancePolicyNumber: '',
  });

  // Update dateOfBirth when DOB components change
  const updatePatientDOB = () => {
    setPatientData(prev => ({ ...prev, dateOfBirth: formattedDateOfBirth }));
  };

  // Appointment form state
  const [appointmentData, setAppointmentData] = useState({
    providerId: providers[0]?.providerId || 0,
    appointmentTypeId: appointmentTypes[0]?.appointmentTypeId || 0,
    appointmentDate: new Date().toISOString().slice(0, 16),
  });

  const handlePatientChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setPatientData({ ...patientData, [e.target.name]: e.target.value });
  };

  // Handle DOB month change
  const handleDobMonthChange = (value: number) => {
    setDobMonth(value);
    // Reset day if it exceeds the new month's days
    const newDaysInMonth = getDaysInMonth(value, dobYear || new Date().getFullYear());
    if (dobDay > newDaysInMonth) {
      setDobDay(newDaysInMonth);
    }
  };

  const handleAppointmentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.name.includes('Id') ? parseInt(e.target.value) : e.target.value;
    setAppointmentData({ ...appointmentData, [e.target.name]: value });
  };

  const goToAppointmentStep = () => {
    if (!patientData.fullName.trim()) {
      setError('Patient name is required');
      return;
    }
    // Update DOB before proceeding
    setPatientData(prev => ({ ...prev, dateOfBirth: formattedDateOfBirth }));
    setError('');
    setStep('appointment');
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');
    setStep('processing');

    const result = await createPatientWithAppointment(
      patientData,
      appointmentData.appointmentDate,
      appointmentData.appointmentTypeId,
      appointmentData.providerId
    );

    if (result.success && result.appointmentId) {
      setCreatedAppointmentId(result.appointmentId);
      setStep('complete');
    } else {
      setError(result.error || 'Failed to create patient');
      setStep('appointment');
    }
    setIsSubmitting(false);
  };

  const goToTranscription = () => {
    if (createdAppointmentId) {
      router.push(`/dashboard/appointments/${createdAppointmentId}`);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Progress Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-8 py-6">
        <h1 className="text-2xl font-bold text-white mb-4">New Patient Registration</h1>
        <div className="flex items-center space-x-4">
          {['patient', 'appointment', 'complete'].map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step === s || (s === 'patient' && step === 'appointment') || step === 'complete'
                  ? 'bg-white text-indigo-600'
                  : 'bg-white/20 text-white/60'
              }`}>
                {step === 'complete' && s !== 'complete' ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : i + 1}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                step === s ? 'text-white' : 'text-white/60'
              }`}>
                {s === 'patient' ? 'Patient Info' : s === 'appointment' ? 'Schedule' : 'Done'}
              </span>
              {i < 2 && <div className="w-12 h-0.5 bg-white/20 mx-4" />}
            </div>
          ))}
        </div>
      </div>

      <div className="p-8">
        <AnimatePresence mode="wait">
          {/* STEP 1: Patient Information */}
          {step === 'patient' && (
            <motion.div
              key="patient"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Patient Information</h2>
                <p className="text-gray-500 text-sm">Enter the patient's basic details</p>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={patientData.fullName}
                    onChange={handlePatientChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    placeholder="John Doe"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
                  <div className="grid grid-cols-3 gap-3">
                    {/* Month Selector */}
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Month</label>
                      <select
                        value={dobMonth}
                        onChange={(e) => handleDobMonthChange(parseInt(e.target.value))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all bg-white"
                      >
                        <option value={0}>Select month</option>
                        {MONTHS.map((month) => (
                          <option key={month.value} value={month.value}>
                            {month.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Day Selector */}
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Day</label>
                      <select
                        value={dobDay}
                        onChange={(e) => setDobDay(parseInt(e.target.value))}
                        disabled={!dobMonth}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all bg-white disabled:bg-gray-50 disabled:cursor-not-allowed"
                      >
                        <option value={0}>Select day</option>
                        {days.map((day) => (
                          <option key={day} value={day}>
                            {day}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Year Selector */}
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Year</label>
                      <select
                        value={dobYear}
                        onChange={(e) => setDobYear(parseInt(e.target.value))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all bg-white"
                      >
                        <option value={0}>Select year</option>
                        {years.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {/* Show formatted date preview */}
                  {formattedDateOfBirth && (
                    <p className="text-xs text-indigo-600 mt-2 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Selected: {MONTHS.find(m => m.value === dobMonth)?.label} {dobDay}, {dobYear}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
                  <select
                    name="gender"
                    value={patientData.gender}
                    onChange={handlePatientChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all bg-white"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={patientData.phone}
                    onChange={handlePatientChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={patientData.email}
                    onChange={handlePatientChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    placeholder="john@example.com"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={patientData.address}
                    onChange={handlePatientChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    placeholder="123 Main St, City, State 12345"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Insurance Provider</label>
                  <input
                    type="text"
                    name="insuranceProvider"
                    value={patientData.insuranceProvider}
                    onChange={handlePatientChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Blue Cross"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Policy Number</label>
                  <input
                    type="text"
                    name="insurancePolicyNumber"
                    value={patientData.insurancePolicyNumber}
                    onChange={handlePatientChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    placeholder="ABC123456789"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={goToAppointmentStep}
                  className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 hover:shadow-xl transition-all flex items-center space-x-2"
                >
                  <span>Next: Schedule Appointment</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Appointment Scheduling */}
          {step === 'appointment' && (
            <motion.div
              key="appointment"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Schedule Appointment</h2>
                <p className="text-gray-500 text-sm">Set up the appointment for {patientData.fullName}</p>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Provider</label>
                  <select
                    name="providerId"
                    value={appointmentData.providerId}
                    onChange={handleAppointmentChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all bg-white"
                  >
                    {providers.map((p) => (
                      <option key={p.providerId} value={p.providerId}>
                        {p.providerName} {p.specialty ? `(${p.specialty})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Visit Type</label>
                  <select
                    name="appointmentTypeId"
                    value={appointmentData.appointmentTypeId}
                    onChange={handleAppointmentChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all bg-white"
                  >
                    {appointmentTypes.map((t) => (
                      <option key={t.appointmentTypeId} value={t.appointmentTypeId}>
                        {t.appointmentType}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Appointment Date & Time</label>
                  <input
                    type="datetime-local"
                    name="appointmentDate"
                    value={appointmentData.appointmentDate}
                    onChange={handleAppointmentChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Summary Card */}
              <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-2xl p-6 border border-gray-100">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Patient:</span>
                    <span className="font-semibold text-gray-900">{patientData.fullName}</span>
                  </div>
                  {patientData.dateOfBirth && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">DOB:</span>
                      <span className="font-semibold text-gray-900">{patientData.dateOfBirth}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Provider:</span>
                    <span className="font-semibold text-gray-900">
                      {providers.find(p => p.providerId === appointmentData.providerId)?.providerName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Visit Type:</span>
                    <span className="font-semibold text-gray-900">
                      {appointmentTypes.find(t => t.appointmentTypeId === appointmentData.appointmentTypeId)?.appointmentType}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setStep('patient')}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Back</span>
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 hover:shadow-xl transition-all flex items-center space-x-2 disabled:opacity-50"
                >
                  <span>Create & Start Transcription</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Processing */}
          {step === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-16"
            >
              <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-6" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Creating Patient Record...</h2>
              <p className="text-gray-500">Please wait while we set up the appointment</p>
            </motion.div>
          )}

          {/* STEP 4: Complete */}
          {step === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-16"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-200">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Patient Created!</h2>
              <p className="text-gray-500 mb-8">Ready to start clinical documentation</p>

              <div className="flex space-x-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                >
                  Back to Dashboard
                </button>
                <button
                  onClick={goToTranscription}
                  className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 hover:shadow-xl transition-all flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-20a3 3 0 013 3v10a3 3 0 01-6 0V4a3 3 0 013-3z" />
                  </svg>
                  <span>Start Transcription</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
