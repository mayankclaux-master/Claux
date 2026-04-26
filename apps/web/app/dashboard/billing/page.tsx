import BillingPageClient from '@/components/dashboard/pages/BillingPageClient';
import { getOrganizationNameForDashboard } from '@/lib/dashboard/get-organization-name';

export const dynamic = 'force-dynamic';

export default async function DashboardBillingPage() {
  const organizationName = await getOrganizationNameForDashboard();
  return <BillingPageClient organizationName={organizationName} />;
}
