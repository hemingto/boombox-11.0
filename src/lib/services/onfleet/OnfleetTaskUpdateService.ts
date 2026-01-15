/**
 * @fileoverview Low-level Onfleet Task Update Service for atomic task operations
 * @source boombox-10.0/src/app/api/onfleet/update-task/route.ts (task update operations)
 * @refactor Extracted Onfleet API operations into centralized service with retry logic
 */

import { z } from 'zod';

/**
 * Onfleet task update payload interface
 */
export interface OnfleetTaskPayload {
  notes?: string;
  completeAfter?: number;
  completeBefore?: number;
  destination?: {
    address: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    location: [number, number]; // [longitude, latitude]
  };
  container?: {
    type: 'TEAM' | 'WORKER' | 'ORGANIZATION';
    team?: string;
    worker?: string;
  };
  metadata?: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean';
    value: string;
    visibility: string[];
  }>;
}

/**
 * Task update result interface
 */
export interface TaskUpdateResult {
  taskId: string;
  shortId: string;
  success: boolean;
  status?: number;
  error?: string;
  updatedTask?: any;
}

/**
 * Batch update request interface
 */
export interface BatchUpdateRequest {
  taskId: string;
  payload: OnfleetTaskPayload;
}

/**
 * Zod schema for validating task payload
 */
const OnfleetTaskPayloadSchema = z.object({
  notes: z.string().optional(),
  completeAfter: z.number().optional(),
  completeBefore: z.number().optional(),
  destination: z.object({
    address: z.object({
      street: z.string(),
      city: z.string(),
      state: z.string(),
      postalCode: z.string(),
      country: z.string(),
    }),
    location: z.tuple([z.number(), z.number()]),
  }).optional(),
  container: z.object({
    type: z.enum(['TEAM', 'WORKER', 'ORGANIZATION']),
    team: z.string().optional(),
    worker: z.string().optional(),
  }).optional(),
  metadata: z.array(
    z.object({
      name: z.string(),
      type: z.enum(['string', 'number', 'boolean']),
      value: z.string(),
      visibility: z.array(z.string()),
    })
  ).optional(),
});

/**
 * OnfleetTaskUpdateService - Low-level Onfleet API operations
 */
export class OnfleetTaskUpdateService {
  private static readonly BASE_URL = 'https://onfleet.com/api/v2';
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY_MS = 1000;

  /**
   * Get authorization header for Onfleet API
   */
  private static getAuthHeader(): string {
    const apiKey = process.env.ONFLEET_API_KEY;
    if (!apiKey) {
      throw new Error('ONFLEET_API_KEY environment variable not configured');
    }
    return `Basic ${Buffer.from(apiKey).toString('base64')}`;
  }

