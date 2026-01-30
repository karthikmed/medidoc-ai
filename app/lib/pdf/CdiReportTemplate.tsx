import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';

/**
 * CDI Report Data Interface
 */
export interface CdiReportData {
  // Patient Info
  patientName: string;
  patientId: number;
  dateOfBirth: string;
  gender: string;
  appointmentDate: string;
  appointmentId: number;
  
  // Clinical Data
  chiefComplaint: string | null;
  historyOfPresentIllness: string | null;
  history: string | null;
  reviewOfSystems: string | null;
  physicalExam: string | null;
  vitalSigns: string | null;
  assessment: string | null;
  clinicalImpression: string | null;
  diagnosis: string | null;
  plan: string | null;
  
  // CDI Metadata
  cdiStatus: string | null;
  cdiReviewedAt: string | null;
  cdiNotes: string | null;
}

/**
 * PDF Styles following medical documentation best practices
 */
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  // Header styles
  header: {
    borderBottom: '2px solid #1e40af',
    paddingBottom: 15,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#6b7280',
  },
  cdiBadge: {
    backgroundColor: '#059669',
    color: '#ffffff',
    padding: '4 10',
    borderRadius: 4,
    fontSize: 8,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  // Patient info section
  patientInfoSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    padding: 15,
    marginBottom: 20,
    border: '1px solid #e2e8f0',
  },
  patientInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  patientInfoItem: {
    width: '33%',
    marginBottom: 10,
  },
  patientInfoLabel: {
    fontSize: 8,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  patientInfoValue: {
    fontSize: 11,
    color: '#1f2937',
    fontWeight: 'bold',
  },
  // Section styles
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    backgroundColor: '#1e40af',
    color: '#ffffff',
    padding: '6 12',
    fontSize: 11,
    fontWeight: 'bold',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  sectionContent: {
    padding: 12,
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderTop: 'none',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    minHeight: 30,
  },
  sectionText: {
    fontSize: 10,
    color: '#374151',
    lineHeight: 1.6,
  },
  // Two column layout
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    width: '48%',
  },
  // CDI Notes section
  cdiNotesSection: {
    marginTop: 20,
    backgroundColor: '#ecfdf5',
    borderRadius: 6,
    padding: 15,
    border: '1px solid #a7f3d0',
  },
  cdiNotesHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#065f46',
    marginBottom: 8,
  },
  cdiNotesText: {
    fontSize: 9,
    color: '#047857',
    lineHeight: 1.5,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: '1px solid #e5e7eb',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
  },
  // No data message
  noDataSection: {
    padding: 20,
    backgroundColor: '#fef3c7',
    borderRadius: 6,
    border: '1px solid #fcd34d',
    marginBottom: 20,
  },
  noDataText: {
    fontSize: 10,
    color: '#92400e',
    textAlign: 'center',
  },
});

/**
 * Helper to check if a value has content
 */
function hasContent(value: string | null | undefined): boolean {
  return Boolean(value && value.trim().length > 0);
}

/**
 * Section Component - Only renders if content exists
 */
function Section({ 
  title, 
  content 
}: { 
  title: string; 
  content: string | null;
}) {
  if (!hasContent(content)) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionHeader}>{title}</Text>
      <View style={styles.sectionContent}>
        <Text style={styles.sectionText}>{content}</Text>
      </View>
    </View>
  );
}

/**
 * CDI Report PDF Template
 * Generates a professional medical report - only shows non-null fields
 */
