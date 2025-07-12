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
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="mainCharacter">主角名字</Label>
                <Input
                  id="mainCharacter"
                  value={mainCharacter}
                  onChange={(e) => setMainCharacter(e.target.value)}
                  placeholder="例如：小兔子、勇敢的小男孩..."
                  required
                />
              </div>

              <div>
                <Label htmlFor="mood">故事情绪</Label>
                <Select value={mood} onValueChange={setMood} required>
                  <SelectTrigger>
                    <SelectValue placeholder="选择故事的主要情绪" />
                  </SelectTrigger>
                  <SelectContent>
                    {moods.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="setting">故事场景</Label>
                <Select value={setting} onValueChange={setSetting} required>
                  <SelectTrigger>
                    <SelectValue placeholder="选择故事发生的地点" />
                  </SelectTrigger>
                  <SelectContent>
                    {settings.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>故事主题（最多选择3个）</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {themes.map((theme) => (
                    <Button
                      key={theme}
                      type="button"
                      variant={selectedThemes.includes(theme) ? "default" : "outline"}
                      onClick={() => handleThemeToggle(theme)}
                      className="h-auto py-2"
                    >
                      {theme}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="additionalElements">特别元素</Label>
                <div className="mt-1">
                  <Textarea
                    id="additionalElements"
                    value={additionalElements}
                    onChange={(e) => setAdditionalElements(e.target.value)}
                    placeholder="添加一些特别的元素到故事中，例如：一只会说话的黑猫、一把魔法雨伞、一颗会发光的石头..."
                    className="h-20"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    添加一些特别的元素可以让故事更加有趣！可以是物品、动物、或任何你想加入的神奇元素。
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isGenerating}>
                开始创作故事
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StoryGeneratorDialog; 