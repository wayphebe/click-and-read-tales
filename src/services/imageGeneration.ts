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

// 快速图片生成（用于流式生成）
export const generateImageFast = async ({
  prompt,
  imageSize = '512x512',
  batchSize = 1,
  numInferenceSteps = 20,  // 降低步数提升速度
  guidanceScale = 5.0,     // 降低引导比例
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
        const status = error.response?.status;
        const responseData = error.response?.data;
        
        // 检查是否是重试性错误（429限流或5xx服务器错误）
        const isRetryableError = status === 429 || (status && status >= 500 && status < 600);
        
        if (isRetryableError) {
          if (retryCount === MAX_RETRIES) {
            const errorMsg = status === 429 
              ? '达到最大重试次数，图片生成失败。请稍后再试。'
              : `服务器错误（${status}），已重试${MAX_RETRIES + 1}次仍失败。请稍后再试。`;
            throw new Error(errorMsg);
          }
          retryCount++;
          const retryDelay = getRetryDelay(retryCount - 1);
          console.log(`图片生成失败（状态码: ${status}），将在 ${retryDelay}ms 后重试（第 ${retryCount + 1}/${MAX_RETRIES + 1} 次尝试）`);
          continue;
        }
        
        // 对于非重试性错误，提取错误消息
        let errorMessage = '未知错误';
        if (responseData) {
          // 尝试多种可能的错误消息字段
          errorMessage = responseData.message || 
                        responseData.error?.message || 
                        responseData.error || 
                        (typeof responseData === 'string' ? responseData : error.message);
        } else {
          errorMessage = error.message;
        }
        
        throw new Error(`图片生成失败: ${errorMessage}${status ? ` (HTTP ${status})` : ''}`);
      }
      throw error;
    }
  }

  throw new Error('图片生成失败，请稍后再试。');
};

// 标准图片生成（保持原有质量）
export const generateImage = async ({
  prompt,
  imageSize = '1024x1024',
  batchSize = 1,
  numInferenceSteps = 40,  // 保持原有步数
  guidanceScale = 6.5,     // 保持原有引导比例
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
        const status = error.response?.status;
        const responseData = error.response?.data;
        
        // 检查是否是重试性错误（429限流或5xx服务器错误）
        const isRetryableError = status === 429 || (status && status >= 500 && status < 600);
        
        if (isRetryableError) {
          if (retryCount === MAX_RETRIES) {
            const errorMsg = status === 429 
              ? '达到最大重试次数，图片生成失败。请稍后再试。'
              : `服务器错误（${status}），已重试${MAX_RETRIES + 1}次仍失败。请稍后再试。`;
            throw new Error(errorMsg);
          }
          retryCount++;
          const retryDelay = getRetryDelay(retryCount - 1);
          console.log(`图片生成失败（状态码: ${status}），将在 ${retryDelay}ms 后重试（第 ${retryCount + 1}/${MAX_RETRIES + 1} 次尝试）`);
          continue;
        }
        
        // 对于非重试性错误，提取错误消息
        let errorMessage = '未知错误';
        if (responseData) {
          // 尝试多种可能的错误消息字段
          errorMessage = responseData.message || 
                        responseData.error?.message || 
                        responseData.error || 
                        (typeof responseData === 'string' ? responseData : error.message);
        } else {
          errorMessage = error.message;
        }
        
        throw new Error(`图片生成失败: ${errorMessage}${status ? ` (HTTP ${status})` : ''}`);
      }
      throw error;
    }
  }

  throw new Error('图片生成失败，请稍后再试。');
};
