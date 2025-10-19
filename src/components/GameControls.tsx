import React, { useState } from 'react';
import { useGameStore } from '../stores/gameStore';

interface GameControlsProps {
  onStartGame: () => void;
  onResetGame: () => void;
}

export const GameControls: React.FC<GameControlsProps> = ({ onStartGame, onResetGame }) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [wasPlayingBeforeConfirm, setWasPlayingBeforeConfirm] = useState(false);
  
  const {
    isPlaying,
    isPaused,
    gameSpeed,
    pauseGame,
    resumeGame,
    setGameSpeed,
    nextKLine,
    isGameOver
  } = useGameStore();

  const speedOptions = [1, 2, 4];

  const handleSpeedChange = () => {
    const currentIndex = speedOptions.indexOf(gameSpeed);
    const nextIndex = (currentIndex + 1) % speedOptions.length;
    setGameSpeed(speedOptions[nextIndex]);
  };

  const handleResetClick = () => {
    // 记录当前游戏状态
    setWasPlayingBeforeConfirm(isPlaying && !isPaused);
    
    // 如果游戏正在进行且未暂停，先暂停游戏
    if (isPlaying && !isPaused) {
      pauseGame();
    }
    setShowResetConfirm(true);
  };

  const handleConfirmReset = () => {
    setShowResetConfirm(false);
    setWasPlayingBeforeConfirm(false);
    onResetGame();
    // 重置后直接开始新游戏
    setTimeout(() => {
      onStartGame();
    }, 100);
  };

  const handleCancelReset = () => {
    setShowResetConfirm(false);
    // 如果之前游戏在进行中，恢复游戏
    if (wasPlayingBeforeConfirm) {
      resumeGame();
    }
    setWasPlayingBeforeConfirm(false);
  };

  return (
    <div className="card">
      {/* 游戏控制按钮 */}
      <div className="flex items-center justify-center gap-0.5 sm:gap-2 py-2">
        {isPlaying && !isGameOver() && (
          <>
            <button
              onClick={isPaused ? resumeGame : pauseGame}
              className="btn-secondary py-1.5 px-1.5 sm:py-2 sm:px-3 text-xs sm:text-sm whitespace-nowrap flex-shrink-0"
              title="空格键: 暂停/继续游戏"
            >
              {isPaused ? '继续' : '暂停'}
            </button>
            
            {isPaused && (
              <button
                onClick={nextKLine}
                className="btn-primary py-1.5 px-1.5 sm:py-2 sm:px-3 text-xs sm:text-sm whitespace-nowrap flex-shrink-0"
                title="→键: 推进一根K线"
              >
                下一日
              </button>
            )}
            
            <button
              onClick={handleSpeedChange}
              className="btn-secondary py-1.5 px-1.5 sm:py-2 sm:px-3 text-xs sm:text-sm whitespace-nowrap flex-shrink-0"
              title="1/2/3键: 调整游戏速度"
            >
              {gameSpeed}x
            </button>
          </>
        )}
        
        {!isPlaying && (
          <button
            onClick={onStartGame}
            className="btn-primary py-1.5 px-3 sm:py-2 sm:px-5 text-xs sm:text-sm whitespace-nowrap flex-shrink-0"
          >
            开始游戏
          </button>
        )}
        
        {isPlaying && (
          <button
            onClick={handleResetClick}
            className="btn-secondary py-1.5 px-1.5 sm:py-2 sm:px-3 text-xs sm:text-sm whitespace-nowrap flex-shrink-0"
          >
            重新开始
          </button>
        )}
      </div>
      
      {/* 重新开始确认对话框 */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-sm mx-4 border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-3">确认重新开始</h3>
            <p className="text-gray-300 mb-6">
              确定要重新开始游戏吗？当前的游戏进度将会丢失。
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleCancelReset}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmReset}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                确认重置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
