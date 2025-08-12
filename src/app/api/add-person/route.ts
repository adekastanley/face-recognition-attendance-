import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Create directory for this person
    const personDir = path.join(process.cwd(), 'public', 'known', name.toLowerCase());
    
    try {
      await mkdir(personDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, that's fine
    }

    // Process uploaded images
    const imageEntries = Array.from(formData.entries()).filter(([key]) => 
      key.startsWith('image-')
    );

    if (imageEntries.length === 0) {
      return NextResponse.json(
        { error: 'At least one image is required' },
        { status: 400 }
      );
    }

    const savedImages = [];

    for (let i = 0; i < imageEntries.length; i++) {
      const [, file] = imageEntries[i];
      
      if (file instanceof File) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Generate filename
        const extension = path.extname(file.name) || '.jpg';
        const filename = `${i + 1}${extension}`;
        const filepath = path.join(personDir, filename);
        
        // Save file
        await writeFile(filepath, buffer);
        savedImages.push({
          filename,
          size: file.size,
          type: file.type
        });
      }
    }

    // You could also save metadata to a JSON file
    const metadata = {
      name,
      email: formData.get('email') as string || '',
      department: formData.get('department') as string || '',
      dateAdded: new Date().toISOString(),
      images: savedImages
    };

    const metadataPath = path.join(personDir, 'metadata.json');
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2));

    return NextResponse.json({
      success: true,
      message: `Added ${name} with ${savedImages.length} images`,
      data: metadata
    });

  } catch (error) {
    console.error('Error adding person:', error);
    return NextResponse.json(
      { error: 'Failed to add person' },
      { status: 500 }
    );
  }
}
