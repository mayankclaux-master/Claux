import ReportsPageClient from '@/components/dashboard/pages/ReportsPageClient';
import { getOrganizationNameForDashboard } from '@/lib/dashboard/get-organization-name';

export const dynamic = 'force-dynamic';

export default async function DashboardReportsPage() {
  const organizationName = await getOrganizationNameForDashboard();
  return <ReportsPageClient organizationName={organizationName} />;
}