export default function CdiReportTemplate({ data }: { data: CdiReportData }) {
  const generatedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Count how many clinical sections have data
  const clinicalFields = [
    data.chiefComplaint,
    data.historyOfPresentIllness,
    data.history,
    data.reviewOfSystems,
    data.physicalExam,
    data.vitalSigns,
    data.diagnosis,
    data.plan,
  ];
  const fieldsWithData = clinicalFields.filter(hasContent).length;

  // Check if we have physical exam and vitals for two-column layout
  const hasPhysicalExam = hasContent(data.physicalExam);
  const hasVitals = hasContent(data.vitalSigns);
  const showTwoColumnPhysical = hasPhysicalExam && hasVitals;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>CDI Clinical Documentation Report</Text>
          <Text style={styles.headerSubtitle}>
            CDI-Compliant Medical Documentation
          </Text>
          <View style={styles.cdiBadge}>
            <Text>CDI REVIEWED</Text>
          </View>
        </View>

        {/* Patient Information */}
        <View style={styles.patientInfoSection}>
          <View style={styles.patientInfoGrid}>
            <View style={styles.patientInfoItem}>
              <Text style={styles.patientInfoLabel}>Patient Name</Text>
              <Text style={styles.patientInfoValue}>{data.patientName}</Text>
            </View>
            <View style={styles.patientInfoItem}>
              <Text style={styles.patientInfoLabel}>Patient ID</Text>
              <Text style={styles.patientInfoValue}>#{data.patientId}</Text>
            </View>
            <View style={styles.patientInfoItem}>
              <Text style={styles.patientInfoLabel}>Date of Birth</Text>
              <Text style={styles.patientInfoValue}>{data.dateOfBirth}</Text>
            </View>
            <View style={styles.patientInfoItem}>
              <Text style={styles.patientInfoLabel}>Gender</Text>
              <Text style={styles.patientInfoValue}>{data.gender || 'N/A'}</Text>
            </View>
            <View style={styles.patientInfoItem}>
              <Text style={styles.patientInfoLabel}>Appointment Date</Text>
              <Text style={styles.patientInfoValue}>{data.appointmentDate}</Text>
            </View>
            <View style={styles.patientInfoItem}>
              <Text style={styles.patientInfoLabel}>Appointment ID</Text>
              <Text style={styles.patientInfoValue}>#{data.appointmentId}</Text>
            </View>
          </View>
        </View>

        {/* Show message if no clinical data */}
        {fieldsWithData === 0 && (
          <View style={styles.noDataSection}>
            <Text style={styles.noDataText}>
              No clinical documentation data available for this appointment.
            </Text>
          </View>
        )}

        {/* Chief Complaint */}
        <Section title="CHIEF COMPLAINT" content={data.chiefComplaint} />

        {/* History of Present Illness */}
        <Section 
          title="HISTORY OF PRESENT ILLNESS" 
          content={data.historyOfPresentIllness} 
        />

        {/* Medical History */}
        <Section title="MEDICAL HISTORY" content={data.history} />

        {/* Review of Systems */}
        <Section title="REVIEW OF SYSTEMS" content={data.reviewOfSystems} />

        {/* Physical Exam & Vitals - Two Column if both exist */}
        {showTwoColumnPhysical ? (
          <View style={styles.twoColumnRow}>
            <View style={styles.halfWidth}>
              <Section title="PHYSICAL EXAMINATION" content={data.physicalExam} />
            </View>
            <View style={styles.halfWidth}>
              <Section title="VITAL SIGNS" content={data.vitalSigns} />
            </View>
          </View>
        ) : (
          <>
            <Section title="PHYSICAL EXAMINATION" content={data.physicalExam} />
            <Section title="VITAL SIGNS" content={data.vitalSigns} />
          </>
        )}

        {/* Diagnosis */}
        <Section title="DIAGNOSIS & TREATMENT" content={data.diagnosis} />

        {/* Plan */}
        <Section title="PLAN" content={data.plan} />

        {/* CDI Notes - Always show if present */}
        {hasContent(data.cdiNotes) && (
          <View style={styles.cdiNotesSection}>
            <Text style={styles.cdiNotesHeader}>CDI Review Notes</Text>
            <Text style={styles.cdiNotesText}>{data.cdiNotes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Generated: {generatedDate}
          </Text>
          <Text style={styles.footerText}>
            CDI Status: {data.cdiStatus || 'Reviewed'} | 
            {data.cdiReviewedAt ? ` Reviewed: ${data.cdiReviewedAt}` : ''}
          </Text>
          <Text style={styles.footerText}>
            MediDoc AI - HIPAA Compliant
          </Text>
        </View>
      </Page>
    </Document>
  );
}
