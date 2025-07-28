/**
 * @fileoverview Onfleet Route Plan service using the standard Route Plan API
 * @source boombox-10.0/src/lib/services/onfleet-route-plan.ts
 * @refactor No changes to business logic, preserves exact Onfleet integration functionality
 */

interface RoutePlanParams {
  name: string;
  startTime: number; // Unix timestamp in milliseconds
  tasks: string[];
  team?: string;
  worker?: string;
  color?: string;
  vehicleType?: string;
  startAt?: string; // 'HUB' | 'WORKER_LOCATION' | 'WORKER_ADDRESS'
  endAt?: string;
  startingHubId?: string;
  endingHubId?: string;
  timezone?: string;
}

interface RoutePlanResponse {
  id: string;
  name: string;
  state: string;
  shortId: string;
  tasks: string[];
  worker?: string;
  team?: string;
  startTime: number;
  endTime?: number;
}

/**
 * Make a raw HTTP request to the Onfleet API
 */
async function makeOnfleetRequest(method: 'GET' | 'POST' | 'PUT' | 'PATCH', endpoint: string, data?: any): Promise<any> {
  console.log('=== ONFLEET API REQUEST START ===');
  console.log('Request details:', { method, endpoint, hasData: !!data });
  
  const apiKey = process.env.ONFLEET_API_KEY;
  if (!apiKey) {
    console.error('ERROR: ONFLEET_API_KEY is not defined');
    throw new Error('ONFLEET_API_KEY is not defined');
  }
  console.log('API Key status: AVAILABLE');

  const url = `https://onfleet.com/api/v2${endpoint}`;
  console.log('Full URL:', url);
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`,
    },
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
    console.log('Request body:', JSON.stringify(data, null, 2));
  }

  console.log('Request options:', {
    method: options.method,
    headers: {
      'Content-Type': (options.headers as Record<string, string>)?.['Content-Type'],
      'Authorization': 'Basic [REDACTED]'
    },
    bodyLength: options.body ? (typeof options.body === 'string' ? options.body.length : '[Binary Data]') : 0
  });

  console.log('Making HTTP request...');
  const startTime = Date.now();
  
  try {
    const response = await fetch(url, options);
    const duration = Date.now() - startTime;
    
    console.log('HTTP response received:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      duration: `${duration}ms`
    });
    
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      console.log('ERROR: HTTP response not OK');
      const errorText = await response.text();
      console.log('Error response body:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        console.log('Parsed error data:', JSON.stringify(errorData, null, 2));
      } catch (parseError) {
        console.log('Could not parse error response as JSON');
        errorData = { message: errorText };
      }
      
      console.error('=== ONFLEET API REQUEST FAILED ===');
      throw new Error(`Onfleet API error (${response.status}): ${errorText}`);
    }

    const responseText = await response.text();
    console.log('Response body (raw):', responseText);
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log('Parsed response data:', JSON.stringify(responseData, null, 2));
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', parseError);
      throw new Error('Invalid JSON response from Onfleet API');
    }
    
    console.log('=== ONFLEET API REQUEST SUCCESS ===');
    return responseData;
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('=== ONFLEET API REQUEST ERROR ===');
    console.error('Error after', `${duration}ms`);
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Request details:', { method, endpoint, url });
    console.error('=== END ONFLEET API REQUEST ERROR ===');
    throw error;
  }
}

/**
 * Create a new Route Plan in Onfleet
 */
export async function createRoutePlan(params: RoutePlanParams): Promise<RoutePlanResponse> {
  try {
    console.log('Creating Onfleet Route Plan:', JSON.stringify(params, null, 2));

    const routePlanData = {
      name: params.name,
      startTime: params.startTime,
      tasks: params.tasks,
      color: params.color || '#52A9FF',
      vehicleType: params.vehicleType || 'CAR',
      timezone: params.timezone || 'America/Los_Angeles',
      ...(params.team && { team: params.team }),
      ...(params.worker && { worker: params.worker }),
      ...(params.startAt && { startAt: params.startAt }),
      ...(params.endAt && { endAt: params.endAt }),
      ...(params.startingHubId && { startingHubId: params.startingHubId }),
      ...(params.endingHubId && { endingHubId: params.endingHubId }),
    };

    const response = await makeOnfleetRequest('POST', '/routePlans', routePlanData);
    
    console.log(`Created Route Plan: ${response.shortId} (${response.id})`);
    
    return response;
  } catch (error: any) {
    console.error('Error creating Onfleet Route Plan:', error);
    throw new Error(`Failed to create route plan: ${error.message}`);
  }
}

/**
 * Get Route Plan by ID
 */
export async function getRoutePlan(routePlanId: string): Promise<RoutePlanResponse> {
  try {
    const response = await makeOnfleetRequest('GET', `/routePlans/${routePlanId}`);
    return response;
  } catch (error: any) {
    console.error('Error getting Route Plan:', error);
    throw new Error(`Failed to get route plan: ${error.message}`);
  }
}

/**
 * Update Route Plan (e.g., assign to worker)
 */
export async function updateRoutePlan(routePlanId: string, updates: Partial<RoutePlanParams>): Promise<RoutePlanResponse> {
  try {
    console.log(`Updating Route Plan ${routePlanId}:`, JSON.stringify(updates, null, 2));

    const response = await makeOnfleetRequest('PUT', `/routePlans/${routePlanId}`, updates);
    
    console.log(`Updated Route Plan: ${response.shortId}`);
    
    return response;
  } catch (error: any) {
    console.error('Error updating Route Plan:', error);
    throw new Error(`Failed to update route plan: ${error.message}`);
  }
}

/**
 * Add tasks to existing Route Plan
 */
export async function addTasksToRoutePlan(routePlanId: string, taskIds: string[]): Promise<RoutePlanResponse> {
  try {
    console.log(`Adding ${taskIds.length} tasks to Route Plan ${routePlanId}`);

    const response = await makeOnfleetRequest('POST', `/routePlans/${routePlanId}/addTasks`, {
      taskIds: taskIds
    });
    
    console.log(`Added tasks to Route Plan: ${response.shortId}`);
    
    return response;
  } catch (error: any) {
    console.error('Error adding tasks to Route Plan:', error);
    throw new Error(`Failed to add tasks to route plan: ${error.message}`);
  }
}

/**
 * Delete Route Plan
 */
export async function deleteRoutePlan(routePlanId: string): Promise<void> {
  try {
    await makeOnfleetRequest('POST', `/routePlans/${routePlanId}/delete`, {});
    console.log(`Deleted Route Plan: ${routePlanId}`);
  } catch (error: any) {
    console.error('Error deleting Route Plan:', error);
    throw new Error(`Failed to delete route plan: ${error.message}`);
  }
}

/**
 * Assign a Route Plan to a specific worker
 */
export async function assignRoutePlanToWorker(
  routePlanId: string,
  workerId: string
): Promise<any> {
  console.log('=== ASSIGN ROUTE PLAN TO WORKER START ===');
  console.log('Input parameters:', { routePlanId, workerId });

  try {
    console.log(`Attempting to assign Route Plan ${routePlanId} to worker ${workerId}`);

    // Get the team ID from environment variable (all packing supply routes use the same team)
    const teamId = process.env.BOOMBOX_PACKING_SUPPLY_DELIVERY_DRIVERS;
    if (!teamId) {
      throw new Error('BOOMBOX_PACKING_SUPPLY_DELIVERY_DRIVERS environment variable is not set');
    }

    console.log('Using team ID from environment:', teamId);

    // Step 1: Verify Route Plan exists (optional - for logging)
    console.log('Step 1: Verifying Route Plan exists...');
    const routePlan = await makeOnfleetRequest('GET', `/routePlans/${routePlanId}`);
    
    console.log('Route Plan found:', {
      id: routePlan.id,
      shortId: routePlan.shortId,
      name: routePlan.name,
      state: routePlan.state,
      currentWorker: routePlan.worker,
      team: routePlan.team,
      tasksCount: routePlan.tasks?.length || 0
    });

    // Step 2: Verify worker exists (optional - for logging)
    console.log('Step 2: Verifying worker exists...');
    const worker = await makeOnfleetRequest('GET', `/workers/${workerId}`);
    
    console.log('Worker found:', {
      id: worker.id,
      name: worker.name,
      teams: worker.teams
    });

    // Step 3: Assign worker to Route Plan using PUT with both team and worker
    console.log('Step 3: Assigning worker to Route Plan...');
    
    // Use PUT with both team and worker to preserve the Route Plan structure
    const updateData = { 
      team: teamId,    // Use environment variable team ID
      worker: workerId // Assign the worker
    };
    console.log('Update data:', updateData);

    const updatedRoutePlan = await makeOnfleetRequest('PUT', `/routePlans/${routePlanId}`, updateData);
    
    console.log('Route Plan assignment successful:', {
      id: updatedRoutePlan.id,
      shortId: updatedRoutePlan.shortId,
      assignedWorker: updatedRoutePlan.worker,
      team: updatedRoutePlan.team,
      state: updatedRoutePlan.state
    });

    console.log('=== ASSIGN ROUTE PLAN TO WORKER SUCCESS ===');
    return updatedRoutePlan;

  } catch (error: any) {
    console.error('=== ASSIGN ROUTE PLAN TO WORKER FAILED ===');
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      response: error.response
    });

    // If Route Plan assignment fails, fall back to individual task assignment
    console.log('Route Plan assignment failed, trying individual task assignment...');
    
    try {
      // Get the Route Plan to access its tasks
      const routePlan = await makeOnfleetRequest('GET', `/routePlans/${routePlanId}`);
      const taskIds = routePlan.tasks || [];
      
      console.log(`Assigning ${taskIds.length} tasks individually to worker ${workerId}`);
      
      const taskAssignmentResults = [];
      for (const taskId of taskIds) {
        try {
          const updatedTask = await makeOnfleetRequest('PUT', `/tasks/${taskId}`, {
            worker: workerId
          });
          taskAssignmentResults.push({ taskId, success: true });
          console.log(`Successfully assigned task ${taskId} to worker ${workerId}`);
        } catch (taskError: any) {
          taskAssignmentResults.push({ taskId, success: false, error: taskError.message });
          console.error(`Failed to assign task ${taskId}:`, taskError.message);
        }
      }
      
      const successfulAssignments = taskAssignmentResults.filter(r => r.success).length;
      console.log(`Task assignment results: ${successfulAssignments}/${taskIds.length} successful`);
      
      if (successfulAssignments > 0) {
        console.log('=== FALLBACK TASK ASSIGNMENT COMPLETED ===');
        return {
          success: true,
          method: 'individual_task_assignment',
          tasksAssigned: successfulAssignments,
          totalTasks: taskIds.length,
          results: taskAssignmentResults
        };
      } else {
        throw new Error('All task assignments failed');
      }
      
    } catch (fallbackError: any) {
      console.error('Fallback task assignment also failed:', fallbackError);
      throw new Error(`Route Plan assignment failed: ${error.message}. Fallback task assignment also failed: ${fallbackError.message}`);
    }
  }
}

/**
 * Assign Route Plan to team (unassigned within team)
 */
export async function assignRoutePlanToTeam(routePlanId: string, teamId: string): Promise<RoutePlanResponse> {
  return await updateRoutePlan(routePlanId, { team: teamId, worker: undefined });
} 