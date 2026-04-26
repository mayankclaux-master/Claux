import TasksPageClient from '@/components/dashboard/pages/TasksPageClient';
import { getOrganizationNameForDashboard } from '@/lib/dashboard/get-organization-name';

export const dynamic = 'force-dynamic';

export default async function DashboardTasksPage() {
  const organizationName = await getOrganizationNameForDashboard();
  return <TasksPageClient organizationName={organizationName} />;
}
