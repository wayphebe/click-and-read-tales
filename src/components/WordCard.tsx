import React, { useState, useEffect } from 'react';
import { X, Volume2, Loader2 } from 'lucide-react';

interface WordCardProps {
  vocabulary: {
    chinese: string;
    english: string;
    phonetic?: string;
    example?: string;
    exampleChinese?: string;
    category?: string;
  };
  onClose: () => void;
  position: { x: number; y: number };
}

const WordCard: React.FC<WordCardProps> = ({ vocabulary, onClose, position }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  // 播放发音（使用 Web Speech API）
  const playPronunciation = () => {
    if ('speechSynthesis' in window) {
      // 停止之前的发音
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(vocabulary.english);
      utterance.lang = 'en-US';
      utterance.rate = 0.8; // 稍慢一点，适合儿童
      utterance.pitch = 1.2; // 稍微提高音调，更友好
      setIsPlaying(true);
      
      utterance.onend = () => {
        setIsPlaying(false);
      };
      
      utterance.onerror = () => {
        setIsPlaying(false);
      };
      
      speechSynthesis.speak(utterance);
    } else {
      // 如果不支持 Web Speech API，显示提示
      alert('您的浏览器不支持语音播放功能');
    }
  };

  // 组件卸载时停止发音
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div
      className="fixed z-50 transform -translate-x-1/2 -translate-y-1/2 animate-in fade-in zoom-in duration-300"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-pink-200 p-6 min-w-64 max-w-80 relative">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="关闭"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 英文单词（大号） */}
        <div className="text-center mb-4">
          <h3 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
            {vocabulary.english}
          </h3>
          
          {/* 音标 */}
          {vocabulary.phonetic && (
            <p className="text-lg text-gray-500 mb-2">/{vocabulary.phonetic}/</p>
          )}
          
          {/* 中文释义 */}
          <p className="text-2xl font-semibold text-gray-800">{vocabulary.chinese}</p>
          
          {/* 词性标签 */}
          {vocabulary.category && (
            <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full font-medium">
              {vocabulary.category}
            </span>
          )}
        </div>

        {/* 发音按钮 */}
        <button
          onClick={playPronunciation}
          disabled={isPlaying}
          className="w-full mb-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-bold hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isPlaying ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              正在播放...
            </>
          ) : (
            <>
              <Volume2 className="w-5 h-5" />
              听发音 🔊
            </>
          )}
        </button>

        {/* 例句 */}
        {vocabulary.example && (
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
            <p className="text-sm text-gray-600 mb-1 font-medium">例句：</p>
            <p className="text-base font-medium text-gray-800 mb-1">{vocabulary.example}</p>
            {vocabulary.exampleChinese && (
              <p className="text-sm text-gray-600">{vocabulary.exampleChinese}</p>
            )}
          </div>
        )}

        {/* 鼓励文字 */}
        <p className="text-center mt-4 text-sm text-pink-600 font-semibold">
          ✨ 太棒了！你学会了这个单词！
        </p>
      </div>
      
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 bg-black/20 z-[-1]"
        onClick={onClose}
      />
    </div>
  );
};

export default WordCard;

