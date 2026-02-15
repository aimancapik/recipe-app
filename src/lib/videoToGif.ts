import { GIFEncoder, quantize, applyPalette } from 'gifenc';

interface ConvertOptions {
    /** Max width of the output GIF (default: 320px) */
    maxWidth?: number;
    /** Frames per second to sample (default: 10) */
    fps?: number;
    /** Max duration in seconds to capture (default: 6) */
    maxDuration?: number;
}

/**
 * Convert a video File to an animated GIF Blob.
 * Extracts frames from the video using canvas, then encodes as GIF.
 *
 * Runs entirely in the browser — no server needed.
 */
export async function videoToGif(
    videoFile: File,
    options: ConvertOptions = {}
): Promise<File> {
    const { maxWidth = 320, fps = 10, maxDuration = 6 } = options;

    // Load the video into a <video> element
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;

    const videoUrl = URL.createObjectURL(videoFile);
    video.src = videoUrl;

    // Wait for metadata to load
    await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error('Failed to load video'));
    });

    // Calculate dimensions (maintain aspect ratio)
    const scale = Math.min(1, maxWidth / video.videoWidth);
    const width = Math.round(video.videoWidth * scale);
    const height = Math.round(video.videoHeight * scale);

    // Set up canvas for frame extraction
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Determine how many frames to capture
    const duration = Math.min(video.duration, maxDuration);
    const totalFrames = Math.floor(duration * fps);
    const delay = Math.round(1000 / fps); // ms per frame

    // Initialize GIF encoder
    const gif = GIFEncoder();

    // Extract frames by seeking through the video
    for (let i = 0; i < totalFrames; i++) {
        const time = (i / fps);
        video.currentTime = time;

        // Wait for the frame to be ready
        await new Promise<void>((resolve) => {
            video.onseeked = () => resolve();
        });

        // Draw the video frame onto the canvas
        ctx.drawImage(video, 0, 0, width, height);

        // Get pixel data
        const imageData = ctx.getImageData(0, 0, width, height);

        // Quantize colors (GIF supports max 256 colors per frame)
        const palette = quantize(imageData.data, 256);
        const index = applyPalette(imageData.data, palette);

        // Add frame to the GIF
        gif.writeFrame(index, width, height, { palette, delay });
    }

    // Finish encoding
    gif.finish();

    // Clean up
    URL.revokeObjectURL(videoUrl);

    // Create a File from the GIF bytes
    const gifBlob = new Blob([gif.bytes()], { type: 'image/gif' });
    const gifFileName = videoFile.name.replace(/\.[^.]+$/, '.gif');

    return new File([gifBlob], gifFileName, { type: 'image/gif' });
}
