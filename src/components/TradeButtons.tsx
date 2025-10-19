import React, { useState } from 'react';
import { useGameStore } from '../stores/gameStore';

interface TradeButtonsProps {
  onShowMessage?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const TradeButtons: React.FC<TradeButtonsProps> = ({ onShowMessage }) => {
  const {
    isPlaying,
    isPaused,
    currentBalance,
    position,
    getCurrentPrice,
    placeOrder,
    pauseGame,
    resumeGame,
    getTotalFrozenPosition
  } = useGameStore();

  const [showBuyDialog, setShowBuyDialog] = useState(false);
  const [showSellDialog, setShowSellDialog] = useState(false);
  const [buyQuantity, setBuyQuantity] = useState('');
  const [sellQuantity, setSellQuantity] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [wasPlayingBeforeDialog, setWasPlayingBeforeDialog] = useState(false);

  const currentPrice = getCurrentPrice();
  
  // 计算最大可买数量（考虑手续费）
  const calculateMaxBuyQuantity = (price: number) => {
    if (price <= 0) return 0;
    
    let maxQuantity = 0;
    // 从理论最大值开始向下查找
    const theoreticalMax = Math.floor(currentBalance / price);
    
    for (let quantity = theoreticalMax; quantity >= 0; quantity--) {
      const estimatedCost = price * quantity;
      const commission = Math.max(estimatedCost * 0.0003, 5);
      const transferFee = Math.max(estimatedCost * 0.00001, 1);
      const totalCost = estimatedCost + commission + transferFee;
      
      if (totalCost <= currentBalance) {
        maxQuantity = quantity;
        break;
      }
    }
    
    return maxQuantity;
  };
  
  const maxBuyQuantity = calculateMaxBuyQuantity(currentPrice);
  const frozenPosition = getTotalFrozenPosition();
  const maxSellQuantity = position - frozenPosition;

  const handleBuy = () => {
    console.log('开始买入操作');
    const quantity = parseInt(buyQuantity);
    const price = parseFloat(buyPrice);
    
    if (isNaN(quantity) || quantity <= 0) {
      onShowMessage?.('请输入有效的买入数量', 'error');
      return;
    }

    if (isNaN(price) || price <= 0) {
      onShowMessage?.('请输入有效的委托价格', 'error');
      return;
    }

    if (quantity > maxBuyQuantity) {
      onShowMessage?.('资金不足', 'error');
      return;
    }

    console.log('下买入委托单:', { price, quantity });
    const orderId = placeOrder('buy', price, quantity);
    if (orderId) {
      onShowMessage?.(`买入委托单已提交，价格: ¥${price.toFixed(3)}`, 'success');
      setShowBuyDialog(false);
      setBuyQuantity('');
      setBuyPrice('');
      
      // 恢复原来的游戏状态
      if (wasPlayingBeforeDialog) {
        resumeGame();
      }
    } else {
      onShowMessage?.('委托下单失败', 'error');
    }
  };

  const handleSell = () => {
    console.log('开始卖出操作');
    const quantity = parseInt(sellQuantity);
    const price = parseFloat(sellPrice);
    
    if (isNaN(quantity) || quantity <= 0) {
      onShowMessage?.('请输入有效的卖出数量', 'error');
      return;
    }

    if (isNaN(price) || price <= 0) {
      onShowMessage?.('请输入有效的委托价格', 'error');
      return;
    }

    if (quantity > maxSellQuantity) {
      onShowMessage?.('持仓不足', 'error');
      return;
    }

    console.log('下卖出委托单:', { price, quantity });
    const orderId = placeOrder('sell', price, quantity);
    if (orderId) {
      onShowMessage?.(`卖出委托单已提交，价格: ¥${price.toFixed(3)}`, 'success');
      setShowSellDialog(false);
      setSellQuantity('');
      setSellPrice('');
      
      // 恢复原来的游戏状态
      if (wasPlayingBeforeDialog) {
        resumeGame();
      }
    } else {
      onShowMessage?.('委托下单失败', 'error');
    }
  };

  const handleQuickBuy = (percent: number) => {
    const price = parseFloat(buyPrice) || currentPrice;
    const maxQuantity = calculateMaxBuyQuantity(price);
    const quantity = Math.floor(maxQuantity * percent);
    setBuyQuantity(quantity.toString());
  };

  const handleQuickSell = (percent: number) => {
    const quantity = Math.floor(maxSellQuantity * percent);
    setSellQuantity(quantity.toString());
  };

  const handleQuickBuyPrice = (percent: number) => {
    const price = currentPrice * (1 - percent);
    setBuyPrice(price.toFixed(3));
  };

  const handleQuickSellPrice = (percent: number) => {
    const price = currentPrice * (1 + percent);
    setSellPrice(price.toFixed(3));
  };

  // 计算买入总成本（包含手续费）
  const calculateBuyCost = (quantity: number, price: number) => {
    const tradeAmount = quantity * price;
    const commission = Math.max(tradeAmount * 0.0003, 5); // 佣金，最低5元
    const transferFee = Math.max(tradeAmount * 0.00001, 1); // 过户费，最低1元
    return tradeAmount + commission + transferFee;
  };

  // 计算卖出净收入（扣除手续费）
  const calculateSellIncome = (quantity: number, price: number) => {
    const tradeAmount = quantity * price;
    const commission = Math.max(tradeAmount * 0.0003, 5); // 佣金，最低5元
    const stampTax = tradeAmount * 0.001; // 印花税，仅卖出时收取
    const transferFee = Math.max(tradeAmount * 0.00001, 1); // 过户费，最低1元
    const totalFees = commission + stampTax + transferFee;
    return tradeAmount - totalFees;
  };

  if (!isPlaying) {
    return (
      <div className="flex justify-center">
        <button className="btn-secondary opacity-50 cursor-not-allowed" disabled>
          请先开始游戏
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 交易按钮 */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => {
            setWasPlayingBeforeDialog(isPlaying && !isPaused);
            if (!isPaused) {
              pauseGame();
            }
            setShowBuyDialog(true);
          }}
          disabled={maxBuyQuantity === 0}
          className="btn-buy disabled:opacity-50 disabled:cursor-not-allowed"
        >
          买入
        </button>
        <button
          onClick={() => {
            setWasPlayingBeforeDialog(isPlaying && !isPaused);
            if (!isPaused) {
              pauseGame();
            }
            setShowSellDialog(true);
          }}
          disabled={maxSellQuantity === 0}
          className="btn-sell disabled:opacity-50 disabled:cursor-not-allowed"
        >
          卖出
        </button>
      </div>

      {/* 买入对话框 */}
      {showBuyDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">买入股票</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  当前价格: ¥{currentPrice.toFixed(3)}
                </label>
                <label className="block text-sm text-gray-400 mb-1">
                  可用资金: ¥{currentBalance.toFixed(2)}
                </label>
                <label className="block text-sm text-gray-400 mb-1">
                  最大可买: {maxBuyQuantity} 股
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">委托价格</label>
                <input
                  type="number"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value)}
                  placeholder="请输入委托价格"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  step="0.001"
                  min="0"
                />
                
                {/* 快速价格选择 */}
                <div className="grid grid-cols-4 gap-2 mt-2">
                  <button
                    onClick={() => handleQuickBuyPrice(0.01)}
                    className="py-1 px-2 bg-gray-600 hover:bg-gray-500 rounded text-sm"
                  >
                    -1%
                  </button>
                  <button
                    onClick={() => handleQuickBuyPrice(0.005)}
                    className="py-1 px-2 bg-gray-600 hover:bg-gray-500 rounded text-sm"
                  >
                    -0.5%
                  </button>
                  <button
                    onClick={() => handleQuickBuyPrice(0.002)}
                    className="py-1 px-2 bg-gray-600 hover:bg-gray-500 rounded text-sm"
                  >
                    -0.2%
                  </button>
                  <button
                    onClick={() => setBuyPrice(currentPrice.toFixed(3))}
                    className="py-1 px-2 bg-gray-600 hover:bg-gray-500 rounded text-sm"
                  >
                    现价
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">买入数量</label>
                <input
                  type="number"
                  value={buyQuantity}
                  onChange={(e) => setBuyQuantity(e.target.value)}
                  placeholder="请输入买入数量"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  max={maxBuyQuantity}
                  min="1"
                />
              </div>

              {/* 快速选择按钮 */}
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => handleQuickBuy(0.25)}
                  className="py-1 px-2 bg-gray-600 hover:bg-gray-500 rounded text-sm"
                >
                  25%
                </button>
                <button
                  onClick={() => handleQuickBuy(0.5)}
                  className="py-1 px-2 bg-gray-600 hover:bg-gray-500 rounded text-sm"
                >
                  50%
                </button>
                <button
                  onClick={() => handleQuickBuy(0.75)}
                  className="py-1 px-2 bg-gray-600 hover:bg-gray-500 rounded text-sm"
                >
                  75%
                </button>
                <button
                  onClick={() => handleQuickBuy(1)}
                  className="py-1 px-2 bg-gray-600 hover:bg-gray-500 rounded text-sm"
                >
                  全仓
                </button>
              </div>

