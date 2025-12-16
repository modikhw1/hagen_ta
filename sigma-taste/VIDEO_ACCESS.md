# Video Access Configuration

## Current Implementation

The comparison UI now embeds actual videos using this priority:

### 1. **GCS Videos (Primary)** ✅
- **Format**: `gs://hagen-video-analysis/videos/{uuid}.mp4`
- **Converted to**: `https://storage.googleapis.com/hagen-video-analysis/videos/{uuid}.mp4`
- **Benefits**:
  - Direct HTML5 video player
  - Full playback controls (play/pause, seek, speed)
  - Works with Vertex AI analysis workflow
  - Consistent experience

### 2. **TikTok Links (Fallback)**
- **Format**: `https://www.tiktok.com/@{user}/video/{id}`
- **Implementation**: "Open in TikTok" button (new tab)
- **Limitation**: TikTok doesn't allow iframe embeds without oEmbed API

---

## Making GCS Videos Publicly Accessible

Your videos are in: `gs://hagen-video-analysis/videos/`

### Option A: Make bucket publicly readable (Simple)
```bash
# Make all videos in the bucket publicly accessible
gsutil iam ch allUsers:objectViewer gs://hagen-video-analysis
```

⚠️ **Warning**: This makes ALL videos in the bucket public.

### Option B: Signed URLs (Secure, Recommended)
Generate temporary URLs that expire:

```javascript
// Add to your API route
import { Storage } from '@google-cloud/storage';

const storage = new Storage();

async function getSignedUrl(gcsUri: string) {
  const [bucket, ...pathParts] = gcsUri.replace('gs://', '').split('/');
  const file = storage.bucket(bucket).file(pathParts.join('/'));
  
  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  
  return url;
}
```

### Option C: Proxy through your API (Most secure)
Stream videos through your backend:

```typescript
// app/api/video/[id]/route.ts
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const video = await getVideoById(params.id);
  const gcsUri = video.gcs_uri;
  
  // Fetch from GCS and stream to client
  const storage = new Storage();
  const file = storage.bucket('hagen-video-analysis').file(gcsUri);
  const stream = file.createReadStream();
  
  return new Response(stream, {
    headers: { 'Content-Type': 'video/mp4' }
  });
}
```

---

## Current Status

**Your dataset**: 115 videos
- ~50% have GCS URIs ✅
- ~50% only have TikTok URLs (fallback to "Open" button)

**Recommendation**: Use Option A for development, Option B for production.

---

## Testing Access

Check if a GCS video is publicly accessible:
```bash
curl -I https://storage.googleapis.com/hagen-video-analysis/videos/f1bf750c-669f-4b05-9929-005c74bc55e1.mp4
```

**Expected**:
- ✅ `200 OK` = Video is accessible
- ❌ `403 Forbidden` = Need to configure access (use Option A/B/C above)

---

## Alternative: Use GCS Signed URLs in Dataset

If you want to pre-generate signed URLs during export:

```typescript
// When exporting your dataset
const videosWithSignedUrls = await Promise.all(
  videos.map(async (v) => {
    if (v.gcs_uri) {
      const signedUrl = await getSignedUrl(v.gcs_uri);
      return { ...v, video_player_url: signedUrl };
    }
    return v;
  })
);
```

Then update the UI to use `video.video_player_url` instead of converting `gcs_uri`.
