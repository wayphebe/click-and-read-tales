
import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Star, Trophy, Gift } from 'lucide-react';

interface RewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  rewardType?: 'star' | 'trophy' | 'gift';
  isFinalReward?: boolean;
}

const RewardModal: React.FC<RewardModalProps> = ({
  isOpen,
  onClose,
  message,
  rewardType,
  isFinalReward = false,
}) => {
  const getRewardIcon = () => {
    if (isFinalReward) {
      return <Trophy className="w-24 h-24 text-yellow-400 animate-bounce" />;
    }
    switch (rewardType) {
      case 'star':
        return <Star className="w-20 h-20 text-yellow-400 fill-current animate-pulse" />;
      case 'trophy':
        return <Trophy className="w-20 h-20 text-yellow-400 animate-bounce" />;
      case 'gift':
        return <Gift className="w-20 h-20 text-purple-400 animate-pulse" />;
      default:
        return <Star className="w-20 h-20 text-yellow-400 fill-current animate-pulse" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto bg-gradient-reward border-none rounded-reward shadow-reward overflow-hidden p-0">
        <div className="relative">

          {/* 主要内容 */}
          <div className="relative text-center px-8 py-10">
            <div className="transform hover:scale-110 transition-transform duration-300">
              {getRewardIcon()}
            </div>
            
            <DialogTitle className="mt-6 text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              {isFinalReward ? '🎉 太棒了！' : '✨ 太棒了！'}
            </DialogTitle>
            
            <DialogDescription className="mt-4 text-lg text-gray-700 font-semibold">
              {message}
            </DialogDescription>
            
            <button
              onClick={onClose}
              className="mt-8 px-10 py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-lg font-bold rounded-full 
                transform hover:scale-105 transition-all duration-300 hover:shadow-xl
                focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 active:scale-95"
            >
              {isFinalReward ? '返回首页' : '继续探索'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RewardModal;
