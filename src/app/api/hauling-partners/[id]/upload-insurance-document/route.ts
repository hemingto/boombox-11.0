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
      select: { insuranceDocumentUrls: true },
    });

    if (!hauler) {
      return NextResponse.json(
        { error: 'Hauling partner not found' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll('file') as File[];

    if (!files.length) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    const uploadedUrls: string[] = [];

    for (const file of files) {
      const uploadResult = await uploadHaulerFileToCloudinary({
        file,
        folder: 'hauler-insurance-documents',
        fileNamePrefix: 'insurance',
        entityId: haulerId,
        allowedTypes: ['image/', 'application/pdf'],
      });
      uploadedUrls.push(uploadResult.fileUrl);
    }

    const updatedUrls = [...hauler.insuranceDocumentUrls, ...uploadedUrls];

    await prisma.haulingPartner.update({
      where: { id: haulerId },
      data: { insuranceDocumentUrls: updatedUrls },
    });

    return NextResponse.json({
      success: true,
      urls: uploadedUrls,
      insuranceDocumentUrls: updatedUrls,
      message: `${uploadedUrls.length} insurance document(s) uploaded successfully`,
    });
  } catch (error: any) {
    console.error('Error uploading insurance documents:', error);
    return NextResponse.json(
      { error: 'Failed to upload insurance documents', details: error.message },
      { status: 500 }
    );
  }
}
