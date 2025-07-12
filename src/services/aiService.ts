interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface LLMResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

// 使用环境变量或默认值
const API_KEY = 'sk-iznpfdhwqgjjgfqaozivucdgukiecgqajsfrabfdxujzeupe';
const API_URL = 'https://api.siliconflow.cn/v1/chat/completions';
const MODEL = 'THUDM/GLM-4-9B-0414';

// 添加测试函数
async function testLLMAPI() {
  const testMessage = {
    role: 'user' as const,
    content: '你好，请给我讲一个简短的故事。'
  };
  
  try {
    const response = await callLLMAPI([testMessage]);
    console.log('Test API call successful. Response:', response);
    return true;
  } catch (error) {
    console.error('Test API call failed:', error);
    return false;
  }
}

async function callLLMAPI(messages: Message[]): Promise<string> {
  try {
    console.log('Calling LLM API with messages:', JSON.stringify(messages, null, 2));
    
    const requestBody = {
      model: MODEL,
      messages,
      temperature: 0.8, // Increased for more creativity
      max_tokens: 2000,
      presence_penalty: 0.6, // Added to encourage diverse vocabulary
      frequency_penalty: 0.6, // Added to reduce repetition
    };
    
    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('API Response status:', response.status);
    const responseText = await response.text();
    console.log('Raw API Response:', responseText);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${responseText}`);
    }

    let data: LLMResponse;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`Failed to parse API response: ${e.message}`);
    }

    console.log('Parsed API Response data:', JSON.stringify(data, null, 2));
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from API');
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling LLM API:', error);
    throw new Error(`故事生成失败，请稍后再试。错误详情：${error.message}`);
  }
}

// 在模块加载时进行API测试
console.log('Testing LLM API connection...');
testLLMAPI().then(success => {
  console.log('LLM API test result:', success ? 'SUCCESS' : 'FAILED');
});

function formatStoryPages(content: string): string[] {
  // 尝试多种可能的页面分隔符
  const pageMarkers = [
    /第[一二三四五六]页[：:]/,
    /第[123456]页[：:]/,
    /[123456][.、][^.]*?(?=[123456][.、]|$)/,
  ];

  for (const marker of pageMarkers) {
    const pages = content
      .split(marker)
      .map(page => page.trim())
      .filter(page => page.length > 0);

    if (pages.length === 6) {
      return pages;
    }
  }

  // 如果没有找到合适的分隔符，尝试强制分割
  const cleanContent = content
    .replace(/[^。！？\n]+(?=[。！？])/g, match => match.trim())
    .split(/[。！？]/)
    .filter(sentence => sentence.trim().length > 0)
    .map(sentence => sentence.trim());

  if (cleanContent.length >= 6) {
    // 将内容平均分配到6页
    const pages: string[] = [];
    const sentencesPerPage = Math.ceil(cleanContent.length / 6);
    
    for (let i = 0; i < 6; i++) {
      const start = i * sentencesPerPage;
      const end = Math.min(start + sentencesPerPage, cleanContent.length);
      const pageContent = cleanContent.slice(start, end).join('。') + '。';
      pages.push(pageContent);
    }
    
    return pages;
  }

  throw new Error('无法正确分割故事内容');
}

export async function generateStoryPages(
  character: string,
  mood: string,
  setting: string,
  themes: string[],
  additionalElements?: string
): Promise<string[]> {
  const systemPrompt = `你是一个专业的儿童故事作家。请创作一个6页的儿童故事，遵循以下要求：

创作原则：
1. 使用简单、童趣的语言，像孩子说话一样
2. 加入重复的短语和情感表达
3. 使用拟声词和动作词增加趣味性
4. 保持天真、朴实的写作风格

故事结构：
1. 每页2-3句话，使用简单易懂的语言
2. 故事要有清晰的开始、发展和结局
3. 每页都要包含互动元素或简单问题
4. 每页的内容必须以"第X页："开头（X为1-6）

语言要求：
1. 使用3-8岁儿童能理解的词汇
2. 句子要简短，避免复杂的从句
3. 适当重复关键词和短语
4. 加入拟声词和感叹词

互动设计：
1. 每页加入寻找物品、动作模仿等互动
2. 设计简单的是非题或选择题
3. 鼓励读者参与故事发展

格式规范：
1. 严格按照"第1页："到"第6页："标记
2. 每页结尾用句号
3. 确保内容积极向上，适合儿童`;

  const userPrompt = `请创作一个有趣的儿童故事，包含以下元素：
- 主角：${character}
- 心情：${mood}
- 场景：${setting}
- 主题：${themes.join('、')}
${additionalElements ? `- 额外元素：${additionalElements}` : ''}

要求：
1. 必须自然地融入所有指定元素，包括额外元素
2. 每页都要有互动性的问题或动作引导
3. 使用拟声词和动作词增加趣味性
4. 加入适当的重复句式
5. 确保每页都以"第X页："开头

示例格式：
第1页：小兔子蹦蹦跳跳地来到花园。"噗通噗通"，它的心跳得好快哦！你能找到藏在花丛中的小兔子吗？
第2页：...（以此类推）`;

  try {
    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const storyContent = await callLLMAPI(messages);
    console.log('LLM Response:', storyContent);

    const pages = formatStoryPages(storyContent);
    
    if (pages.length !== 6) {
      throw new Error('生成的故事页数不正确');
    }

    return pages.map(page => 
      page.endsWith('。') ? page : page + '。'
    );
  } catch (error) {
    console.error('Error generating story pages:', error);
    throw error;
  }
} 