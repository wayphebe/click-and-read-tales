// 简单的流式生成测试
const { StreamingStoryGenerator } = require('./src/services/streamingStoryGenerator.ts');

async function testStreamingGeneration() {
  console.log('开始测试流式生成...');
  
  const generator = new StreamingStoryGenerator({
    onProgress: (progress) => {
      console.log(`进度: ${progress.step} - ${progress.progress}%`);
    },
    onPageReady: (page, pageIndex) => {
      console.log(`页面 ${pageIndex + 1} 准备就绪:`, page.isReady ? '是' : '否');
    },
    onComplete: () => {
      console.log('流式生成完成！');
    },
    onError: (error, pageIndex) => {
      console.error(`页面 ${pageIndex + 1} 生成错误:`, error.message);
    }
  });

  const prompt = {
    mainCharacter: '小兔子',
    mood: 'happy',
    setting: 'forest',
    theme: '友情,勇气',
    additionalElements: '魔法棒',
    streamingMode: true
  };

  try {
    const story = await generator.generateStory(prompt);
    console.log('故事创建成功:', story.title);
  } catch (error) {
    console.error('测试失败:', error.message);
  }
}

// testStreamingGeneration();
console.log('流式生成测试脚本已创建');
