import { prisma } from '@/lib/prisma';
import NewPatientForm from './NewPatientForm';

/**
 * New Patient Page
 * Server component that fetches required data and renders the form
 */
export default async function NewPatientPage() {
  // Fetch providers
  const providers = await prisma.provider.findMany({ 
    orderBy: { providerName: 'asc' } 
  });

  // Fetch appointment types using raw query (in case Prisma client is out of sync)
  const appointmentTypesRaw = await prisma.$queryRaw<{ 
    appointment_type_id: number; 
    appointment_type: string 
  }[]>`
    SELECT appointment_type_id, appointment_type 
    FROM t_kb_appointment_type 
    ORDER BY appointment_type ASC
  `;

  const appointmentTypes = appointmentTypesRaw.map(t => ({
    appointmentTypeId: t.appointment_type_id,
    appointmentType: t.appointment_type
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-8">
      <div className="max-w-4xl mx-auto">
        <NewPatientForm 
          providers={providers} 
          appointmentTypes={appointmentTypes} 
        />
      </div>
    </div>
  );
}
