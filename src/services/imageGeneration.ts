import axios from 'axios';

const API_KEY = 'sk-wrxywlukwjwtsnokkewwmnntvlpocwfttdnkjhsyzgclyyxr';
const API_URL = 'https://api.siliconflow.cn/v1/images/generations';

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000; // 2 seconds
const MAX_RETRY_DELAY = 10000; // 10 seconds

export interface ImageGenerationRequest {
  prompt: string;
  imageSize?: string;
  batchSize?: number;
  numInferenceSteps?: number;
  guidanceScale?: number;
}

interface ImageData {
  url: string;
}

export interface ImageGenerationResponse {
  images: ImageData[];
}

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to calculate exponential backoff delay
const getRetryDelay = (retryCount: number): number => {
  const exponentialDelay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
  return Math.min(exponentialDelay, MAX_RETRY_DELAY);
};

export const generateImage = async ({
  prompt,
  imageSize = '1024x1024',
  batchSize = 1,
  numInferenceSteps = 40,  // 增加步数以获得更细腻的效果
  guidanceScale = 6.5,     // 降低一点以获得更自然的效果
}: ImageGenerationRequest): Promise<string> => {
  let retryCount = 0;

  while (retryCount <= MAX_RETRIES) {
    try {
      if (retryCount > 0) {
        // Calculate and apply exponential backoff delay
        const retryDelay = getRetryDelay(retryCount - 1);
        console.log(`Retrying image generation after ${retryDelay}ms delay (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
        await delay(retryDelay);
      }

      const response = await axios.post<ImageGenerationResponse>(
        API_URL,
        {
          model: 'Kwai-Kolors/Kolors',
          prompt,
          image_size: imageSize,
          batch_size: batchSize,
          num_inference_steps: numInferenceSteps,
          guidance_scale: guidanceScale,
        },
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.images && response.data.images.length > 0) {
        return response.data.images[0].url;
      }
      throw new Error('No image generated');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          if (retryCount === MAX_RETRIES) {
            throw new Error('达到最大重试次数，图片生成失败。请稍后再试。');
          }
          retryCount++;
          continue;
        }
        // For other errors, throw immediately
        throw new Error(`图片生成失败: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  throw new Error('图片生成失败，请稍后再试。');
}; 