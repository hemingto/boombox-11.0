/**
 * @fileoverview Onfleet photo utilities for fetching task completion photos
 * @source boombox-10.0/src/app/lib/onfleet/fetchTaskPhotos.ts
 * @refactor PHASE 4 - Moved to integrations directory with updated imports
 */

import { prisma } from '@/lib/database/prismaClient';

export async function fetchOnfleetTaskPhotos(storageUnitId: number, stepNumber: number = 2): Promise<string[]> {
  try {
    const apiKey = process.env.ONFLEET_API_KEY;
    if (!apiKey) {
      console.error('ONFLEET_API_KEY is not defined');
      return [];
    }

    // Find the OnfleetTask for this storage unit and step
    const onfleetTask = await prisma.onfleetTask.findFirst({
      where: {
        storageUnitId: storageUnitId,
        stepNumber: stepNumber
      },
      orderBy: {
        id: 'desc' // Get the most recent task
      }
    });

    if (!onfleetTask || !onfleetTask.taskId) {
      console.log(`No OnfleetTask found for storage unit ${storageUnitId} step ${stepNumber}`);
      return [];
    }

    // Fetch task details from Onfleet API
    const response = await fetch(`https://onfleet.com/api/v2/tasks/${onfleetTask.taskId}`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`
      }
    });

    if (!response.ok) {
      console.error(`Failed to fetch Onfleet task ${onfleetTask.taskId}: ${response.status}`);
      return [];
    }

    const taskData = await response.json();
    
    // Extract photos from completionDetails
    const photos = taskData.completionDetails?.images || [];
    
    return photos;
  } catch (error) {
    console.error('Error fetching Onfleet task photos:', error);
    return [];
  }
}

export async function fetchOnfleetTaskPhotoForStorageUnit(storageUnitId: number): Promise<string | null> {
  const photos = await fetchOnfleetTaskPhotos(storageUnitId, 2);
  return photos.length > 0 ? photos[0] : null;
} 