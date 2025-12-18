import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // v1.2 dataset path
    const v1_2Path = path.join(process.cwd(), '..', 'exports', 'v1.2', 'dataset_2025-12-18.json');
    // Fallback to v1.1 if v1.2 not found
    const v1_1Path = path.join(process.cwd(), '..', 'exports', 'v1.1', 'dataset_2025-12-16.json');
    
    let datasetPath = v1_2Path;
    if (!fs.existsSync(v1_2Path)) {
      console.log('v1.2 dataset not found, falling back to v1.1');
      datasetPath = v1_1Path;
    }
    
    console.log('Loading dataset from:', datasetPath);
    
    if (fs.existsSync(datasetPath)) {
      const rawData = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));
      
      // The JSON has a wrapper: { exportedAt, source, totalVideos, videos: [...] }
      const rawVideos = rawData.videos || rawData;
      
      // Normalize video data: map visual_analysis -> deep_analysis for consistency
      const videos = (Array.isArray(rawVideos) ? rawVideos : []).map((video: any) => {
        // Map visual_analysis to deep_analysis if needed
        if (video.visual_analysis && !video.deep_analysis) {
          return {
            ...video,
            deep_analysis: video.visual_analysis,
          };
        }
        return video;
      });
      
      console.log('Loaded', videos.length, 'videos');
      if (rawData.videosWithSignedUrls) {
        console.log('  -', rawData.videosWithSignedUrls, 'with signed URLs');
      }
      
      // Check how many have deep_analysis
      const withAnalysis = videos.filter((v: any) => v.deep_analysis).length;
      console.log('  -', withAnalysis, 'with deep_analysis');
      
      return NextResponse.json(videos);
    }
    
    console.log('Dataset file not found');
    return NextResponse.json([]);
  } catch (error) {
    console.error('Error loading videos:', error);
    return NextResponse.json([], { status: 500 });
  }
}
