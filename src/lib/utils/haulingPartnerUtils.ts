import { prisma } from '@/lib/database/prismaClient';
import { normalizePhoneNumberToE164 } from '@/lib/utils';
import cloudinary from '@/lib/integrations/cloudinaryClient';
import { v4 as uuidv4 } from 'uuid';
import { Readable } from 'stream';

export async function createDefaultHaulerAvailability(
  haulerId: number
): Promise<void> {
  const daysOfWeek = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  const now = new Date();

  const availabilityPromises = daysOfWeek.map(day =>
    prisma.haulingPartnerAvailability.create({
      data: {
        haulingPartnerId: haulerId,
        dayOfWeek: day,
        startTime: '08:30',
        endTime: '16:30',
        maxCapacity: 1,
        isBlocked: true,
        createdAt: now,
        updatedAt: now,
      },
    })
  );

  await Promise.all(availabilityPromises);
}

export async function checkHaulerExists(email: string, phoneNumber: string) {
  const formattedPhone = normalizePhoneNumberToE164(phoneNumber);

  return await prisma.haulingPartner.findFirst({
    where: {
      OR: [{ email }, { phoneNumber: formattedPhone }],
    },
  });
}

export async function createHauler(data: {
  companyName: string;
  email: string;
  phoneNumber: string;
  website: string;
  employeeCount: number;
}) {
  const formattedPhone = normalizePhoneNumberToE164(data.phoneNumber);

  return await prisma.haulingPartner.create({
    data: {
      name: data.companyName,
      email: data.email,
      phoneNumber: formattedPhone,
      website: data.website,
      numberOfEmployees: data.employeeCount.toString(),
      isApproved: false,
    },
  });
}

interface UploadFileParams {
  file: File;
  folder: string;
  fileNamePrefix: string;
  entityId: number;
  allowedTypes?: string[];
}

export async function uploadHaulerFileToCloudinary({
  file,
  folder,
  fileNamePrefix,
  entityId,
  allowedTypes = ['image/'],
}: UploadFileParams): Promise<{ fileUrl: string }> {
  const isAllowedType = allowedTypes.some(type => file.type.startsWith(type));
  if (!isAllowedType) {
    throw new Error(
      `Invalid file type: ${file.type}. Allowed: ${allowedTypes.join(', ')}`
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const fileName = `${fileNamePrefix}_${entityId}_${uuidv4()}`;

  const uploadResult = await new Promise<any>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: fileName,
        resource_type: file.type === 'application/pdf' ? 'raw' : 'image',
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null);
    readableStream.pipe(uploadStream);
  });

  return { fileUrl: uploadResult.secure_url };
}
