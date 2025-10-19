import React, { useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { OrderStatus } from '../types/game';

export const OrderPanel: React.FC = () => {
  const {
    isPlaying,
    // currentBalance,
    // position,
    // getCurrentPrice,
    orders,
    // placeOrder,
    cancelOrder,
    // getAvailableBalance,
    // getTotalFrozenPosition
  } = useGameStore();

  // const [showOrderDialog, setShowOrderDialog] = useState(false);
  // const [orderType, setOrderType] = useState<OrderType>('buy');
  // const [orderPrice, setOrderPrice] = useState('');
  // const [orderQuantity, setOrderQuantity] = useState('');
  const [showCompletedOrders, setShowCompletedOrders] = useState(false);

  // const currentPrice = getCurrentPrice();
  // const availableBalance = getAvailableBalance();
  // const frozenPosition = getTotalFrozenPosition();
  // const availablePosition = position - frozenPosition;
  
  // // 计算最大可买数量（考虑手续费）
  // const calculateMaxBuyQuantity = (price: number) => {
  //   if (price <= 0) return 0;
    
  //   let maxQuantity = 0;
  //   // 从理论最大值开始向下查找
  //   const theoreticalMax = Math.floor(availableBalance / price);
    
  //   console.log('=== calculateMaxBuyQuantity 调试信息 ===');
  //   console.log('价格:', price);
  //   console.log('可用余额:', availableBalance);
  //   console.log('理论最大数量:', theoreticalMax);
    
  //   for (let quantity = theoreticalMax; quantity >= 0; quantity--) {
  //     const estimatedCost = price * quantity;
  //     const commission = Math.max(estimatedCost * 0.0003, 5);
  //     const transferFee = Math.max(estimatedCost * 0.00001, 1);
  //     const totalCost = estimatedCost + commission + transferFee;
      
  //     if (totalCost <= availableBalance) {
  //       maxQuantity = quantity;
  //       console.log('找到最大可买数量:', quantity);
  //       console.log('交易金额:', estimatedCost);
  //       console.log('佣金:', commission);
  //       console.log('过户费:', transferFee);
  //       console.log('总花费:', totalCost);
  //       break;
  //     }
  //   }
    
  //   console.log('最终返回最大可买数量:', maxQuantity);
  //   console.log('=== 调试信息结束 ===');
    
  //   return maxQuantity;
  // };
  
  // const maxSellQuantity = availablePosition;

  // const handlePlaceOrder = () => {
  //   const price = parseFloat(orderPrice);
  //   const quantity = parseInt(orderQuantity);

  //   if (isNaN(price) || price <= 0) {
  //     alert('请输入有效的委托价格');
  //     return;
  //   }

  //   if (isNaN(quantity) || quantity <= 0) {
  //     alert('请输入有效的委托数量');
  //     return;
  //   }

  //   // 基于实际委托价格重新计算最大可买数量
  //   const actualMaxBuyQuantity = orderType === 'buy' ? calculateMaxBuyQuantity(price) : maxSellQuantity;

  //   if (orderType === 'buy' && quantity > actualMaxBuyQuantity) {
  //     alert('资金不足');
  //     return;
  //   }

  //   if (orderType === 'sell' && quantity > maxSellQuantity) {
  //     alert('持仓不足');
  //     return;
  //   }

  //   const orderId = placeOrder(orderType, price, quantity);
  //   if (orderId) {
  //     setShowOrderDialog(false);
  //     setOrderPrice('');
  //     setOrderQuantity('');
  //     alert(`${orderType === 'buy' ? '买入' : '卖出'}委托单已提交`);
  //   } else {
  //     alert('委托下单失败，请检查资金或持仓是否充足');
  //   }
  // };

  const handleCancelOrder = (orderId: string) => {
    if (cancelOrder(orderId)) {
      alert('委托单已撤销');
    }
  };

  // const handleQuickPrice = (percent: number) => {
  //   const price = currentPrice * (1 + (orderType === 'buy' ? -percent : percent));
  //   setOrderPrice(price.toFixed(3));
    
  //   // 价格变化后重新计算数量
  //   setTimeout(() => {
  //     if (orderQuantity) {
  //       const newMaxQuantity = orderType === 'buy' ? calculateMaxBuyQuantity(price) : maxSellQuantity;
  //       const currentQuantity = parseInt(orderQuantity) || 0;
        
  //       // 如果当前数量超过新的最大数量，自动调整
  //       if (currentQuantity > newMaxQuantity) {
  //         setOrderQuantity(newMaxQuantity.toString());
  //       }
  //     }
  //   }, 0);
  // };

  // const handleQuickQuantity = (percent: number) => {
  //   const price = parseFloat(orderPrice) || currentPrice;
  //   const maxQuantity = orderType === 'buy' ? calculateMaxBuyQuantity(price) : maxSellQuantity;
  //   const quantity = Math.floor(maxQuantity * percent);
  //   setOrderQuantity(quantity.toString());
  // };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'text-yellow-400';
      case 'filled': return 'text-green-400';
      case 'cancelled': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return '待成交';
      case 'filled': return '已成交';
      case 'cancelled': return '已撤销';
      default: return '未知';
    }
  };

  if (!isPlaying) {
    return (
      <div className="card">
        <h3 className="text-lg font-bold text-white mb-4">委托单</h3>
        <div className="text-center text-gray-400">
          请先开始游戏
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-lg font-bold text-white mb-4">委托单</h3>

      {/* 委托单列表 */}
      <div className="space-y-2 mb-4">
        {orders.length === 0 ? (
          <div className="text-center text-gray-400 text-sm">
            暂无委托单
          </div>
        ) : (
          <>
            {/* 待成交委托单 */}
            {orders.filter(order => order.status === 'pending').map(order => (
              <div key={order.id} className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                <div className="flex justify-between items-center mb-2">
                  <div className={`font-medium ${order.type === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                    {order.type === 'buy' ? '买入' : '卖出'}
                  </div>
                  <div className={`text-sm ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-400">价格:</span>
                    <span className="text-white ml-1">¥{order.price.toFixed(3)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">数量:</span>
                    <span className="text-white ml-1">{order.quantity}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">已成交:</span>
                    <span className="text-white ml-1">{order.filledQuantity}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">总额:</span>
                    <span className="text-white ml-1">¥{(order.price * order.quantity).toFixed(2)}</span>
                  </div>
                </div>
                
                <button
                  onClick={() => handleCancelOrder(order.id)}
                  className="mt-2 w-full btn-secondary py-1 px-2 text-sm"
                >
                  撤单
                </button>
              </div>
            ))}

            {/* 已完成委托单（已成交和已撤销） */}
            {orders.filter(order => order.status !== 'pending').length > 0 && (
              <div className="mt-4">
                <button
                  onClick={() => setShowCompletedOrders(!showCompletedOrders)}
                  className="w-full flex items-center justify-between text-sm text-gray-400 hover:text-gray-300 transition-colors py-2 px-3 bg-gray-800 rounded-lg"
                >
                  <span>
                    已完成委托单 ({orders.filter(order => order.status !== 'pending').length})
                  </span>
                  <span className={`transform transition-transform ${showCompletedOrders ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>
                
                {showCompletedOrders && (
                  <div className="mt-2 space-y-2">
                    {orders.filter(order => order.status !== 'pending').map(order => (
                      <div key={order.id} className="bg-gray-800 rounded-lg p-3 opacity-60 border border-gray-700">
                        <div className="flex justify-between items-center mb-2">
                          <div className={`font-medium ${order.type === 'buy' ? 'text-green-400' : 'text-red-400'} opacity-80`}>
                            {order.type === 'buy' ? '买入' : '卖出'}
                          </div>
                          <div className={`text-sm ${getStatusColor(order.status)} opacity-80`}>
                            {getStatusText(order.status)}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500">价格:</span>
                            <span className="text-gray-300 ml-1">¥{order.price.toFixed(3)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">数量:</span>
                            <span className="text-gray-300 ml-1">{order.quantity}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">已成交:</span>
                            <span className="text-gray-300 ml-1">{order.filledQuantity}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">总额:</span>
                            <span className="text-gray-300 ml-1">¥{(order.price * order.quantity).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
};
