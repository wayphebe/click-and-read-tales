import React from 'react';
import { Play, Pause } from 'lucide-react';

interface AudioPlayerProps {
  isPlaying?: boolean;
  onTogglePlay: () => void;
  storyTitle?: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  isPlaying = false,
  onTogglePlay,
}) => {
  return (
    <div className="fixed bottom-24 right-6 z-30">
      <button
        onClick={onTogglePlay}
        className="flex items-center gap-3 bg-white/95 backdrop-blur-sm rounded-full px-6 py-4 shadow-xl hover:shadow-2xl border-2 border-pink-200 hover:border-pink-300 transition-all duration-300 transform hover:scale-105 active:scale-95"
        aria-label={isPlaying ? '暂停播放' : '播放故事'}
      >
        <div className="p-3 bg-gradient-to-r from-blue-400 to-purple-400 text-white rounded-full hover:from-blue-500 hover:to-purple-500 transition-all duration-200 shadow-lg">
          {isPlaying ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6" />
          )}
        </div>
        <div className="text-base font-semibold text-gray-700">
          {isPlaying ? '播放中' : '点击播放'}
        </div>
      </button>
    </div>
  );
};

export default AudioPlayer;
