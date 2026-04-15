/**
 * Video Compression Utility
 * Compresses videos on the client-side before uploading to reduce file size and bandwidth
 */

export interface CompressionOptions {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    quality?: number; // 0-1
    fileType?: string;
}

/**
 * Compress a video file using HTML5 Canvas and MediaRecorder API
 */
export async function compressVideo(
    file: File,
    options: CompressionOptions = {}
): Promise<File> {
    const {
        maxSizeMB = 20, // Target max size in MB
        maxWidthOrHeight = 1280, // Max dimension
        quality = 0.8,
        fileType = 'video/webm',
    } = options;

    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
        }

        video.preload = 'metadata';
        video.muted = true;
        video.playsInline = true;

        const url = URL.createObjectURL(file);
        video.src = url;

        video.onloadedmetadata = async () => {
            try {
                // Calculate new dimensions
                let { videoWidth: width, videoHeight: height } = video;

                if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
                    if (width > height) {
                        height = (height / width) * maxWidthOrHeight;
                        width = maxWidthOrHeight;
                    } else {
                        width = (width / height) * maxWidthOrHeight;
                        height = maxWidthOrHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                // Set up MediaRecorder
                const stream = canvas.captureStream();
                const mediaRecorder = new MediaRecorder(stream, {
                    mimeType: fileType,
                    videoBitsPerSecond: 2500000, // 2.5 Mbps
                });

                const chunks: Blob[] = [];

                mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) {
                        chunks.push(e.data);
                    }
                };

                mediaRecorder.onstop = () => {
                    const blob = new Blob(chunks, { type: fileType });
                    const compressedFile = new File(
                        [blob],
                        file.name.replace(/\.[^/.]+$/, '.webm'),
                        { type: fileType }
                    );

                    URL.revokeObjectURL(url);

                    // Check if compression actually reduced file size
                    if (compressedFile.size < file.size) {
                        resolve(compressedFile);
                    } else {
                        // If compression didn't help, return original
                        resolve(file);
                    }
                };

                mediaRecorder.onerror = (e) => {
                    URL.revokeObjectURL(url);
                    reject(new Error('MediaRecorder error: ' + e));
                };

                // Start recording
                mediaRecorder.start();

                // Play video and draw frames
                video.play();

                const drawFrame = () => {
                    if (video.ended) {
                        mediaRecorder.stop();
                        return;
                    }

                    ctx.drawImage(video, 0, 0, width, height);
                    requestAnimationFrame(drawFrame);
                };

                drawFrame();
            } catch (err) {
                URL.revokeObjectURL(url);
                reject(err);
            }
        };

        video.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load video'));
        };
    });
}

/**
 * Check if video compression is needed based on file size
 */
export function shouldCompressVideo(file: File, thresholdMB: number = 10): boolean {
    const fileSizeMB = file.size / 1024 / 1024;
    return fileSizeMB > thresholdMB;
}

/**
 * Get video duration
 */
export async function getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.muted = true;
        video.playsInline = true;

        const url = URL.createObjectURL(file);
        video.src = url;

        video.onloadedmetadata = () => {
            URL.revokeObjectURL(url);
            resolve(video.duration);
        };

        video.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load video metadata'));
        };
    });
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
