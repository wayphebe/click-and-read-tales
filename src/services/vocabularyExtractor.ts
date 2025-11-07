// 直接使用 aiService 中的 callLLMAPI 逻辑
async function callLLMAPI(messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>): Promise<string> {
  const API_KEY = 'sk-iznpfdhwqgjjgfqaozivucdgukiecgqajsfrabfdxujzeupe';
  const API_URL = 'https://api.siliconflow.cn/v1/chat/completions';
  const MODEL = 'THUDM/GLM-4-9B-0414';

  try {
    const requestBody = {
      model: MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 1500,
    };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from API');
    }

    return data.choices[0].message.content;
  } catch (error: any) {
    console.error('Error calling LLM API:', error);
    throw new Error(`词汇提取失败：${error.message}`);
  }
}

export interface VocabularyItem {
  chinese: string;
  english: string;
  phonetic?: string;
  category: string;
  example?: string;
  exampleChinese?: string;
}

/**
 * 从故事文本中提取适合学习的词汇
 * 优先提取：名词、动词、形容词（适合儿童学习的简单词汇）
 */
export async function extractVocabularyFromText(
  text: string,
  pageNumber: number
): Promise<VocabularyItem[]> {
  try {
    const prompt = `请从以下故事文本中提取3-5个适合儿童学习的词汇，并为每个词汇提供：
1. 中文词汇（从文本中提取）
2. 英文翻译（简单、常用，3-8个字母）
3. 音标（可选）
4. 词性（名词/动词/形容词）
5. 简单例句（英文+中文，适合儿童理解）

故事文本：${text}

要求：
- 选择儿童容易理解的词汇（如：动物、颜色、动作、情绪、物品等）
- 英文单词要简单（3-8个字母）
- 例句要简短，适合儿童
- 优先选择在故事中出现的具体名词和动作词

请以 JSON 格式输出，格式如下：
[
  {
    "chinese": "毛球",
    "english": "ball",
    "phonetic": "/bɔːl/",
    "category": "名词",
    "example": "The ball is round.",
    "exampleChinese": "球是圆的。"
  }
]`;

    const response = await callLLMAPI([
      {
        role: 'system',
        content: '你是一个英语教学专家，擅长为儿童选择适合学习的词汇。请只返回 JSON 数组，不要添加任何解释文字。'
      },
      {
        role: 'user',
        content: prompt
      }
    ]);

    // 尝试解析 JSON 响应
    try {
      // 清理响应文本，移除可能的 markdown 代码块标记
      let cleanedResponse = response.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/```\n?/g, '');
      }

      const vocabulary = JSON.parse(cleanedResponse);
      
      // 验证返回的数据格式
      if (Array.isArray(vocabulary) && vocabulary.length > 0) {
        return vocabulary.slice(0, 5); // 最多返回5个词汇
      }
    } catch (parseError) {
      console.error('Failed to parse vocabulary JSON:', parseError);
      console.log('Raw response:', response);
    }

    // 如果解析失败，使用默认词汇提取
    return getDefaultVocabulary(text);
  } catch (error) {
    console.error('Error extracting vocabulary:', error);
    return getDefaultVocabulary(text);
  }
}

/**
 * 如果 AI 提取失败，使用简单的关键词匹配
 */
function getDefaultVocabulary(text: string): VocabularyItem[] {
  // 简单的关键词映射（可以根据需要扩展）
  const keywordMap: { [key: string]: { english: string; category: string; example?: string } } = {
    '情绪': { english: 'emotion', category: '名词', example: 'I have many emotions. 我有很多情绪。' },
    '毛球': { english: 'ball', category: '名词', example: 'The ball is round. 球是圆的。' },
    '安静': { english: 'quiet', category: '形容词', example: 'Be quiet. 保持安静。' },
    '焦虑': { english: 'anxious', category: '形容词', example: 'I feel anxious. 我感到焦虑。' },
    '伤心': { english: 'sad', category: '形容词', example: 'I am sad. 我很伤心。' },
    '开心': { english: 'happy', category: '形容词', example: 'I am happy. 我很开心。' },
    '屋子': { english: 'house', category: '名词', example: 'This is my house. 这是我的屋子。' },
    '房间': { english: 'room', category: '名词', example: 'My room is big. 我的房间很大。' },
    '角落': { english: 'corner', category: '名词', example: 'The cat is in the corner. 猫在角落里。' },
    '森林': { english: 'forest', category: '名词', example: 'We walk in the forest. 我们在森林里走。' },
    '花园': { english: 'garden', category: '名词', example: 'The garden is beautiful. 花园很美丽。' },
    '糖果': { english: 'candy', category: '名词', example: 'I like candy. 我喜欢糖果。' },
    '寻找': { english: 'find', category: '动词', example: 'I find a treasure. 我找到了宝藏。' },
    '探索': { english: 'explore', category: '动词', example: 'Let\'s explore together. 让我们一起探索。' },
    '冒险': { english: 'adventure', category: '名词', example: 'This is an adventure. 这是一次冒险。' },
  };

  const vocabulary: VocabularyItem[] = [];
  const foundKeywords = new Set<string>();

  // 按文本顺序查找关键词
  for (const [chinese, data] of Object.entries(keywordMap)) {
    if (text.includes(chinese) && !foundKeywords.has(chinese)) {
      vocabulary.push({
        chinese,
        english: data.english,
        category: data.category,
        example: data.example
      });
      foundKeywords.add(chinese);
      if (vocabulary.length >= 5) break;
    }
  }

  // 如果找到的词汇少于3个，添加一些通用词汇
  if (vocabulary.length < 3) {
    const commonWords: VocabularyItem[] = [
      { chinese: '故事', english: 'story', category: '名词', example: 'I love this story. 我喜欢这个故事。' },
      { chinese: '朋友', english: 'friend', category: '名词', example: 'She is my friend. 她是我的朋友。' },
      { chinese: '快乐', english: 'happy', category: '形容词', example: 'I am happy. 我很快乐。' },
    ];
    
    for (const word of commonWords) {
      if (vocabulary.length >= 5) break;
      if (!vocabulary.find(v => v.chinese === word.chinese)) {
        vocabulary.push(word);
      }
    }
  }

  return vocabulary;
}

/**
 * 根据中文词汇选择合适的 emoji
 */
export function getEmojiForWord(chinese: string): string {
  const emojiMap: { [key: string]: string } = {
    '情绪': '😊',
    '毛球': '⚫',
    '安静': '🤫',
    '焦虑': '😰',
    '伤心': '😢',
    '开心': '😄',
    '屋子': '🏠',
    '房间': '🏡',
    '角落': '📍',
    '森林': '🌲',
    '花园': '🌺',
    '糖果': '🍬',
    '寻找': '🔍',
    '探索': '🗺️',
    '冒险': '⚔️',
    '故事': '📖',
    '朋友': '👫',
    '快乐': '😊',
  };

  return emojiMap[chinese] || '✨';
}

