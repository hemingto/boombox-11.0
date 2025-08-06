/**
 * @fileoverview Moving partner utility functions
 * @source boombox-10.0/src/app/api/movers/route.ts (formatToE164, createDefaultMoverAvailability)
 * @source boombox-10.0/src/app/api/moving-partners/route.ts (parseTimeToMinutes, getDayOfWeekString)
 * @source boombox-10.0/src/app/api/cron/process-expired-mover-changes/route.ts (assignMovingPartnerDriver)
 * @refactor Extracted utility functions for moving partner operations
 */

import { prisma } from '@/lib/database/prismaClient';
import { normalizePhoneNumberToE164 } from '@/lib/utils/phoneUtils';
import { formatTime24Hour } from '@/lib/utils/dateUtils';
import cloudinary from '@/lib/integrations/cloudinaryClient';
import { v4 as uuidv4 } from 'uuid';
import { Readable } from 'stream';

/**
 * Helper function to create default availability for all days of the week
 * @source boombox-10.0/src/app/api/movers/route.ts (createDefaultMoverAvailability)
 */
export async function createDefaultMoverAvailability(moverId: number): Promise<void> {
  const daysOfWeek = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];
  
  // Default time: 9am to 5pm
  const defaultStartTime = '09:00';
  const defaultEndTime = '17:00';
  
  // Get current timestamp
  const now = new Date();
  
  // Create availability records for each day with isBlocked set to true
  const availabilityPromises = daysOfWeek.map(day => 
    prisma.movingPartnerAvailability.create({
      data: {
        movingPartnerId: moverId,
        dayOfWeek: day,
        startTime: defaultStartTime,
        endTime: defaultEndTime,
        maxCapacity: 1,
        isBlocked: true, // Set isBlocked to true
        createdAt: now,
        updatedAt: now
      }
    })
  );
  
  // Execute all creation operations
  await Promise.all(availabilityPromises);
}

/**
 * Helper function to parse HH:mm time string to minutes since midnight
 * @source boombox-10.0/src/app/api/moving-partners/route.ts (parseTimeToMinutes)
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return 0; // Basic validation
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Helper function to get day of week string
 * @source boombox-10.0/src/app/api/moving-partners/route.ts (getDayOfWeekString)
 */
export function getDayOfWeekString(date: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getUTCDay()];
}

/**
 * Check if a moving partner already exists by email or phone
 */
export async function checkMoverExists(email: string, phoneNumber: string) {
  const formattedPhone = normalizePhoneNumberToE164(phoneNumber);
  
  return await prisma.movingPartner.findFirst({
    where: {
      OR: [
        { email: email },
        { phoneNumber: formattedPhone }
      ]
    }
  });
}

/**
 * Create a new moving partner with validated data
 */
export async function createMover(data: {
  companyName: string;
  email: string;
  phoneNumber: string;
  website: string;
  employeeCount: number;
}) {
  const formattedPhone = normalizePhoneNumberToE164(data.phoneNumber);
  
  return await prisma.movingPartner.create({
    data: {
      name: data.companyName,
      email: data.email,
      phoneNumber: formattedPhone,
      website: data.website,
      numberOfEmployees: data.employeeCount.toString(),
      isApproved: false, // Default to false for admin review
    }
  });
}

/**
 * Find available moving partners for a specific date and time
 * @source boombox-10.0/src/app/api/moving-partners/route.ts (main GET logic)
 */
