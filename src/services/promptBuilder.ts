/**
 * 提示词构建工具函数
 * 用于将用户选择历史追加到基础提示词中
 */

/**
 * 构建包含用户选择历史的提示词
 * @param basePrompt 基础提示词
 * @param userChoices 用户选择历史数组（例如：['A', 'B', 'A']）
 * @returns 包含用户选择历史的完整提示词
 */
export function buildPrompt(basePrompt: string, userChoices: string[]): string {
  if (userChoices.length === 0) {
    return basePrompt;
  }

  const history = userChoices
    .map((choice, i) => `第${i + 1}次选择: ${choice}`)
    .join('\n');

  return `${basePrompt}\n\n请根据以下用户选择调整故事和画面：\n${history}\n\n请确保故事内容与用户的选择保持一致，自然地延续前面的情节。`;
}

/**
 * 为故事页面生成构建包含用户选择的提示词
 * @param basePagePrompt 基础页面提示词（已包含页面文本）
 * @param userChoices 用户选择历史
 * @returns 包含用户选择历史的页面提示词
 */
export function buildPagePrompt(basePagePrompt: string, userChoices: string[]): string {
  return buildPrompt(basePagePrompt, userChoices);
}

/**
 * 为故事文本生成构建包含用户选择的提示词
 * @param baseStoryPrompt 基础故事提示词
 * @param userChoices 用户选择历史
 * @returns 包含用户选择历史的故事提示词
 */
export function buildStoryPrompt(baseStoryPrompt: string, userChoices: string[]): string {
  return buildPrompt(baseStoryPrompt, userChoices);
}

