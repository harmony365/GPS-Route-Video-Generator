
import { GoogleGenAI } from "@google/genai";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateRouteVideo = async (base64MapImage: string): Promise<string> => {
    try {
        let operation = await ai.models.generateVideos({
            model: 'veo-2.0-generate-001',
            prompt: 'Animate a bright, glowing dot that smoothly follows the highlighted path on the provided map image. The dot should trace the entire route from start to finish. Make the animation clear, visually appealing, and cinematic.',
            image: {
                imageBytes: base64MapImage,
                mimeType: 'image/png',
            },
            config: {
                numberOfVideos: 1
            }
        });

        while (!operation.done) {
            await sleep(10000); // Poll every 10 seconds
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }
        
        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error("Video generation completed, but no download link was found.");
        }
        return downloadLink;

    } catch(error) {
        console.error("Error generating video with Gemini:", error);
        if (error instanceof Error && error.message.includes('API key not valid')) {
            throw new Error('The provided API Key is invalid. Please check your configuration.');
        }
        throw new Error("Failed to generate video. The AI model may be busy or an error occurred.");
    }
};

export const fetchVideoBlob = async (videoUri: string): Promise<Blob> => {
    try {
        const response = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
        if (!response.ok) {
            throw new Error(`Failed to download video file. Status: ${response.status}`);
        }
        return await response.blob();
    } catch(error) {
        console.error("Error fetching video blob:", error);
        throw new Error("Could not download the generated video file.");
    }
};
