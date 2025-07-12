import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

export interface StoryPrompt {
  mainCharacter: string;
  mood: string;
  setting?: string;
  theme?: string;
  additionalElements?: string;
}

interface GenerationProgress {
  step: string;
  progress: number;
}

interface StoryGeneratorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (prompt: StoryPrompt) => void;
  isGenerating: boolean;
  generationProgress?: GenerationProgress;
}

const moods = [
  { value: 'happy', label: '开心' },
  { value: 'sad', label: '难过' },
  { value: 'excited', label: '兴奋' },
  { value: 'worried', label: '担心' },
  { value: 'angry', label: '生气' },
  { value: 'peaceful', label: '平静' },
];

const themes = [
  '友情', '勇气', '分享', '诚实', '创造力',
  '家庭', '冒险', '自信', '责任', '爱护环境'
];

const settings = [
  { value: 'home', label: '家里' },
  { value: 'school', label: '学校' },
  { value: 'forest', label: '森林' },
  { value: 'park', label: '公园' },
  { value: 'beach', label: '海边' },
  { value: 'space', label: '太空' },
];

const StoryGeneratorDialog: React.FC<StoryGeneratorDialogProps> = ({
  isOpen,
  onClose,
  onGenerate,
  isGenerating,
  generationProgress,
}) => {
  const [mainCharacter, setMainCharacter] = useState('');
  const [mood, setMood] = useState('');
  const [setting, setSetting] = useState('');
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [additionalElements, setAdditionalElements] = useState('');

  const handleThemeToggle = (theme: string) => {
    setSelectedThemes(prev =>
      prev.includes(theme)
        ? prev.filter(t => t !== theme)
        : [...prev, theme].slice(0, 3)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate({
      mainCharacter,
      mood,
      setting,
      theme: selectedThemes.join(','),
      additionalElements,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={isGenerating ? undefined : onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>创建你的专属故事</DialogTitle>
          <DialogDescription>
            告诉我一些关键信息，让我为你创作一个独特的故事！
          </DialogDescription>
        </DialogHeader>

        {isGenerating ? (
          <div className="py-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="text-lg font-medium">
                {generationProgress?.step || '正在创作故事...'}
              </div>
              {generationProgress && (
                <div className="w-full max-w-xs">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${generationProgress.progress}%` }}
                    />
                  </div>
                </div>
              )}
              <p className="text-sm text-gray-500">
                请稍候，我们正在为你创作一个精彩的故事...
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            {/* 主角输入 */}
            <div className="space-y-2">
              <Label htmlFor="mainCharacter">谁是故事的主角？</Label>
              <Input
                id="mainCharacter"
                placeholder="例如：小兔子、小女孩、勇敢的小狮子..."
                value={mainCharacter}
                onChange={(e) => setMainCharacter(e.target.value)}
                required
              />
            </div>

            {/* 心情选择 */}
            <div className="space-y-2">
              <Label htmlFor="mood">主角现在的心情是？</Label>
              <Select value={mood} onValueChange={setMood} required>
                <SelectTrigger>
                  <SelectValue placeholder="选择一个心情..." />
                </SelectTrigger>
                <SelectContent>
                  {moods.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 场景选择 */}
            <div className="space-y-2">
              <Label htmlFor="setting">故事发生在哪里？</Label>
              <Select value={setting} onValueChange={setSetting}>
                <SelectTrigger>
                  <SelectValue placeholder="选择一个场景..." />
                </SelectTrigger>
                <SelectContent>
                  {settings.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 主题标签 */}
            <div className="space-y-2">
              <Label>选择故事主题（最多3个）</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {themes.map(theme => (
                  <Badge
                    key={theme}
                    variant={selectedThemes.includes(theme) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleThemeToggle(theme)}
                  >
                    {theme}
                  </Badge>
                ))}
              </div>
            </div>

            {/* 额外元素 */}
            <div className="space-y-2">
              <Label htmlFor="additionalElements">还想加入什么元素？</Label>
              <Textarea
                id="additionalElements"
                placeholder="可以描述一些具体情节或者想要表达的内容..."
                value={additionalElements}
                onChange={(e) => setAdditionalElements(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            {/* 提交按钮 */}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                取消
              </Button>
              <Button type="submit">
                开始创作
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StoryGeneratorDialog; 