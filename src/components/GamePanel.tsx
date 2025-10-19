import React, { useState } from 'react';
import { useGameStore } from '../stores/gameStore';

interface GamePanelProps {
  onStartGame: () => void;
  onResetGame: () => void;
}

export const GamePanel: React.FC<GamePanelProps> = ({ onStartGame, onResetGame }) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [wasPlayingBeforeConfirm, setWasPlayingBeforeConfirm] = useState(false);
  
  const {
    isPlaying,
    isPaused,
    gameSpeed,
    gameProgress,
    remainingTime,
    currentETF,
    // pauseGame,
    resumeGame,
    // setGameSpeed,
    // nextKLine,
    isGameOver
  } = useGameStore();

  // const speedOptions = [1, 2, 4];

  // const handleSpeedChange = () => {
  //   const currentIndex = speedOptions.indexOf(gameSpeed);
  //   const nextIndex = (currentIndex + 1) % speedOptions.length;
  //   setGameSpeed(speedOptions[nextIndex]);
  // };

  const formatRemainingTime = () => {
    if (!isPlaying) return '0天';
    const days = remainingTime; // 现在是日K线，剩余时间就是天数
    return `${days}天`;
  };

  // const handleResetClick = () => {
  //   // 记录当前游戏状态
  //   setWasPlayingBeforeConfirm(isPlaying && !isPaused);
    
  //   // 如果游戏正在进行且未暂停，先暂停游戏
  //   if (isPlaying && !isPaused) {
  //     pauseGame();
  //   }
  //   setShowResetConfirm(true);
  // };

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
      {/* 游戏头部信息 */}
      <div className="flex flex-wrap items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white">
            {currentETF ? `${currentETF.name} (${currentETF.code})` : 'K线交易游戏'}
          </h2>
          {isPlaying && (
            <div className="text-sm text-gray-400 mt-1">
              游戏进度: {gameProgress.toFixed(1)}% | 剩余时间: {formatRemainingTime()}
            </div>
          )}
        </div>
        
      </div>

      {/* 进度条 */}
      {isPlaying && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-400 mb-1">
            <span>游戏进度</span>
            <span>{gameProgress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${gameProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* 游戏状态指示器 */}
      <div className="flex items-center justify-center space-x-4 text-sm">
        {isPlaying && (
          <>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-green-500'} ${!isPaused ? 'animate-pulse' : ''}`} />
              <span className="text-gray-300">
                {isPaused ? '已暂停' : '进行中'}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">速度:</span>
              <span className="text-white font-medium">{gameSpeed}x</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">剩余:</span>
              <span className="text-white font-medium">{formatRemainingTime()}</span>
            </div>
          </>
        )}
        
        {!isPlaying && !currentETF && (
          <div className="text-gray-400">
            点击"开始游戏"开始K线交易挑战
          </div>
        )}
        
        {isGameOver() && (
          <div className="text-red-400 font-medium">
            游戏结束！
          </div>
        )}
      </div>

      {/* 游戏说明 */}
      {!isPlaying && (
        <div className="mt-4 p-3 bg-gray-700 rounded-lg text-sm text-gray-300">
          <div className="font-medium mb-2">游戏规则：</div>
          <ul className="space-y-1 text-xs">
            <li>• 随机选择A股和开始时间，游戏时长1年（252个交易日）</li>
            <li>• 根据日K线走势预测价格，进行买卖操作</li>
            <li>• 初始资金10万元，争取获得最高收益</li>
            <li>• 可暂停游戏，调整播放速度</li>
            <li>• 暂停时可点击"下一日"手动推进K线</li>
            <li>• 游戏结束后查看最终成绩和评分</li>
          </ul>
        </div>
      )}
      
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