export async function findAvailableMovingPartners(
  dateString: string,
  timeString: string,
  excludeAppointmentId?: number
) {
  const selectedDate = new Date(dateString);
  if (isNaN(selectedDate.getTime())) {
    throw new Error('Invalid date format');
  }

  const dayOfWeek = getDayOfWeekString(selectedDate);
  const slotStartTimeStr = timeString; // e.g., "10:00"
  const slotStartMinutes = parseTimeToMinutes(slotStartTimeStr);
  const slotEndMinutes = slotStartMinutes + 60; // Assuming 1hr slots for booking check window
  
  // Calculate exact start/end Date objects for booking overlap checks
  const [reqHour, reqMinute] = slotStartTimeStr.split(':').map(Number);
  const slotStartDateTime = new Date(selectedDate);
  slotStartDateTime.setUTCHours(reqHour, reqMinute, 0, 0); 
  const slotEndDateTime = new Date(slotStartDateTime);
  slotEndDateTime.setUTCMinutes(slotStartDateTime.getUTCMinutes() + 60); // Add 1 hour for end window

  // 1. Initial Fetch: Filter by status and general availability for the day/time
  const potentiallyAvailablePartners = await prisma.movingPartner.findMany({
    where: {
      status: 'ACTIVE',
      availability: {
        some: {
          dayOfWeek,
          isBlocked: false,
          startTime: { lte: slotStartTimeStr },
          endTime: { gte: slotStartTimeStr } // Partner must end work at or after the slot starts
        }
      }
    },
    include: {
      availability: true // Include all availability for capacity check
    }
  });

  console.log(`[MovingPartnerUtils] Found ${potentiallyAvailablePartners.length} partners with general availability for ${dayOfWeek} at ${slotStartTimeStr}.`);

  // 2. Capacity Check (In-code filtering)
  const availablePartnersWithCapacity = [];
  for (const partner of potentiallyAvailablePartners) {
    let partnerHasCapacity = false;
    // Find the specific availability records for this partner that cover the requested slot time
    const relevantAvailabilities = partner.availability.filter(
      avail => avail.dayOfWeek === dayOfWeek && 
               !avail.isBlocked &&
               parseTimeToMinutes(avail.startTime) <= slotStartMinutes &&
               parseTimeToMinutes(avail.endTime) >= slotStartMinutes // Corrected check based on previous step
    );

    if (relevantAvailabilities.length === 0) continue; // Skip if no relevant general availability found

    for (const avail of relevantAvailabilities) {
      const bookingWhereClause: any = {
        movingPartnerAvailabilityId: avail.id,
        // Check for overlap
        bookingDate: { lt: slotEndDateTime },
        endDate: { gt: slotStartDateTime }
      };
      if (excludeAppointmentId !== undefined) {
        bookingWhereClause.appointmentId = { not: excludeAppointmentId };
      }

      const bookingCount = await prisma.timeSlotBooking.count({ where: bookingWhereClause });

      if (bookingCount < avail.maxCapacity) {
        partnerHasCapacity = true;
        break; // Found capacity in one of the availability slots for this partner
      }
    }

    if (partnerHasCapacity) {
      // Only include partners that have capacity
      availablePartnersWithCapacity.push(partner);
    }
  }

  console.log(`[MovingPartnerUtils] Found ${availablePartnersWithCapacity.length} partners with capacity.`);
  return availablePartnersWithCapacity;
}

/**
 * File upload utility for moving partner documents and photos
 * @source boombox-10.0/src/app/api/movers/[moverId]/upload-*
 */
export interface FileUploadOptions {
  file: File;
  folder: string;
  fileNamePrefix: string;
  entityId: number;
  allowedTypes?: string[];
}

export interface FileUploadResult {
  fileUrl: string;
  publicId: string;
}

export async function uploadFileToCloudinary(options: FileUploadOptions): Promise<FileUploadResult> {
  const { file, folder, fileNamePrefix, entityId, allowedTypes } = options;
  
  // Validate file type if allowed types are specified
  if (allowedTypes && !allowedTypes.some(type => file.type.startsWith(type) || file.type === type)) {
    throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
  }
  
  // Convert the file to a buffer
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  // Create a unique filename
  const fileName = `${fileNamePrefix}_${entityId}_${uuidv4()}`;
  
  // Upload to Cloudinary
  const uploadPromise = new Promise<any>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        public_id: fileName,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    
    // Convert buffer to stream and pipe to uploadStream
    const bufferStream = new Readable();
    bufferStream.push(buffer);
    bufferStream.push(null);
    bufferStream.pipe(uploadStream);
  });
  
  const uploadResult = await uploadPromise;
  return {
    fileUrl: uploadResult.secure_url,
    publicId: `${folder}/${fileName}`
  };
}

/**
 * Delete an old file from Cloudinary by extracting public ID from URL
 * @source boombox-10.0/src/app/api/movers/[moverId]/upload-*
 */
