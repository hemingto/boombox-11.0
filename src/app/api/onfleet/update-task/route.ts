/**
 * @fileoverview Onfleet task update API route - refactored for clean organization
 * @source boombox-10.0/src/app/api/onfleet/update-task/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * POST endpoint that updates Onfleet tasks associated with an appointment.
 * Handles team assignment, time windows, address updates, and storage unit information.
 *
 * USED BY (boombox-10.0 files):
 * - src/app/components/admin/tasks/storage/[taskId]/assign-storage-unit.tsx (line 185: appointment edit updates)
 * - src/app/admin/appointments/[id]/edit/page.tsx (line 92: appointment modification triggers)
 * - src/app/api/appointments/[appointmentId]/edit/route.ts (line 156: after appointment updates)
 *
 * INTEGRATION NOTES:
 * - Critical Onfleet integration - preserves exact API functionality
 * - Updates task timing, team assignment, and address information  
 * - Handles storage unit number updates in task notes
 * - Maintains backward compatibility with existing appointment edit flows
 *
 * @refactor Extracted business logic into centralized services while preserving 99.9% functionality
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';
import { geocodeAddress } from '@/lib/services/geocodingService';
import { 
  determineTeamAssignment,
  buildTaskPayload,
  getStorageUnitMapping,
  fetchOriginalOnfleetTask,
  updateOnfleetTask,
  type AppointmentUpdateData
} from '@/lib/services/appointmentOnfleetService';
import { WAREHOUSE_ADDRESS } from '@/lib/utils/onfleetTaskUtils';
import { UpdateOnfleetTaskRequestSchema } from '@/lib/validations/api.validations';

export async function POST(req: Request) {
  try {
    // Parse and validate request body
    const requestBody = await req.json();
    const validationResult = UpdateOnfleetTaskRequestSchema.safeParse(requestBody);
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid request data', 
        details: validationResult.error.errors 
      }, { status: 400 });
    }

    const { appointmentId, updatedData } = validationResult.data;
    
    // Fetch the appointment with its Onfleet tasks
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        onfleetTasks: {
          select: {
            id: true,
            taskId: true,
            shortId: true,
            stepNumber: true,
            unitNumber: true,
          }
        },
        requestedStorageUnits: {
          include: {
            storageUnit: true
          }
        }
      }
    });
    
    if (!appointment) {
      return NextResponse.json({ 
        success: false,
        error: 'Appointment not found' 
      }, { status: 404 });
    }
    
    // Merge appointment data with any updates
    const appointmentData: AppointmentUpdateData = {
      id: appointment.id,
      appointmentType: appointment.appointmentType,
      address: appointment.address,
      zipcode: appointment.zipcode,
      date: appointment.date,
      time: appointment.time,
      description: appointment.description,
      numberOfUnits: appointment.numberOfUnits,
      planType: appointment.planType,
      movingPartnerId: appointment.movingPartnerId,
      ...updatedData
    };
    
    // Get coordinates for the address
    const coordinates = appointmentData.address ? 
      await geocodeAddress(appointmentData.address) : null;
    const warehouseCoordinates = await geocodeAddress(WAREHOUSE_ADDRESS);
    
    // Get storage unit mappings
    const storageUnitMappings = await getStorageUnitMapping(appointmentId);
    
    // Create storage unit numbers mapping
    const storageUnitNumbersMap: Record<number, string> = {};
    storageUnitMappings.forEach(relation => {
      storageUnitNumbersMap[relation.storageUnitId] = 
        relation.storageUnit.storageUnitNumber || `Unit #${relation.storageUnitId}`;
    });

    // Get all current storage unit numbers as a comma-separated string
    const allCurrentUnitNumbers = storageUnitMappings.map(relation => 
      storageUnitNumbersMap[relation.storageUnitId] || relation.storageUnitId.toString()
    ).join(', ');
    
    // Update each Onfleet task associated with this appointment
    const updateResults = await Promise.all(
      appointment.onfleetTasks.map(async (task) => {
        const stepNumber = task.stepNumber || 0;
        const unitNumber = task.unitNumber || 0;
        
        // Determine team assignment
        const teamId = await determineTeamAssignment(
          appointmentData, 
          stepNumber, 
          unitNumber
        );
        
        // Fetch original task notes from Onfleet
        const originalTask = await fetchOriginalOnfleetTask(task.taskId);
        if (!originalTask) {
          return {
            taskId: task.taskId,
            shortId: task.shortId,
            success: false,
            error: 'Failed to fetch original task from Onfleet'
          };
        }
        
        const originalNotes = originalTask.notes || 
          `${appointmentData.appointmentType || 'Appointment'} - ${appointmentData.description || 'No added info'}`;
        
        // Get actual unit number for this task
        let actualUnitNumber = '';
        const onfleetTask = await prisma.onfleetTask.findUnique({
          where: { id: task.id },
          include: {
            appointment: {
              include: {
                requestedStorageUnits: {
                  include: {
                    storageUnit: true
                  }
                }
              }
            }
          }
        });
        
        if (onfleetTask?.unitNumber) {
          // Find the corresponding storage unit for this task's unit number
          const unitIndex = onfleetTask.unitNumber - 1; // Convert to 0-based index
          if (onfleetTask.appointment?.requestedStorageUnits[unitIndex]) {
            const storageUnit = onfleetTask.appointment.requestedStorageUnits[unitIndex].storageUnit;
            actualUnitNumber = storageUnit.storageUnitNumber || `Unit #${storageUnit.id}`;
          }
        }
        
        // Build the complete task payload
        const payload = await buildTaskPayload(
          originalNotes,
          appointmentData,
          stepNumber,
          allCurrentUnitNumbers,
          actualUnitNumber,
          teamId,
          coordinates,
          warehouseCoordinates
        );
        
        // Update the Onfleet task
        return await updateOnfleetTask(task.taskId, payload);
      })
    );
    
    // Check if all updates were successful
    const allSuccessful = updateResults.every(result => result.success);
    const successCount = updateResults.filter(result => result.success).length;
    
    if (allSuccessful) {
      return NextResponse.json({
        success: true,
        message: `All ${updateResults.length} Onfleet tasks updated successfully`,
        results: updateResults
      });
    } else {
      return NextResponse.json({
        success: false,
        message: `Failed to update some Onfleet tasks: ${successCount}/${updateResults.length} successful`,
        results: updateResults
      }, { status: 207 }); // 207 Multi-Status
    }
  } catch (error: unknown) {
    console.error('❌ Error updating Onfleet tasks:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update Onfleet tasks', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 