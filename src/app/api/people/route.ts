import { NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const knownDir = path.join(process.cwd(), 'public', 'known');
    
    try {
      const entries = await readdir(knownDir, { withFileTypes: true });
      const people = entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name);
      
      return NextResponse.json({
        success: true,
        people
      });
    } catch (error) {
      // Known directory doesn't exist yet
      return NextResponse.json({
        success: true,
        people: []
      });
    }
  } catch (error) {
    console.error('Error listing people:', error);
    return NextResponse.json(
      { error: 'Failed to list people' },
      { status: 500 }
    );
  }
}
