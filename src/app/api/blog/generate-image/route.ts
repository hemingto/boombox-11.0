import { NextRequest, NextResponse } from 'next/server';
import openai from '@/lib/integrations/openaiClient';
import cloudinary from '@/lib/integrations/cloudinaryClient';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') ?? '';

    if (contentType.includes('multipart/form-data')) {
      return handleFileUpload(request);
    }

    return handlePromptGeneration(request);
  } catch (error) {
    console.error('[API /api/blog/generate-image] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process image request' },
      { status: 500 }
    );
  }
}

async function handlePromptGeneration(request: NextRequest) {
  const body = await request.json();
  const { prompt } = body;

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return NextResponse.json(
      { error: 'Image prompt is required' },
      { status: 400 }
    );
  }

  const imageResponse = await openai.images.generate({
    model: 'gpt-image-1',
    prompt: prompt.trim(),
    n: 1,
    size: '1536x1024',
    quality: 'medium',
  });

  const b64 = imageResponse.data?.[0]?.b64_json;
  if (!b64) {
    return NextResponse.json(
      { error: 'Image generation returned no result' },
      { status: 502 }
    );
  }

  const dataUri = `data:image/png;base64,${b64}`;
  const cloudinaryResult = await cloudinary.uploader.upload(dataUri, {
    folder: 'blog/featured-images',
    resource_type: 'image',
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  });

  return NextResponse.json({
    url: cloudinaryResult.secure_url,
    alt: 'Blog image',
  });
}

async function handleFileUpload(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

  const cloudinaryResult = await cloudinary.uploader.upload(base64, {
    folder: 'blog/featured-images',
    resource_type: 'image',
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  });

  return NextResponse.json({
    url: cloudinaryResult.secure_url,
    alt: file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
  });
}
