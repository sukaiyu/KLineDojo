import React from 'react';
import { useGameStore } from '../stores/gameStore';

export const AccountInfo: React.FC = () => {
  const {
    isPlaying,
    initialBalance,
    currentBalance,
    position,
    positionCost,
    getTotalAssets,
    getUnrealizedPnL,
    getUnrealizedPnLPercent,
    getCurrentPrice,
    trades,
    orders,
    getAvailableBalance,
    getFrozenBalance,
    getTotalFrozenPosition
  } = useGameStore();

  const currentPrice = getCurrentPrice();
  const totalAssets = getTotalAssets();
  const unrealizedPnL = getUnrealizedPnL();
  const unrealizedPnLPercent = getUnrealizedPnLPercent();
  const totalReturn = totalAssets - initialBalance;
  const totalReturnPercent = (totalReturn / initialBalance) * 100;

  const positionValue = position * currentPrice;
  const avgCost = position > 0 ? positionCost / position : 0;
  
  // 计算可用余额和冻结资金
  const availableBalance = getAvailableBalance();
  const frozenBalance = getFrozenBalance();
  const frozenPosition = getTotalFrozenPosition();
  const availablePosition = position - frozenPosition;
  
  // 计算总手续费
  const totalFees = trades.reduce((sum, trade) => sum + (trade.fees || 0), 0);

  return (
    <div className="card">
      <h3 className="text-lg font-bold text-white mb-4">账户信息</h3>
      
      <div className="space-y-4">
        {/* 总资产 */}
        <div className="flex justify-between items-center">
          <span className="text-gray-400">总资产</span>
          <span className="text-xl font-bold text-white">
            ¥{totalAssets.toFixed(2)}
          </span>
        </div>

        {/* 总收益 */}
        <div className="flex justify-between items-center">
          <span className="text-gray-400">总收益</span>
          <div className="text-right">
            <div className={`font-semibold ${totalReturn >= 0 ? 'price-up' : 'price-down'}`}>
              {totalReturn >= 0 ? '+' : ''}¥{totalReturn.toFixed(2)}
            </div>
            <div className={`text-sm ${totalReturn >= 0 ? 'price-up' : 'price-down'}`}>
              ({totalReturnPercent >= 0 ? '+' : ''}{totalReturnPercent.toFixed(2)}%)
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-4 space-y-3">
          {/* 可用余额 */}
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">可用余额</span>
            <span className="text-green-400 font-semibold">
              ¥{availableBalance.toFixed(2)}
            </span>
          </div>

          {/* 冻结资金 */}
          {frozenBalance > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">冻结资金</span>
              <span className="text-orange-400">
                ¥{frozenBalance.toFixed(2)}
              </span>
            </div>
          )}

          {/* 总现金 */}
          <div className="flex justify-between items-center border-t border-gray-600 pt-2">
            <span className="text-gray-400 text-sm">总现金</span>
            <span className="text-white">
              ¥{currentBalance.toFixed(2)}
            </span>
          </div>

          {/* 持仓信息 */}
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">总持仓</span>
            <span className="text-white">
              {position.toLocaleString()} 股
            </span>
          </div>

          {/* 可用持仓 */}
          {availablePosition < position && (
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">可用持仓</span>
              <span className="text-green-400">
                {availablePosition.toLocaleString()} 股
              </span>
            </div>
          )}

          {/* 冻结持仓 */}
          {frozenPosition > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">冻结持仓</span>
              <span className="text-orange-400">
                {frozenPosition.toLocaleString()} 股
              </span>
            </div>
          )}

          {/* 持仓价值 */}
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">持仓价值</span>
            <span className="text-white">
              ¥{positionValue.toFixed(2)}
            </span>
          </div>

          {/* 持仓成本 */}
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">持仓成本</span>
            <span className="text-white">
              ¥{positionCost.toFixed(2)}
            </span>
          </div>

          {/* 平均成本 */}
          {position > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">平均成本</span>
              <span className="text-white">
                ¥{avgCost.toFixed(3)}
              </span>
            </div>
          )}

          {/* 浮动盈亏 */}
          {position > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">浮动盈亏</span>
              <div className="text-right">
                <div className={`font-semibold ${unrealizedPnL >= 0 ? 'price-up' : 'price-down'}`}>
                  {unrealizedPnL >= 0 ? '+' : ''}¥{unrealizedPnL.toFixed(2)}
                </div>
                <div className={`text-sm ${unrealizedPnL >= 0 ? 'price-up' : 'price-down'}`}>
                  ({unrealizedPnLPercent >= 0 ? '+' : ''}{unrealizedPnLPercent.toFixed(2)}%)
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 交易统计 */}
        <div className="border-t border-gray-700 pt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-sm">交易次数</span>
            <span className="text-white">
              {trades.length} 次
            </span>
          </div>
          
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-sm">委托单数</span>
            <span className="text-white">
              {orders.length} 单
            </span>
          </div>
          
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-sm">待成交</span>
            <span className="text-yellow-400">
              {orders.filter(o => o.status === 'pending').length} 单
            </span>
          </div>
          
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-sm">累计手续费</span>
            <span className="text-orange-400">
              ¥{totalFees.toFixed(2)}
            </span>
          </div>
          
          {trades.length > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">最近交易</span>
              <span className="text-white text-sm">
                {trades[trades.length - 1].type === 'buy' ? '买入' : '卖出'}
                {' '}{trades[trades.length - 1].quantity}股
                {trades[trades.length - 1].fees && (
                  <span className="text-orange-400 ml-1">
                    (费¥{trades[trades.length - 1].fees?.toFixed(2)})
                  </span>
                )}
              </span>
            </div>
          )}
        </div>

        {/* 收益率指示器 */}
        {isPlaying && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-400 mb-1">
              <span>收益率</span>
              <span className={totalReturnPercent >= 0 ? 'price-up' : 'price-down'}>
                {totalReturnPercent >= 0 ? '+' : ''}{totalReturnPercent.toFixed(2)}%
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  totalReturnPercent >= 0 ? 'bg-red-500' : 'bg-green-500'
                }`}
                style={{
                  width: `${Math.min(Math.max(totalReturnPercent + 50, 0), 100)}%`
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>-50%</span>
              <span>0%</span>
              <span>+50%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
