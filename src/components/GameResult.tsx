import React from 'react';
import { useGameStore } from '../stores/gameStore';

export const GameResult: React.FC = () => {
  const { gameResult, resetGame } = useGameStore();

  if (!gameResult) return null;

  const getScoreLevel = (score: number) => {
    if (score >= 90) return { text: '交易大师', color: 'text-yellow-400' };
    if (score >= 70) return { text: '高手', color: 'text-purple-400' };
    if (score >= 50) return { text: '良好', color: 'text-blue-400' };
    if (score >= 30) return { text: '及格', color: 'text-green-400' };
    return { text: '需要练习', color: 'text-gray-400' };
  };

  const getReturnLevel = (returnRate: number) => {
    if (returnRate >= 20) return { text: '优秀', color: 'text-yellow-400' };
    if (returnRate >= 10) return { text: '良好', color: 'text-green-400' };
    if (returnRate >= 0) return { text: '盈利', color: 'text-blue-400' };
    if (returnRate >= -10) return { text: '小幅亏损', color: 'text-orange-400' };
    return { text: '需要改进', color: 'text-red-400' };
  };

  const scoreLevel = getScoreLevel(gameResult.score);
  const returnLevel = getReturnLevel(gameResult.returnRate);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">游戏结束</h2>
        
        {/* 总评分 */}
        <div className="text-center mb-6">
          <div className="text-4xl font-bold text-yellow-400 mb-2">
            {gameResult.score}
          </div>
          <div className={`text-lg font-medium ${scoreLevel.color}`}>
            {scoreLevel.text}
          </div>
        </div>

        {/* 主要指标 */}
        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
            <span className="text-gray-400">最终资产</span>
            <span className="text-xl font-bold text-white">
              ¥{gameResult.finalBalance.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
            <span className="text-gray-400">总收益</span>
            <div className="text-right">
              <div className={`font-semibold ${gameResult.totalReturn >= 0 ? 'price-up' : 'price-down'}`}>
                {gameResult.totalReturn >= 0 ? '+' : ''}¥{gameResult.totalReturn.toFixed(2)}
              </div>
              <div className={`text-sm ${gameResult.returnRate >= 0 ? 'price-up' : 'price-down'}`}>
                ({gameResult.returnRate >= 0 ? '+' : ''}{gameResult.returnRate.toFixed(2)}%)
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
            <span className="text-gray-400">收益评级</span>
            <span className={`font-medium ${returnLevel.color}`}>
              {returnLevel.text}
            </span>
          </div>
        </div>

        {/* 详细统计 */}
        <div className="space-y-3 mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">详细统计</h3>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">交易次数</span>
            <span className="text-white">{gameResult.tradeCount} 次</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">胜率</span>
            <span className="text-white">{gameResult.winRate.toFixed(1)}%</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">最大回撤</span>
            <span className="text-red-400">{gameResult.maxDrawdown.toFixed(2)}%</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">游戏时长</span>
            <span className="text-white">{gameResult.duration} 根K线</span>
          </div>
        </div>

        {/* 评分说明 */}
        <div className="bg-gray-700 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-semibold text-white mb-2">评分说明</h4>
          <div className="text-xs text-gray-300 space-y-1">
            <div>• 基础分：收益率 × 10</div>
            <div>• 风险惩罚：最大回撤 × 10</div>
            <div>• 操作奖励：胜率 × 2</div>
            <div>• 满分100分，90分以上为交易大师</div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex space-x-3">
          <button
            onClick={resetGame}
            className="flex-1 btn-primary"
          >
            再来一局
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex-1 btn-secondary"
          >
            返回主页
          </button>
        </div>

        {/* 分享功能提示 */}
        <div className="mt-4 text-center text-xs text-gray-400">
          截图分享你的交易成绩！
        </div>
      </div>
    </div>
  );
};
