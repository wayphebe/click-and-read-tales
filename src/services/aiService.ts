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
  let scenes = content
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
    const newScenes = [];  // 使用新变量名避免冲突
    let currentScene = [];
    
    for (const sentence of sentences) {
      currentScene.push(sentence);
      
      // 当当前场景有1-2个句子时，形成一个新场景
      if (currentScene.length >= 1 && currentScene.length <= 2) {
        newScenes.push(currentScene.join(''));
        currentScene = [];
      }
    }
    
    // 处理剩余的句子
    if (currentScene.length > 0) {
      newScenes.push(currentScene.join(''));
    }
    
    scenes = newScenes;  // 更新 scenes 变量
  }

  // 支持6-7页：优先6页，如果内容足够可以扩展到7页
  const minPages = 6;
  const maxPages = 7;
  
  // 如果场景数量在6-7之间，直接使用
  if (scenes.length >= minPages && scenes.length <= maxPages) {
    return scenes;
  }
  
  // 如果场景少于6个，补充到6个
  const finalScenes = scenes.slice(0, maxPages);
  while (finalScenes.length < minPages) {
    finalScenes.push('继续探索...');
  }
  
  // 如果场景多于7个，截取前7个
  return finalScenes.slice(0, maxPages);
}

// 页面生成结果接口
export interface StoryPageWithChoices {
  text: string;
  choices: {
    text: string;
    emoji: string;
    description: string; // 用于生成反馈信息
  }[];
  isLastPage: boolean;
}

// 生成单页故事内容（带选择项）
export async function generateStoryPageWithChoices(
  character: string,
  mood: string,
  setting: string,
  themes: string[],
  pageNumber: number,
  previousPages: Array<{ text: string; userChoice?: string }> = [],
  additionalElements?: string
): Promise<StoryPageWithChoices> {
  const systemPrompt = `你是一个会讲故事的AI，正在为小朋友创作一个互动绘本故事。

你的任务是生成故事的一个页面，这个页面应该：
1. 包含1-2句简短的故事文本（适合儿童阅读）
2. 提供2个选择项，让小朋友决定故事接下来的发展方向
3. 根据之前的故事内容，自然地延续情节

要求：
- 故事文本要温暖、有趣，适合儿童
- 选择项要清晰、有趣，能够引导不同的故事方向
- 如果是最后一页（第5页），不需要提供选择项，而是给出一个温暖的结局
- 所有内容只用中文

输出格式（严格按照以下格式）：
STORY_TEXT: [故事文本内容]
CHOICE_1: [选择项1的文本] | [选择项1的表情符号] | [选择项1的简短描述]
CHOICE_2: [选择项2的文本] | [选择项2的表情符号] | [选择项2的简短描述]
IS_LAST: [true/false]`;

  // 构建故事上下文
  let storyContext = '';
  if (previousPages.length > 0) {
    storyContext = '\n\n之前的故事内容：\n';
    previousPages.forEach((page, index) => {
      storyContext += `第${index + 1}页：${page.text}\n`;
      if (page.userChoice) {
        storyContext += `小朋友选择了：${page.userChoice}\n`;
      }
    });
    storyContext += '\n现在请继续讲述故事...\n';
  }

  const userPrompt = `让我们一起继续讲关于${character}的故事。

${character}现在在${setting}里，心里充满了${mood}的感觉。
${additionalElements ? `在这里，${additionalElements}` : ''}
${themes.length > 0 ? `故事的主题包括：${themes.join('、')}。` : ''}

${pageNumber === 1 
  ? '这是故事的第一页，请开始讲述这个故事。'
  : `这是故事的第${pageNumber}页。${storyContext}`
}

${pageNumber >= 6 
    ? '这是故事的最后一页，请给出一个温暖、完整的结局，不需要选择项。'
    : '请生成这一页的故事内容和2个选择项。'
}

请按照指定的格式输出。`;

  try {
    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    console.log(`[generateStoryPageWithChoices] ====== 开始生成第 ${pageNumber} 页 ======`);
    console.log(`[generateStoryPageWithChoices] 参数:`, {
      character,
      mood,
      setting,
      themes,
      pageNumber,
      previousPagesCount: previousPages.length,
      additionalElements
    });
    
    const response = await callLLMAPI(messages);
    console.log(`[generateStoryPageWithChoices] ====== LLM 原始响应 (第 ${pageNumber} 页) ======`);
    console.log(`[generateStoryPageWithChoices] 响应长度:`, response.length);
    console.log(`[generateStoryPageWithChoices] 完整响应:`, response);
    console.log(`[generateStoryPageWithChoices] 响应前500字符:`, response.substring(0, 500));

    // 解析响应
    console.log(`[generateStoryPageWithChoices] ====== 开始解析响应 (第 ${pageNumber} 页) ======`);
    const result = parseStoryPageWithChoices(response, pageNumber);
    console.log(`[generateStoryPageWithChoices] ====== 解析结果 (第 ${pageNumber} 页) ======`);
    console.log(`[generateStoryPageWithChoices] 故事文本:`, result.text);
    console.log(`[generateStoryPageWithChoices] 选择项数量:`, result.choices.length);
    console.log(`[generateStoryPageWithChoices] 选择项详情:`, JSON.stringify(result.choices, null, 2));
    console.log(`[generateStoryPageWithChoices] 是否最后一页:`, result.isLastPage);
    console.log(`[generateStoryPageWithChoices] ====== 解析完成 (第 ${pageNumber} 页) ======`);
    return result;
  } catch (error) {
    console.error('Error generating story page with choices:', error);
    throw error;
  }
}

