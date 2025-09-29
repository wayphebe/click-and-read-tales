import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

export interface StoryPrompt {
  mainCharacter: string;
  mood: string;
  setting?: string;
  theme?: string;
  additionalElements?: string;
  streamingMode?: boolean; // 新增流式模式选项
}

interface GenerationProgress {
  step: string;
  progress: number;
  currentPage?: number;
  totalPages?: number;
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
  const formId = React.useId();
  const [mainCharacter, setMainCharacter] = useState('');
  const [mood, setMood] = useState('');
  const [setting, setSetting] = useState('');
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [additionalElements, setAdditionalElements] = useState('');
  const [streamingMode, setStreamingMode] = useState(true); // 默认开启流式模式

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
      streamingMode,
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
                  <div className="mt-2 text-sm text-gray-500">
                    {generationProgress.currentPage && generationProgress.totalPages
                      ? `第 ${generationProgress.currentPage} / ${generationProgress.totalPages} 页`
                      : `${generationProgress.progress}%`}
                  </div>
                </div>
              )}
              <p className="text-sm text-gray-500">
                {streamingMode 
                  ? '故事内容已准备好，插图正在后台生成...'
                  : '请稍候，我们正在为你创作一个精彩的故事...'
                }
              </p>
            </div>
          </div>
        ) : (
          <form id={formId} onSubmit={handleSubmit} className="space-y-6">
            {/* 生成模式选择 */}
            <div className="space-y-3">
              <Label className="text-base font-medium">生成模式</Label>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Switch
                  id="streaming-mode"
                  checked={streamingMode}
                  onCheckedChange={setStreamingMode}
                />
                <div className="flex-1">
                  <Label htmlFor="streaming-mode" className="text-sm font-medium">
                    {streamingMode ? '快速模式' : '完整模式'}
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    {streamingMode 
                      ? '立即开始阅读，插图在后台生成'
                      : '等待所有内容生成完成后开始阅读'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* 主角 */}
            <div className="space-y-2">
              <Label htmlFor="mainCharacter">故事主角</Label>
              <Input
                id="mainCharacter"
                placeholder="比如：小兔子、小熊、小公主..."
                value={mainCharacter}
                onChange={(e) => setMainCharacter(e.target.value)}
                required
              />
            </div>

            {/* 心情 */}
            <div className="space-y-2">
              <Label htmlFor="mood">主角的心情</Label>
              <Select value={mood} onValueChange={setMood} required>
                <SelectTrigger>
                  <SelectValue placeholder="选择主角的心情" />
                </SelectTrigger>
                <SelectContent>
                  {moods.map((mood) => (
                    <SelectItem key={mood.value} value={mood.value}>
                      {mood.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 场景 */}
            <div className="space-y-2">
              <Label htmlFor="setting">故事场景</Label>
              <Select value={setting} onValueChange={setSetting} required>
                <SelectTrigger>
                  <SelectValue placeholder="选择故事发生的场景" />
                </SelectTrigger>
                <SelectContent>
                  {settings.map((setting) => (
                    <SelectItem key={setting.value} value={setting.value}>
                      {setting.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 主题 */}
            <div className="space-y-2">
              <Label>故事主题（最多选择3个）</Label>
              <div className="flex flex-wrap gap-2">
                {themes.map((theme) => (
                  <Badge
                    key={theme}
                    variant={selectedThemes.includes(theme) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => handleThemeToggle(theme)}
                  >
                    {theme}
                  </Badge>
                ))}
              </div>
            </div>

            {/* 额外元素 */}
            <div className="space-y-2">
              <Label htmlFor="additionalElements">额外元素（可选）</Label>
              <Textarea
                id="additionalElements"
                placeholder="比如：魔法棒、会说话的树、彩虹桥..."
                value={additionalElements}
                onChange={(e) => setAdditionalElements(e.target.value)}
                rows={3}
              />
            </div>
          </form>
        )}

        <DialogFooter>
          {!isGenerating && (
            <>
              <Button variant="outline" onClick={onClose}>
                取消
              </Button>
              <Button form={formId} type="submit">
                开始创作
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StoryGeneratorDialog;
