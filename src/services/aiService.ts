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
  // 使用场景分隔符分割内容
  const scenes = content
    .split('---')
    .map(scene => scene.trim())
    .filter(scene => scene.length > 0);
  
  // 如果没有使用分隔符，尝试按句子分割
  if (scenes.length < 2) {
    const sentences = content
      .split(/[。！？]/)
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => s + '。');

    // 确保每个场景至少有一个完整的句子
    const scenes = [];
    let currentScene = [];
    
    for (const sentence of sentences) {
      currentScene.push(sentence);
      
      // 当当前场景有1-2个句子时，形成一个新场景
      if (currentScene.length >= 1 && currentScene.length <= 2) {
        scenes.push(currentScene.join(''));
        currentScene = [];
      }
    }
    
    // 处理剩余的句子
    if (currentScene.length > 0) {
      scenes.push(currentScene.join(''));
    }
  }

  // 确保正好有6个场景
  const finalScenes = scenes.slice(0, 6);
  while (finalScenes.length < 6) {
    finalScenes.push('继续探索...');
  }

  return finalScenes;
}

export async function generateStoryPages(
  character: string,
  mood: string,
  setting: string,
  themes: string[],
  additionalElements?: string
): Promise<string[]> {
  const systemPrompt = `想象你正坐在一个温暖的小房间里，周围围着一群好奇的小朋友，他们眼睛亮晶晶地看着你。你不是在"写"故事，而是在用心"讲"故事。

你要讲一个六个场景的绘本故事。每个场景都是一幅画面，配上简短的文字。

记住：
- 故事不是教材，是心与心的对话
- 让故事自然流露，像在跟小朋友聊天
- 用心感受每个角色，让他们自己告诉你他们的故事
- 相信直觉，相信第一个出现在脑海中的画面

讲故事时：
- 每个场景只描述一个画面和一个情节
- 场景之间要自然连贯，像溪水流淌
- 用简单的语言，让画面在心里展开
- 不要怕重复，童真本就喜欢重复
- 用声音、动作等感官描述增加趣味

互动时：
- 用自然的问题引导小朋友思考和想象
- 让小朋友也能参与到故事中
- 让惊喜在故事中自然发生

格式要求：
- 每个场景都是独立的一个画面
- 每个场景的文字要简短自然，像在跟小朋友说话
- 只用中文，不要使用英文
- 每个场景用"---"分隔
- 每个场景1-2句话，不要太长`;

  const userPrompt = `让我们一起讲一个关于${character}的故事吧。

${character}现在在${setting}里，心里充满了${mood}的感觉。
${additionalElements ? `在这里，${additionalElements}` : ''}
${themes.length > 0 ? `我们可以聊聊${themes.join('、')}。` : ''}

让我们跟着${character}的脚步，
一起去看看会遇到什么样的惊喜。

记得：
- 每个场景都是一幅独立的画面
- 场景之间要自然连接
- 用温暖的语气讲述
- 让小朋友能参与其中

示例场景：
小朋友，你看！${character}正在${setting}里轻轻地走着，它的心里满是${mood}的感觉...
---
（继续用六个独立场景讲述故事）`;

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