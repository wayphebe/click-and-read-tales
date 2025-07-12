
import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Star, Trophy, Gift } from 'lucide-react';

interface RewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  rewardType: 'star' | 'trophy' | 'gift';
  message: string;
}

const RewardModal: React.FC<RewardModalProps> = ({
  isOpen,
  onClose,
  rewardType,
  message,
}) => {
  const getRewardIcon = () => {
    switch (rewardType) {
      case 'star':
        return <Star className="w-20 h-20 text-yellow-400 fill-current animate-pulse-soft" />;
      case 'trophy':
        return <Trophy className="w-20 h-20 text-yellow-400 animate-bounce-gentle" />;
      case 'gift':
        return <Gift className="w-20 h-20 text-purple-400 animate-wiggle" />;
      default:
        return <Star className="w-20 h-20 text-yellow-400 fill-current animate-pulse-soft" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto bg-gradient-reward border-none rounded-reward shadow-reward overflow-hidden p-0">
        <div className="relative">
          {/* 装饰性背景元素 */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-yellow-100 rounded-full opacity-20 animate-pulse-soft" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-100 rounded-full opacity-20 animate-pulse-soft" />
          </div>

          {/* 主要内容 */}
          <div className="relative text-center px-8 py-10">
            <div className="transform hover:scale-110 transition-transform duration-300">
              {getRewardIcon()}
            </div>
            
            <DialogTitle className="mt-6 text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-magical">
              太棒了！
            </DialogTitle>
            
            <DialogDescription className="mt-4 text-lg text-gray-600 font-magical">
              {message}
            </DialogDescription>
            
            <button
              onClick={onClose}
              className="mt-8 px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-full 
                transform hover:scale-105 transition-all duration-300 hover:shadow-[0_4px_16px_rgba(79,70,229,0.4)]
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 font-magical"
            >
              继续探索
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RewardModal;