              <div className="text-sm text-gray-400">
                当前价格: ¥{currentPrice.toFixed(3)}
              </div>
              <div className="text-sm text-gray-400">
                预计花费: ¥{calculateBuyCost(parseInt(buyQuantity) || 0, parseFloat(buyPrice) || 0).toFixed(2)}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleBuy}
                  className="flex-1 btn-buy"
                >
                  确认买入
                </button>
                <button
                  onClick={() => {
                    setShowBuyDialog(false);
                    setBuyQuantity('');
                    setBuyPrice('');
                  }}
                  className="flex-1 btn-secondary"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 卖出对话框 */}
      {showSellDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">卖出股票</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  当前价格: ¥{currentPrice.toFixed(3)}
                </label>
                <label className="block text-sm text-gray-400 mb-1">
                  可用持仓: {maxSellQuantity} 股
                </label>
                {frozenPosition > 0 && (
                  <label className="block text-sm text-orange-400 mb-1">
                    冻结持仓: {frozenPosition} 股
                  </label>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">委托价格</label>
                <input
                  type="number"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                  placeholder="请输入委托价格"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  step="0.001"
                  min="0"
                />
                
                {/* 快速价格选择 */}
                <div className="grid grid-cols-4 gap-2 mt-2">
                  <button
                    onClick={() => handleQuickSellPrice(0.01)}
                    className="py-1 px-2 bg-gray-600 hover:bg-gray-500 rounded text-sm"
                  >
                    +1%
                  </button>
                  <button
                    onClick={() => handleQuickSellPrice(0.005)}
                    className="py-1 px-2 bg-gray-600 hover:bg-gray-500 rounded text-sm"
                  >
                    +0.5%
                  </button>
                  <button
                    onClick={() => handleQuickSellPrice(0.002)}
                    className="py-1 px-2 bg-gray-600 hover:bg-gray-500 rounded text-sm"
                  >
                    +0.2%
                  </button>
                  <button
                    onClick={() => setSellPrice(currentPrice.toFixed(3))}
                    className="py-1 px-2 bg-gray-600 hover:bg-gray-500 rounded text-sm"
                  >
                    现价
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">卖出数量</label>
                <input
                  type="number"
                  value={sellQuantity}
                  onChange={(e) => setSellQuantity(e.target.value)}
                  placeholder="请输入卖出数量"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  max={maxSellQuantity}
                  min="1"
                />
              </div>

              {/* 快速选择按钮 */}
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => handleQuickSell(0.25)}
                  className="py-1 px-2 bg-gray-600 hover:bg-gray-500 rounded text-sm"
                >
                  25%
                </button>
                <button
                  onClick={() => handleQuickSell(0.5)}
                  className="py-1 px-2 bg-gray-600 hover:bg-gray-500 rounded text-sm"
                >
                  50%
                </button>
                <button
                  onClick={() => handleQuickSell(0.75)}
                  className="py-1 px-2 bg-gray-600 hover:bg-gray-500 rounded text-sm"
                >
                  75%
                </button>
                <button
                  onClick={() => handleQuickSell(1)}
                  className="py-1 px-2 bg-gray-600 hover:bg-gray-500 rounded text-sm"
                >
                  全部
                </button>
              </div>

              <div className="text-sm text-gray-400">
                当前价格: ¥{currentPrice.toFixed(3)}
              </div>
              <div className="text-sm text-gray-400">
                预计收入: ¥{calculateSellIncome(parseInt(sellQuantity) || 0, parseFloat(sellPrice) || 0).toFixed(2)}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleSell}
                  className="flex-1 btn-sell"
                >
                  确认卖出
                </button>
                <button
                  onClick={() => {
                    setShowSellDialog(false);
                    setSellQuantity('');
                    setSellPrice('');
                  }}
                  className="flex-1 btn-secondary"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
