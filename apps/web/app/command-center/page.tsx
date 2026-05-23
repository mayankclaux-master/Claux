/**
 * CLAUX Phase 2B — Command Centre Page
 * Minimal functional interface for human task execution
 * Real DB only, no mock data
 */

import { TaskTable } from '@/components/command-center/TaskTable';
import { TaskFilters } from '@/components/command-center/TaskFilters';

export default function CommandCenterPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Command Centre</h1>
        <p className="text-gray-600 mt-2">Human execution hub for SEO operations</p>
      </div>

      <TaskFilters />

      <div className="mt-6">
        <TaskTable />
      </div>
    </div>
  );
}
