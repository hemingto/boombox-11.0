import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';
import { uploadHaulerFileToCloudinary } from '@/lib/utils/haulingPartnerUtils';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const haulerId = parseInt(id, 10);

    if (isNaN(haulerId)) {
      return NextResponse.json(
        { error: 'Invalid hauling partner ID' },
        { status: 400 }
      );
    }

    const hauler = await prisma.haulingPartner.findUnique({
      where: { id: haulerId },
    });

    if (!hauler) {
      return NextResponse.json(
        { error: 'Hauling partner not found' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const uploadResult = await uploadHaulerFileToCloudinary({
      file,
      folder: 'hauler-company-pictures',
      fileNamePrefix: 'company',
      entityId: haulerId,
      allowedTypes: ['image/'],
    });

    await prisma.haulingPartner.update({
      where: { id: haulerId },
      data: { imageSrc: uploadResult.fileUrl },
    });

    return NextResponse.json({
      success: true,
      url: uploadResult.fileUrl,
      message: 'Company picture uploaded successfully',
    });
  } catch (error: any) {
    console.error('Error uploading company picture:', error);
    return NextResponse.json(
      { error: 'Failed to upload company picture', details: error.message },
      { status: 500 }
    );
  }
}