export async function deleteOldCloudinaryFile(fileUrl: string, folder: string): Promise<void> {
  if (!fileUrl) return;
  
  try {
    // Extract the public ID from the Cloudinary URL
    const urlParts = fileUrl.split('/');
    const fileNameWithExtension = urlParts[urlParts.length - 1];
    const publicId = fileNameWithExtension.split('.')[0]; // Remove extension
    const fullPublicId = `${folder}/${publicId}`;
    
    // Delete from Cloudinary
    await new Promise<void>((resolve) => {
      cloudinary.uploader.destroy(fullPublicId, (error, result) => {
        if (error) {
          console.error('Error deleting old file:', error);
        } else {
          console.log('Successfully deleted old file:', result);
        }
        // Always resolve to continue with the update
        resolve();
      });
    });
  } catch (error) {
    console.error('Error processing old file URL:', error);
    // Continue with the update even if deletion fails
  }
}

/**
 * Get completed jobs for a moving partner
 * @source boombox-10.0/src/app/api/movers/[moverId]/jobs/route.ts
 */
export async function getMovingPartnerJobs(movingPartnerId: number) {
  const appointments = await prisma.appointment.findMany({
    where: {
      movingPartnerId: movingPartnerId,
      status: 'Completed',
    },
    select: {
      id: true,
      appointmentType: true,
      address: true,
      date: true,
      time: true,
      numberOfUnits: true,
      planType: true,
      insuranceCoverage: true,
      loadingHelpPrice: true,
      serviceStartTime: true,
      serviceEndTime: true,
      status: true,
      quotedPrice: true,
      description: true,
      feedback: {
        select: {
          rating: true,
          comment: true,
          tipAmount: true,
        },
      },
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      onfleetTasks: {
        where: {
          driverId: { not: null }
        },
        include: {
          driver: {
            select: {
              firstName: true,
              lastName: true,
            }
          }
        },
        orderBy: {
          unitNumber: 'asc'
        },
        take: 1
      },
      requestedStorageUnits: {
        select: {
          storageUnit: {
            select: {
              storageUnitNumber: true,
            },
          },
        },
      },
    },
    orderBy: {
      date: 'desc',
    },
  });

  // Transform the data to match the expected format
  return appointments.map((appointment: any) => {
    // Get primary driver from first OnfleetTask
    const primaryDriver = appointment.onfleetTasks.length > 0 
      ? appointment.onfleetTasks[0].driver 
      : null;
      
    return {
      id: appointment.id,
      appointmentType: appointment.appointmentType,
      address: appointment.address,
      date: appointment.date.toISOString(),
      time: appointment.time.toISOString(),
      numberOfUnits: appointment.numberOfUnits,
      planType: appointment.planType,
      insuranceCoverage: appointment.insuranceCoverage,
      loadingHelpPrice: appointment.loadingHelpPrice,
      serviceStartTime: appointment.serviceStartTime,
      serviceEndTime: appointment.serviceEndTime,
      feedback: appointment.feedback,
      user: appointment.user,
      driver: primaryDriver,
      requestedStorageUnits: appointment.requestedStorageUnits.map((unit: any) => ({
        unitType: unit.storageUnit.storageUnitNumber,
        quantity: 1, // Since each record represents one unit
      })),
      status: appointment.status,
      totalCost: appointment.quotedPrice,
      notes: appointment.description,
    };
  });
}

/**
 * Assign a moving partner driver to an appointment
 * @source boombox-10.0/src/app/api/cron/process-expired-mover-changes/route.ts (lines 7-46)
 * @refactor Extracted inline function for assigning moving partner drivers
 */
export async function assignMovingPartnerDriver(appointment: any, movingPartnerId: number) {
  // Get available drivers for this moving partner
  const movingPartnerDrivers = await prisma.movingPartnerDriver.findMany({
    where: { 
      movingPartnerId,
      isActive: true 
    },
    include: {
      driver: {
        include: {
          availability: true
        }
      }
    }
  });

  const appointmentDate = new Date(appointment.date);
  const appointmentTime = new Date(appointment.time);
  const dayOfWeek = appointmentDate.toLocaleDateString("en-US", { weekday: "long" });
  const formattedTime = formatTime24Hour(appointmentTime);

  // Find available driver from this moving partner
  const availableDriver = movingPartnerDrivers.find(mpd => {
    const driver = mpd.driver;
    return driver.isApproved && 
           driver.applicationComplete && 
           driver.status === 'Active' &&
           driver.onfleetWorkerId &&
           driver.availability.some(avail => 
             avail.dayOfWeek === dayOfWeek &&
             avail.startTime <= formattedTime &&
             avail.endTime >= formattedTime &&
             !avail.isBlocked
           );
  });

  return availableDriver?.driver || null;
}