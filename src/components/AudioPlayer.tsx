
import React, { useState } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

interface AudioPlayerProps {
  isPlaying?: boolean;
  onTogglePlay: () => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  isPlaying = false,
  onTogglePlay,
}) => {
  return (
    <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
      <button
        onClick={onTogglePlay}
        className="p-2 bg-gradient-to-r from-blue-400 to-purple-400 text-white rounded-full hover:from-blue-500 hover:to-purple-500 transition-all duration-200"
      >
        {isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4" />
        )}
      </button>
      
      <Volume2 className="w-4 h-4 text-gray-600" />
      
      <div className="text-sm text-gray-600 font-medium">
        {isPlaying ? '播放中...' : '点击播放'}
      </div>
    </div>
  );
};

export default AudioPlayer;
