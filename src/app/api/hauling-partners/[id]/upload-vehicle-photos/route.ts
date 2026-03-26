import { NextRequest, NextResponse } from 'next/server';
// eslint-disable-next-line no-restricted-imports -- haulingPartnerUtils uses Cloudinary (server-only), not re-exported from barrel
import { uploadHaulerFileToCloudinary } from '@/lib/utils/haulingPartnerUtils';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idNum = parseInt(id);
    if (isNaN(idNum)) {
      return NextResponse.json(
        { error: 'Invalid hauling partner ID' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fieldName = formData.get('fieldName') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    if (!fieldName) {
      return NextResponse.json(
        { error: 'Field name is required' },
        { status: 400 }
      );
    }

    const validFields = [
      'frontVehiclePhoto',
      'backVehiclePhoto',
      'autoInsurancePhoto',
      'interiorPhoto',
    ];
    if (!validFields.includes(fieldName)) {
      return NextResponse.json(
        { error: 'Invalid field name' },
        { status: 400 }
      );
    }

    const folder =
      fieldName === 'autoInsurancePhoto'
        ? 'auto-insurance-photos'
        : 'vehicle-photos';
    const allowedTypes =
      fieldName === 'autoInsurancePhoto'
        ? ['image/', 'application/pdf']
        : ['image/'];

    const uploadResult = await uploadHaulerFileToCloudinary({
      file,
      folder,
      fileNamePrefix: fieldName,
      entityId: idNum,
      allowedTypes,
    });

    return NextResponse.json({
      url: uploadResult.fileUrl,
      message: 'File uploaded successfully',
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