  /**
   * Delay helper for retry logic
   */
  private static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Fetch current task data from Onfleet API
   * @param taskId - Onfleet task ID
   * @returns Task data or null if failed
   */
  static async fetchTask(taskId: string): Promise<any | null> {
    try {
      console.log(`📥 Fetching Onfleet task: ${taskId}`);
      
      const response = await fetch(`${this.BASE_URL}/tasks/${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': this.getAuthHeader(),
        },
      });

      if (!response.ok) {
        console.error(`❌ Failed to fetch task ${taskId}:`, response.status);
        return null;
      }

      const taskData = await response.json();
      console.log(`✅ Successfully fetched task ${taskId}`);
      return taskData;
    } catch (error) {
      console.error(`❌ Error fetching task ${taskId}:`, error);
      return null;
    }
  }

  /**
   * Validate task payload using Zod schema
   * @param payload - Task update payload
   * @returns Validation result
   */
  static validateTaskPayload(payload: OnfleetTaskPayload): { valid: boolean; errors?: string[] } {
    const result = OnfleetTaskPayloadSchema.safeParse(payload);
    
    if (result.success) {
      return { valid: true };
    }
    
    const errors = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
    return { valid: false, errors };
  }

  /**
   * Update a single Onfleet task with retry logic
   * @param taskId - Onfleet task ID
   * @param payload - Task update payload
   * @param shortId - Task short ID for logging (optional)
   * @returns Update result
   */
  static async updateTask(
    taskId: string,
    payload: OnfleetTaskPayload,
    shortId?: string
  ): Promise<TaskUpdateResult> {
    const displayId = shortId || taskId;
    
    // Validate payload
    const validation = this.validateTaskPayload(payload);
    if (!validation.valid) {
      console.error(`❌ Invalid task payload for ${displayId}:`, validation.errors);
      return {
        taskId,
        shortId: shortId || taskId,
        success: false,
        error: `Validation failed: ${validation.errors?.join(', ')}`,
      };
    }

    let lastError: Error | null = null;

    // Retry loop
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        console.log(`🔄 Updating Onfleet task ${displayId} (attempt ${attempt}/${this.MAX_RETRIES})`);

        const response = await fetch(`${this.BASE_URL}/tasks/${taskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': this.getAuthHeader(),
          },
          body: JSON.stringify(payload),
        });

        const responseData = await response.json();

        if (!response.ok) {
          console.error(`❌ Error updating task ${displayId}:`, responseData);
          
          // Don't retry on client errors (4xx)
          if (response.status >= 400 && response.status < 500) {
            return {
              taskId,
              shortId: displayId,
              success: false,
              status: response.status,
              error: responseData,
            };
          }

          // Retry on server errors (5xx)
          lastError = new Error(`Server error: ${response.status}`);
          if (attempt < this.MAX_RETRIES) {
            await this.delay(this.RETRY_DELAY_MS * attempt);
            continue;
          }
        } else {
          console.log(`✅ Successfully updated task ${displayId}`);
          return {
            taskId,
            shortId: displayId,
            success: true,
            status: response.status,
            updatedTask: responseData,
          };
        }
      } catch (error) {
        console.error(`❌ Exception updating task ${displayId} (attempt ${attempt}):`, error);
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < this.MAX_RETRIES) {
          await this.delay(this.RETRY_DELAY_MS * attempt);
        }
      }
    }

    // All retries exhausted
    return {
      taskId,
      shortId: displayId,
      success: false,
      error: lastError?.message || 'Unknown error after all retries',
    };
  }

  /**
   * Update multiple Onfleet tasks in batch
   * @param updates - Array of task updates
   * @returns Array of update results
   */
  static async batchUpdateTasks(
    updates: BatchUpdateRequest[]
  ): Promise<TaskUpdateResult[]> {
    console.log(`📦 Batch updating ${updates.length} Onfleet tasks`);

    const results = await Promise.all(
      updates.map(update => this.updateTask(update.taskId, update.payload))
    );

    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Batch update complete: ${successCount}/${updates.length} successful`);

    return results;
  }

  /**
   * Delete a task from Onfleet
   * @param taskId - Onfleet task ID
   * @returns Success status
   */
  static async deleteTask(taskId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🗑️  Deleting Onfleet task: ${taskId}`);

      const response = await fetch(`${this.BASE_URL}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': this.getAuthHeader(),
        },
      });

      if (response.ok) {
        console.log(`✅ Successfully deleted task ${taskId} from Onfleet`);
        return { success: true };
      } else {
        const errorText = await response.text();
        console.error(`❌ Failed to delete task ${taskId}:`, errorText);
        return { success: false, error: errorText };
      }
    } catch (error) {
      console.error(`❌ Error deleting task ${taskId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Delete multiple tasks in batch
   * @param taskIds - Array of task IDs to delete
   * @returns Array of deletion results
   */
  static async batchDeleteTasks(
    taskIds: string[]
  ): Promise<Array<{ taskId: string; success: boolean; error?: string }>> {
    console.log(`🗑️  Batch deleting ${taskIds.length} Onfleet tasks`);

    const results = await Promise.all(
      taskIds.map(async taskId => ({
        taskId,
        ...(await this.deleteTask(taskId)),
      }))
    );

    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Batch delete complete: ${successCount}/${taskIds.length} successful`);

    return results;
  }
}