// 解析包含选择项的故事页面
function parseStoryPageWithChoices(content: string, pageNumber: number): StoryPageWithChoices {
  console.log(`[parseStoryPageWithChoices] Page ${pageNumber} - Content length:`, content.length);
  console.log(`[parseStoryPageWithChoices] Raw content:`, content.substring(0, 500));
  
  // 提取故事文本
  const storyMatch = content.match(/STORY_TEXT:\s*(.+?)(?=CHOICE_|IS_LAST|$)/s);
  const storyText = storyMatch ? storyMatch[1].trim() : '故事继续...';
  console.log(`[parseStoryPageWithChoices] Extracted story text:`, storyText);

  // 检查是否是最后一页（支持6-7页）
  const isLastMatch = content.match(/IS_LAST:\s*(true|false)/i);
  const isLastPage = isLastMatch ? isLastMatch[1].toLowerCase() === 'true' : pageNumber >= 6;
  console.log(`[parseStoryPageWithChoices] Is last page:`, isLastPage, `(pageNumber: ${pageNumber})`);

  // 如果是最后一页，不提取选择项
  if (isLastPage) {
    return {
      text: storyText.endsWith('。') ? storyText : storyText + '。',
      choices: [],
      isLastPage: true
    };
  }

  // 提取选择项 - 使用多种格式匹配以提高容错性
  const choices: { text: string; emoji: string; description: string }[] = [];
  
  // 尝试多种格式匹配
  const choice1Patterns = [
    /CHOICE_1:\s*(.+?)(?=CHOICE_2|IS_LAST|$)/s,
    /CHOICE1[：:]\s*(.+?)(?=CHOICE2|IS_LAST|$)/s,
    /选择1[：:]\s*(.+?)(?=选择2|IS_LAST|$)/s,
    /选项1[：:]\s*(.+?)(?=选项2|IS_LAST|$)/s,
  ];
  
  const choice2Patterns = [
    /CHOICE_2:\s*(.+?)(?=IS_LAST|$)/s,
    /CHOICE2[：:]\s*(.+?)(?=IS_LAST|$)/s,
    /选择2[：:]\s*(.+?)(?=IS_LAST|$)/s,
    /选项2[：:]\s*(.+?)(?=IS_LAST|$)/s,
  ];

  let choice1Match = null;
  let choice2Match = null;

  // 尝试匹配第一个选择项
  for (const pattern of choice1Patterns) {
    choice1Match = content.match(pattern);
    if (choice1Match) {
      console.log(`[parseStoryPageWithChoices] Found CHOICE_1 with pattern:`, pattern);
      break;
    }
  }

  // 尝试匹配第二个选择项
  for (const pattern of choice2Patterns) {
    choice2Match = content.match(pattern);
    if (choice2Match) {
      console.log(`[parseStoryPageWithChoices] Found CHOICE_2 with pattern:`, pattern);
      break;
    }
  }

  if (choice1Match) {
    const choice1Parts = choice1Match[1].trim().split('|').map(s => s.trim());
    const choice1 = {
      text: choice1Parts[0] || '选择1',
      emoji: choice1Parts[1] || '✨',
      description: choice1Parts[2] || '继续探索'
    };
    choices.push(choice1);
    console.log(`[parseStoryPageWithChoices] Extracted choice 1:`, choice1);
  }

  if (choice2Match) {
    const choice2Parts = choice2Match[1].trim().split('|').map(s => s.trim());
    const choice2 = {
      text: choice2Parts[0] || '选择2',
      emoji: choice2Parts[1] || '🌟',
      description: choice2Parts[2] || '继续探索'
    };
    choices.push(choice2);
    console.log(`[parseStoryPageWithChoices] Extracted choice 2:`, choice2);
  }

  // 如果没有解析到选择项，提供默认值
  if (choices.length === 0) {
    console.warn(`[parseStoryPageWithChoices] No choices found for page ${pageNumber}, using default choices`);
    choices.push(
      { text: '继续前进', emoji: '🚀', description: '勇敢地继续前进' },
      { text: '停下来看看', emoji: '🔍', description: '停下来仔细观察' }
    );
  } else if (choices.length === 1) {
    // 如果只有一个选择项，添加第二个
    console.warn(`[parseStoryPageWithChoices] Only one choice found for page ${pageNumber}, adding default second choice`);
    choices.push(
      { text: '换个方向', emoji: '🔄', description: '尝试不同的路径' }
    );
  }

  console.log(`[parseStoryPageWithChoices] Final choices count:`, choices.length);

  return {
    text: storyText.endsWith('。') ? storyText : storyText + '。',
    choices: choices.slice(0, 2), // 确保只有2个选择项
    isLastPage: false
  };
}

export async function generateStoryPages(
  character: string,
  mood: string,
  setting: string,
  themes: string[],
  additionalElements?: string
): Promise<string[]> {
  const systemPrompt = `想象你正坐在一个温暖的小房间里，周围围着一群好奇的小朋友，他们眼睛亮晶晶地看着你。你不是在"写"故事，而是在用心"讲"故事。

你要讲一个六到七个场景的绘本故事。每个场景都是一幅画面，配上简短的文字。

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
（继续用六到七个独立场景讲述故事）`;

  try {
    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const storyContent = await callLLMAPI(messages);
    console.log('LLM Response:', storyContent);

    const pages = formatStoryPages(storyContent);
    
    // 支持6-7页
    if (pages.length < 6 || pages.length > 7) {
      throw new Error(`生成的故事页数不正确，期望6-7页，实际${pages.length}页`);
    }

    return pages.map(page => 
      page.endsWith('。') ? page : page + '。'
    );
  } catch (error) {
    console.error('Error generating story pages:', error);
    throw error;
  }
} 