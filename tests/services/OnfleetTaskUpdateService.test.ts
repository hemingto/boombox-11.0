/**
 * @fileoverview Unit tests for OnfleetTaskUpdateService
 * @testing Low-level Onfleet API operations (fetch, update, batch, delete, validation)
 */

import { OnfleetTaskUpdateService } from '@/lib/services/onfleet/OnfleetTaskUpdateService';

// Mock fetch globally
global.fetch = jest.fn();

describe('OnfleetTaskUpdateService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ONFLEET_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    delete process.env.ONFLEET_API_KEY;
  });

  describe('validateTaskPayload', () => {
    it('should validate a valid task payload', () => {
      const validPayload = {
        notes: 'Test notes',
        completeAfter: 1234567890,
        completeBefore: 1234567900,
      };

      const result = OnfleetTaskUpdateService.validateTaskPayload(validPayload);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should reject payload with invalid complete times', () => {
      const invalidPayload = {
        completeAfter: 'not-a-number' as any,
      };

      const result = OnfleetTaskUpdateService.validateTaskPayload(invalidPayload);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    it('should validate payload with destination', () => {
      const payloadWithDestination = {
        notes: 'Delivery task',
        destination: {
          address: {
            street: '123 Main St',
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94102',
            country: 'US',
          },
          location: [-122.4194, 37.7749] as [number, number],
        },
      };

      const result = OnfleetTaskUpdateService.validateTaskPayload(payloadWithDestination);
      expect(result.valid).toBe(true);
    });
  });

  describe('fetchTask', () => {
    it('should fetch task successfully', async () => {
      const mockTask = {
        id: 'task-123',
        shortId: 'abc123',
        notes: 'Test task',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTask,
      });

      const result = await OnfleetTaskUpdateService.fetchTask('task-123');
      
      expect(result).toEqual(mockTask);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://onfleet.com/api/v2/tasks/task-123',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: expect.stringContaining('Basic'),
          }),
        })
      );
    });

    it('should return null on fetch failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await OnfleetTaskUpdateService.fetchTask('invalid-task');
      expect(result).toBeNull();
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await OnfleetTaskUpdateService.fetchTask('task-123');
      expect(result).toBeNull();
    });
  });

  describe('updateTask', () => {
    it('should update task successfully', async () => {
      const mockUpdatedTask = {
        id: 'task-123',
        shortId: 'abc123',
        notes: 'Updated notes',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockUpdatedTask,
      });

      const payload = { notes: 'Updated notes' };
      const result = await OnfleetTaskUpdateService.updateTask('task-123', payload, 'abc123');

      expect(result.success).toBe(true);
      expect(result.taskId).toBe('task-123');
      expect(result.shortId).toBe('abc123');
      expect(result.updatedTask).toEqual(mockUpdatedTask);
    });

    it('should retry on server errors', async () => {
      const mockUpdatedTask = {
        id: 'task-123',
        notes: 'Updated',
      };

      // First call fails, second succeeds
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ error: 'Server error' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockUpdatedTask,
        });

      const payload = { notes: 'Updated' };
      const result = await OnfleetTaskUpdateService.updateTask('task-123', payload);

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should not retry on client errors (4xx)', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Bad request' }),
      });

      const payload = { notes: 'Test' };
      const result = await OnfleetTaskUpdateService.updateTask('task-123', payload);

      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should reject invalid payload', async () => {
      const invalidPayload = {
        completeAfter: 'invalid' as any,
      };

      const result = await OnfleetTaskUpdateService.updateTask('task-123', invalidPayload);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Validation failed');
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('batchUpdateTasks', () => {
    it('should update multiple tasks successfully', async () => {
      const mockResponses = [
        { id: 'task-1', notes: 'Updated 1' },
        { id: 'task-2', notes: 'Updated 2' },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockResponses[0],
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockResponses[1],
        });

      const updates = [
        { taskId: 'task-1', payload: { notes: 'Updated 1' } },
        { taskId: 'task-2', payload: { notes: 'Updated 2' } },
      ];

      const results = await OnfleetTaskUpdateService.batchUpdateTasks(updates);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should handle partial batch failures', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ id: 'task-1' }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ error: 'Server error' }),
        });

      const updates = [
        { taskId: 'task-1', payload: { notes: 'Update 1' } },
        { taskId: 'task-2', payload: { notes: 'Update 2' } },
      ];

      const results = await OnfleetTaskUpdateService.batchUpdateTasks(updates);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
    });
  });

  describe('deleteTask', () => {
    it('should delete task successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });

      const result = await OnfleetTaskUpdateService.deleteTask('task-123');

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://onfleet.com/api/v2/tasks/task-123',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should handle deletion failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        text: async () => 'Task not found',
      });

      const result = await OnfleetTaskUpdateService.deleteTask('invalid-task');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Task not found');
    });

    it('should handle network errors during deletion', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await OnfleetTaskUpdateService.deleteTask('task-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('batchDeleteTasks', () => {
    it('should delete multiple tasks successfully', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true })
        .mockResolvedValueOnce({ ok: true })
        .mockResolvedValueOnce({ ok: true });

      const taskIds = ['task-1', 'task-2', 'task-3'];
      const results = await OnfleetTaskUpdateService.batchDeleteTasks(taskIds);

      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should handle partial batch deletion failures', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true })
        .mockResolvedValueOnce({ ok: false, text: async () => 'Failed' })
        .mockResolvedValueOnce({ ok: true });

      const taskIds = ['task-1', 'task-2', 'task-3'];
      const results = await OnfleetTaskUpdateService.batchDeleteTasks(taskIds);

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true);
    });
  });

  describe('Environment validation', () => {
    it('should throw error when ONFLEET_API_KEY is missing', async () => {
      delete process.env.ONFLEET_API_KEY;

      await expect(
        OnfleetTaskUpdateService.updateTask('task-123', { notes: 'Test' })
      ).rejects.toThrow('ONFLEET_API_KEY environment variable not configured');
    });
  });
});

