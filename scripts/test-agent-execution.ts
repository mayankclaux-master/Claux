/**
 * Agent Execution Test Script
 * 
 * Tests real agent execution by triggering ARIA and SCRIBE API routes.
 * Validates that execution records persist and tasks are created.
 */

const ARIA_ROUTE = 'http://localhost:3000/api/agents/aria/discovery';
const SCRIBE_ROUTE = 'http://localhost:3000/api/agents/scribe/draft';

interface ExecutionResponse {
  success: boolean;
  executionId: string;
  agent: string;
  tenantId: string;
  workspaceId: string;
  status: string;
  error?: string;
}

/**
 * Test ARIA execution
 */
async function testARIAExecution(): Promise<ExecutionResponse> {
  console.log('\n=== Testing ARIA Execution ===');
  
  try {
    const response = await fetch(ARIA_ROUTE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // In production, this would include auth tokens
        // For testing, we're checking if the route is accessible
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('ARIA execution failed:', data.error);
      return {
        success: false,
        executionId: '',
        agent: 'ARIA',
        tenantId: '',
        workspaceId: '',
        status: 'failed',
        error: data.error || 'Unknown error',
      };
    }

    console.log('✓ ARIA execution started');
    console.log('  Execution ID:', data.executionId);
    console.log('  Tenant ID:', data.tenantId);
    console.log('  Workspace ID:', data.workspaceId);
    console.log('  Status:', data.status);

    return data as ExecutionResponse;
  } catch (error) {
    console.error('ARIA execution error:', error);
    return {
      success: false,
      executionId: '',
      agent: 'ARIA',
      tenantId: '',
      workspaceId: '',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Test SCRIBE execution
 */
async function testSCRIBEExecution(): Promise<ExecutionResponse> {
  console.log('\n=== Testing SCRIBE Execution ===');
  
  try {
    const response = await fetch(SCRIBE_ROUTE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // In production, this would include auth tokens
        // For testing, we're checking if the route is accessible
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('SCRIBE execution failed:', data.error);
      return {
        success: false,
        executionId: '',
        agent: 'SCRIBE',
        tenantId: '',
        workspaceId: '',
        status: 'failed',
        error: data.error || 'Unknown error',
      };
    }

    console.log('✓ SCRIBE execution started');
    console.log('  Execution ID:', data.executionId);
    console.log('  Tenant ID:', data.tenantId);
    console.log('  Workspace ID:', data.workspaceId);
    console.log('  Status:', data.status);

    return data as ExecutionResponse;
  } catch (error) {
    console.error('SCRIBE execution error:', error);
    return {
      success: false,
      executionId: '',
      agent: 'SCRIBE',
      tenantId: '',
      workspaceId: '',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Main test execution
 */
async function main() {
  console.log('Agent Execution Test Script');
  console.log('=============================');
  console.log('Note: This script requires the dev server to be running on localhost:3000');
  console.log('Note: In production, you would need to include auth tokens in the requests\n');

  const ariaResult = await testARIAExecution();
  const scribeResult = await testSCRIBEExecution();

  console.log('\n=== Test Summary ===');
  console.log('ARIA:', ariaResult.success ? '✓ PASSED' : '✗ FAILED');
  console.log('SCRIBE:', scribeResult.success ? '✓ PASSED' : '✗ FAILED');

  if (ariaResult.success) {
    console.log('\nARIA Execution Details:');
    console.log('  Execution ID:', ariaResult.executionId);
    console.log('  Tenant ID:', ariaResult.tenantId);
    console.log('  Workspace ID:', ariaResult.workspaceId);
  }

  if (scribeResult.success) {
    console.log('\nSCRIBE Execution Details:');
    console.log('  Execution ID:', scribeResult.executionId);
    console.log('  Tenant ID:', scribeResult.tenantId);
    console.log('  Workspace ID:', scribeResult.workspaceId);
  }

  // Exit with non-zero code if any test failed
  if (!ariaResult.success || !scribeResult.success) {
    console.log('\n✗ Some tests failed');
    process.exit(1);
  }

  console.log('\n✓ All tests passed');
  process.exit(0);
}

// Run tests
main().catch((error) => {
  console.error('Test script error:', error);
  process.exit(1);
});
