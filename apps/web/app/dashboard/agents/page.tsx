import AgentsPageClient from '@/components/dashboard/pages/AgentsPageClient';
import { getOrganizationNameForDashboard } from '@/lib/dashboard/get-organization-name';

export const dynamic = 'force-dynamic';

export default async function DashboardAgentsPage() {
  const organizationName = await getOrganizationNameForDashboard();
  return <AgentsPageClient organizationName={organizationName} />;
}
