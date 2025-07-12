
import React from 'react';
import { Trophy, Star, Gift } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

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
        return <Star className="w-16 h-16 text-yellow-400 fill-current" />;
      case 'trophy':
        return <Trophy className="w-16 h-16 text-orange-400" />;
      case 'gift':
        return <Gift className="w-16 h-16 text-purple-400" />;
      default:
        return <Star className="w-16 h-16 text-yellow-400 fill-current" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto bg-gradient-to-b from-yellow-50 to-orange-50 border-none">
        <div className="text-center p-6">
          <div className="flex justify-center mb-4 animate-bounce">
            {getRewardIcon()}
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            太棒了！
          </h2>
          
          <p className="text-lg text-gray-600 mb-6">
            {message}
          </p>
          
          <button
            onClick={onClose}
            className="bg-gradient-to-r from-green-400 to-blue-400 text-white font-bold py-3 px-8 rounded-2xl hover:from-green-500 hover:to-blue-500 transition-all duration-200 shadow-lg"
          >
            继续探索
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RewardModal;
