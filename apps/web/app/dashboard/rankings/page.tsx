import RankingsPageClient from '@/components/dashboard/pages/RankingsPageClient';
import { getOrganizationNameForDashboard } from '@/lib/dashboard/get-organization-name';

export const dynamic = 'force-dynamic';

export default async function DashboardRankingsPage() {
  const organizationName = await getOrganizationNameForDashboard();
  return <RankingsPageClient organizationName={organizationName} />;
}
