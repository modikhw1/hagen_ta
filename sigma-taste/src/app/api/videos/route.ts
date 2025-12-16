import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Try signed URLs dataset first, fallback to original
    const signedUrlsPath = path.join(process.cwd(), '..', 'exports', 'exports_with_urls_2025-12-16.json');
    const originalPath = path.join(process.cwd(), '..', 'exports', 'dataset_2025-12-16.json');
    
    let datasetPath = signedUrlsPath;
    if (!fs.existsSync(signedUrlsPath)) {
      console.log('Signed URLs dataset not found, using original');
      datasetPath = originalPath;
    }
    
    console.log('Loading dataset from:', datasetPath);
    
    if (fs.existsSync(datasetPath)) {
      const rawData = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));
      
      // The JSON has a wrapper: { exportedAt, source, totalVideos, videos: [...] }
      const videos = rawData.videos || rawData;
      
      console.log('Loaded', Array.isArray(videos) ? videos.length : 0, 'videos');
      if (rawData.videosWithSignedUrls) {
        console.log('  -', rawData.videosWithSignedUrls, 'with signed URLs');
      }
      
      return NextResponse.json(videos);
    }
    
    console.log('Dataset file not found');
    return NextResponse.json([]);
  } catch (error) {
    console.error('Error loading videos:', error);
    return NextResponse.json([], { status: 500 });
  }
}
