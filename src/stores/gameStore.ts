import { create } from 'zustand';
import { GameState, ETFInfo, TradeRecord, GameResult, GameConfig, Order, OrderType, OrderStatus } from '../types/game';
import { NotificationItem } from '../components/Notification';

// 游戏配置
const GAME_CONFIG: GameConfig = {
  initialBalance: 100000,
  gameDuration: 252, // 一年交易日（约252天）
  speedOptions: [1, 2, 4]
};

// A股手续费配置
const TRADING_FEES = {
  commissionRate: 0.0003, // 佣金费率：万分之三（0.03%）
  minCommission: 5,       // 最低佣金：5元
  stampTaxRate: 0.001,    // 印花税：千分之一（0.1%），仅卖出时收取
  transferFee: 0.00001,   // 过户费：万分之一（0.01%）
  minTransferFee: 1,      // 最低过户费：1元
};

// 日志配置
const LOG_CONFIG = {
  enabled: {
    gameLoop: false,        // 游戏循环日志
    processOrders: true,    // 委托单处理日志
    costLine: true,         // 成本线日志
    trades: true,           // 交易日志
    balanceChanges: true,   // 余额变化日志
  },
  level: 'info' as 'debug' | 'info' | 'warn' | 'error'
};

// 日志工具函数
const createLogger = (category: keyof typeof LOG_CONFIG.enabled) => {
  return {
    log: (message: string, data?: any) => {
      if (LOG_CONFIG.enabled[category]) {
        console.log(`${category}: ${message}`, data || '');
      }
    },
    warn: (message: string, data?: any) => {
      if (LOG_CONFIG.enabled[category]) {
        console.warn(`${category}: ${message}`, data || '');
      }
    },
    error: (message: string, data?: any) => {
      if (LOG_CONFIG.enabled[category]) {
        console.error(`${category}: ${message}`, data || '');
      }
    }
  };
};

interface GameStore extends GameState {
  // Actions
  startGame: (etf: ETFInfo, startIndex: number) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  setGameSpeed: (speed: number) => void;
  nextKLine: () => void;
  buy: (quantity: number) => boolean;
  sell: (quantity: number) => boolean;
  resetGame: () => void;
  endGame: () => void;
  
  // 委托单相关
  placeOrder: (type: OrderType, price: number, quantity: number) => string;
  cancelOrder: (orderId: string) => boolean;
  processOrders: () => void;
  startTrading: () => void;
  endTrading: () => void;
  
  // 通知相关
  notifications: NotificationItem[];
  addNotification: (notification: Omit<NotificationItem, 'id'>) => void;
  removeNotification: (id: string) => void;
  
  // Computed values
  getCurrentData: () => any;
  getCurrentPrice: () => number;
  getTotalAssets: () => number;
  getUnrealizedPnL: () => number;
  getUnrealizedPnLPercent: () => number;
  getAvailableBalance: () => number; // 可用余额（扣除冻结资金）
  getFrozenBalance: () => number;   // 冻结资金
  getTotalFrozenPosition: () => number; // 总冻结持仓
  isGameOver: () => boolean;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  isPlaying: false,
  isPaused: false,
  gameSpeed: 1,
  currentETF: null,
  currentDataIndex: 0,
  totalDataCount: 0,
  initialBalance: GAME_CONFIG.initialBalance,
  currentBalance: GAME_CONFIG.initialBalance,
  position: 0,
  positionCost: 0,
  trades: [],
  orders: [],
  gameProgress: 0,
  remainingTime: 0,
  gameResult: null,
  isTrading: false,
  notifications: [],

  // Actions
  startGame: (etf: ETFInfo, startIndex: number) => {
    // 确保etf.data存在
    if (!etf.data || !Array.isArray(etf.data)) {
      console.error('startGame: etf.data is not available', etf);
      return;
    }
    
    const gameData = etf.data.slice(startIndex, startIndex + GAME_CONFIG.gameDuration);
    
    // 创建一个新的ETF对象，只包含游戏需要的数据
    const gameETF: ETFInfo = {
      ...etf,
      data: gameData
    };
    
    // 游戏从第26根K线开始（即游戏数据中的第26根，对应原始数据的startIndex + 26）
    const gameStartIndex = 26;
    
    set({
      isPlaying: true,
      isPaused: false,
      gameSpeed: 1,
      currentETF: gameETF,
      currentDataIndex: gameStartIndex, // 从第26根K线开始游戏
      totalDataCount: gameData.length,
      initialBalance: GAME_CONFIG.initialBalance,
      currentBalance: GAME_CONFIG.initialBalance,
      position: 0,
      positionCost: 0,
      trades: [],
      orders: [],
      gameProgress: (gameStartIndex / gameData.length) * 100, // 初始进度
      remainingTime: gameData.length - gameStartIndex, // 剩余时间
      gameResult: null,
      isTrading: false
    });
  },

  pauseGame: () => {
    set({ isPaused: true });
  },

  resumeGame: () => {
    set({ isPaused: false });
  },

  setGameSpeed: (speed: number) => {
    set({ gameSpeed: speed });
  },

  nextKLine: () => {
    const state = get();
    if (!state.isPlaying || state.isGameOver()) {
      console.log('nextKLine: 跳过更新', { isPlaying: state.isPlaying, isGameOver: state.isGameOver() });
      return;
    }

    console.log('nextKLine: 执行更新');
    const newIndex = state.currentDataIndex + 1;
    const progress = (newIndex / state.totalDataCount) * 100;
    const remainingTime = state.totalDataCount - newIndex;

    set({
      currentDataIndex: newIndex,
      gameProgress: progress,
      remainingTime: remainingTime
    });

    // 处理委托单
    get().processOrders();

    // 检查游戏是否结束
    if (newIndex >= state.totalDataCount) {
      get().endGame();
    }
  },

  buy: (quantity: number) => {
    const state = get();
    if (!state.isPlaying || state.isPaused || !state.currentETF) return false;

    const currentPrice = state.getCurrentPrice();
    const tradeAmount = currentPrice * quantity;

    // 计算买入手续费
    const commission = Math.max(tradeAmount * TRADING_FEES.commissionRate, TRADING_FEES.minCommission);
    const transferFee = Math.max(tradeAmount * TRADING_FEES.transferFee, TRADING_FEES.minTransferFee);
    const totalFees = commission + transferFee;
    const totalCost = tradeAmount + totalFees;

    if (state.currentBalance < totalCost) {
      return false; // 资金不足
    }

    const currentData = state.currentETF.data[state.currentDataIndex];
    const newTrade: TradeRecord = {
      id: `trade_${Date.now()}`,
      type: 'buy',
      price: currentPrice,
      quantity,
      amount: tradeAmount, // 交易金额（不含手续费）
      fees: totalFees,     // 手续费
      timestamp: currentData ? currentData.time : '',
      dataIndex: state.currentDataIndex
    };

    // 更新持仓成本（包含手续费）
    // 使用加权平均法计算新的持仓成本
    const oldTotalCost = state.positionCost;
    const oldQuantity = state.position;
    const newTotalCost = oldTotalCost + totalCost;
    const newTotalQuantity = oldQuantity + quantity;
    const newAvgCost = newTotalQuantity > 0 ? newTotalCost / newTotalQuantity : 0;

    console.log('=== 买入交易日志 ===');
    console.log('交易类型: 买入');
    console.log('买入价格: ¥' + currentPrice.toFixed(3));
    console.log('买入数量: ' + quantity + '股');
    console.log('交易金额: ¥' + tradeAmount.toFixed(2));
    console.log('手续费明细:');
    console.log('  - 佣金: ¥' + commission.toFixed(2) + ' (费率: ' + (TRADING_FEES.commissionRate * 100).toFixed(3) + '%)');
    console.log('  - 过户费: ¥' + transferFee.toFixed(2) + ' (费率: ' + (TRADING_FEES.transferFee * 100).toFixed(4) + '%)');
    console.log('总手续费: ¥' + totalFees.toFixed(2));
    console.log('总成本: ¥' + totalCost.toFixed(2));
    console.log('持仓变化:');
    console.log('  - 原持仓: ' + oldQuantity + '股');
    console.log('  - 原成本: ¥' + oldTotalCost.toFixed(2));
    console.log('  - 原均价: ¥' + (oldQuantity > 0 ? (oldTotalCost / oldQuantity).toFixed(3) : '0.000'));
    console.log('  - 新持仓: ' + newTotalQuantity + '股');
    console.log('  - 新成本: ¥' + newTotalCost.toFixed(2));
    console.log('  - 新均价: ¥' + newAvgCost.toFixed(3));
    console.log('资金变化:');
    console.log('  - 原余额: ¥' + state.currentBalance.toFixed(2));
    console.log('  - 新余额: ¥' + (state.currentBalance - totalCost).toFixed(2));
    console.log('  - 扣除金额: ¥' + totalCost.toFixed(2));
    console.log('时间戳: ' + new Date().toISOString());
    console.log('==================');

    set({
      currentBalance: state.currentBalance - totalCost,
      position: newTotalQuantity,
      positionCost: newTotalCost, // 直接存储总成本，而不是平均成本×数量
      trades: [...state.trades, newTrade]
    });

    return true;
  },

  sell: (quantity: number) => {
    const state = get();
    if (!state.isPlaying || state.isPaused || !state.currentETF) return false;

    if (state.position < quantity) {
      return false; // 持仓不足
    }

    const currentPrice = state.getCurrentPrice();
    const tradeAmount = currentPrice * quantity;

    // 计算卖出手续费
    const commission = Math.max(tradeAmount * TRADING_FEES.commissionRate, TRADING_FEES.minCommission);
    const stampTax = tradeAmount * TRADING_FEES.stampTaxRate; // 印花税仅卖出时收取
    const transferFee = Math.max(tradeAmount * TRADING_FEES.transferFee, TRADING_FEES.minTransferFee);
    const totalFees = commission + stampTax + transferFee;
    const netAmount = tradeAmount - totalFees; // 实际到账金额

    const currentData = state.currentETF.data[state.currentDataIndex];
    const newTrade: TradeRecord = {
      id: `trade_${Date.now()}`,
      type: 'sell',
      price: currentPrice,
      quantity,
      amount: tradeAmount, // 交易金额（不含手续费）
      fees: totalFees,     // 手续费
      timestamp: currentData ? currentData.time : '',
      dataIndex: state.currentDataIndex
    };

    // 正确的持仓成本计算：按比例减少成本，不进行盈亏分摊
    const oldAvgCost = state.position > 0 ? state.positionCost / state.position : 0;
    const newTotalQuantity = state.position - quantity;
    
    // 卖出部分的成本（基于原始平均成本）
    const soldCost = oldAvgCost * quantity;
    
    // 亏损或盈利金额（仅用于显示和记录）
    const pnl = tradeAmount - soldCost;
    
    // 关键修正：剩余持仓成本按比例减少，不进行盈亏分摊
    const newTotalCost = state.positionCost - soldCost;
    const newAvgCost = newTotalQuantity > 0 ? newTotalCost / newTotalQuantity : 0;

    console.log('=== 卖出交易日志 ===');
    console.log('交易类型: 卖出');
    console.log('卖出价格: ¥' + currentPrice.toFixed(3));
    console.log('卖出数量: ' + quantity + '股');
    console.log('交易金额: ¥' + tradeAmount.toFixed(2));
    console.log('手续费明细:');
    console.log('  - 佣金: ¥' + commission.toFixed(2) + ' (费率: ' + (TRADING_FEES.commissionRate * 100).toFixed(3) + '%)');
    console.log('  - 印花税: ¥' + stampTax.toFixed(2) + ' (费率: ' + (TRADING_FEES.stampTaxRate * 100).toFixed(3) + '%)');
    console.log('  - 过户费: ¥' + transferFee.toFixed(2) + ' (费率: ' + (TRADING_FEES.transferFee * 100).toFixed(4) + '%)');
    console.log('总手续费: ¥' + totalFees.toFixed(2));
    console.log('实际到账: ¥' + netAmount.toFixed(2));
    console.log('持仓变化:');
    console.log('  - 原持仓: ' + state.position + '股');
    console.log('  - 原成本: ¥' + state.positionCost.toFixed(2));
    console.log('  - 原均价: ¥' + oldAvgCost.toFixed(3));
    console.log('  - 新持仓: ' + newTotalQuantity + '股');
    console.log('  - 新成本: ¥' + newTotalCost.toFixed(2));
    console.log('  - 新均价: ¥' + newAvgCost.toFixed(3));
    console.log('盈亏分析:');
    console.log('  - 卖出成本: ¥' + soldCost.toFixed(2));
    console.log('  - 盈亏金额: ¥' + pnl.toFixed(2) + ' (' + (pnl >= 0 ? '盈利' : '亏损') + ')');
    if (newTotalQuantity > 0) {
      console.log('  - 成本说明: 剩余持仓成本保持不变，按比例减少总成本');
      console.log('  - 成本原则: 不进行盈亏分摊，保持成本独立性');
    }
    console.log('资金变化:');
    console.log('  - 原余额: ¥' + state.currentBalance.toFixed(2));
    console.log('  - 新余额: ¥' + (state.currentBalance + netAmount).toFixed(2));
    console.log('  - 增加金额: ¥' + netAmount.toFixed(2));
    console.log('时间戳: ' + new Date().toISOString());
    console.log('==================');

    set({
      currentBalance: state.currentBalance + netAmount,
      position: newTotalQuantity,
      positionCost: newTotalCost,
      trades: [...state.trades, newTrade]
    });

    return true;
  },

  resetGame: () => {
    set({
      isPlaying: false,
      isPaused: false,
      gameSpeed: 1,
      currentETF: null,
      currentDataIndex: 0,
      totalDataCount: 0,
      initialBalance: GAME_CONFIG.initialBalance,
      currentBalance: GAME_CONFIG.initialBalance,
      position: 0,
      positionCost: 0,
      trades: [],
      orders: [],
      gameProgress: 0,
      remainingTime: 0,
      gameResult: null,
      isTrading: false,
      notifications: []
    });
  },

  // 通知相关方法
  addNotification: (notification: Omit<NotificationItem, 'id'>) => {
    const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: NotificationItem = {
      ...notification,
      id
    };
    
    set(state => ({
      notifications: [...state.notifications, newNotification]
    }));
  },

  removeNotification: (id: string) => {
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }));
  },

  endGame: () => {
    const state = get();
    const finalBalance = state.getTotalAssets();
    const totalReturn = finalBalance - state.initialBalance;
    const returnRate = (totalReturn / state.initialBalance) * 100;

    // 计算最大回撤
    let maxBalance = state.initialBalance;
    let maxDrawdown = 0;
    let currentBalance = state.initialBalance;
    let currentPosition = 0;
    let currentPositionCost = 0;
    
    // 模拟整个游戏过程的资产变化
    for (let i = 0; i <= state.currentDataIndex && i < state.currentETF!.data.length; i++) {
      const currentPrice = state.currentETF!.data[i].close;
      
      // 处理这个时间点之前的所有交易
      const tradesAtThisPoint = state.trades.filter(t => t.dataIndex <= i);
      
      for (const trade of tradesAtThisPoint) {
        if (trade.type === 'buy') {
          // 买入：扣除交易金额+手续费
          const totalCost = trade.amount + (trade.fees || 0);
          const newTotalCost = currentPositionCost + totalCost;
          const newTotalQuantity = currentPosition + trade.quantity;
          const avgCost = newTotalQuantity > 0 ? newTotalCost / newTotalQuantity : 0;
          
          currentPosition = newTotalQuantity;
          currentPositionCost = avgCost * newTotalQuantity;
          currentBalance -= totalCost;
        } else if (trade.type === 'sell') {
          // 卖出：增加交易金额-手续费
          const netAmount = trade.amount - (trade.fees || 0);
          const costPerShare = currentPosition > 0 ? currentPositionCost / currentPosition : 0;
          const soldCost = costPerShare * trade.quantity;
          const newTotalQuantity = currentPosition - trade.quantity;
          const newTotalCost = currentPositionCost - soldCost;
          
          currentPosition = newTotalQuantity;
          currentPositionCost = newTotalCost;
          currentBalance += netAmount;
        }
      }
      
      const totalAssets = currentBalance + (currentPosition * currentPrice);
      maxBalance = Math.max(maxBalance, totalAssets);
      const drawdown = ((maxBalance - totalAssets) / maxBalance) * 100;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }

    // 计算胜率
    const buyTrades = state.trades.filter(t => t.type === 'buy');
    const sellTrades = state.trades.filter(t => t.type === 'sell');
    const winCount = sellTrades.filter(sell => {
      const correspondingBuy = buyTrades.find(buy =>
        buy.timestamp < sell.timestamp && buy.quantity >= sell.quantity
      );
      return correspondingBuy && sell.price > correspondingBuy.price;
    }).length;
    const winRate = sellTrades.length > 0 ? (winCount / sellTrades.length) * 100 : 0;

    // 计算得分
    const score = Math.max(0, returnRate - maxDrawdown) * 10 + (winRate * 2);

    const gameResult: GameResult = {
      finalBalance,
      totalReturn,
      returnRate,
      maxDrawdown,
      tradeCount: state.trades.length,
      winRate,
      score: Math.round(score),
      duration: state.currentDataIndex
    };

    set({
      isPlaying: false,
      gameResult
    });
  },

  getCurrentData: () => {
    const state = get();
    if (!state.currentETF || state.currentDataIndex >= state.currentETF.data.length) return null;
    return state.currentETF.data[state.currentDataIndex];
  },

  getCurrentPrice: () => {
    const state = get();
    if (!state.currentETF || state.currentDataIndex >= state.currentETF.data.length) return 0;
    return state.currentETF.data[state.currentDataIndex].close;
  },

  getTotalAssets: () => {
    const state = get();
    const currentPrice = state.getCurrentPrice();
    return state.currentBalance + (state.position * currentPrice);
  },

  getUnrealizedPnL: () => {
    const state = get();
    const currentPrice = state.getCurrentPrice();
    const currentValue = state.position * currentPrice;
    return currentValue - state.positionCost;
  },

  getUnrealizedPnLPercent: () => {
    const state = get();
    if (state.positionCost === 0) return 0;
    return (state.getUnrealizedPnL() / state.positionCost) * 100;
  },

  isGameOver: () => {
    const state = get();
    return state.currentDataIndex >= state.totalDataCount;
  },

  // 委托单相关功能
  startTrading: () => {
    console.log('gameStore: startTrading - 设置isTrading为true');
    set({ isTrading: true });
    // 强制更新状态
    setTimeout(() => {
      console.log('gameStore: startTrading - 强制确认isTrading状态', get().isTrading);
    }, 0);
  },

  endTrading: () => {
    console.log('gameStore: endTrading - 设置isTrading为false');
    set({ isTrading: false });
    // 强制更新状态
    setTimeout(() => {
      console.log('gameStore: endTrading - 强制确认isTrading状态', get().isTrading);
    }, 0);
  },

  placeOrder: (type: OrderType, price: number, quantity: number) => {
    console.log('gameStore: placeOrder - 创建委托单', { type, price, quantity });
    const state = get();
    if (!state.isPlaying || !state.currentETF) {
      console.log('gameStore: placeOrder - 无法创建委托单', { isPlaying: state.isPlaying, hasETF: !!state.currentETF });
      return '';
    }

    // 检查资金和持仓是否足够
    if (type === 'buy') {
      const estimatedCost = price * quantity;
      const commission = Math.max(estimatedCost * TRADING_FEES.commissionRate, TRADING_FEES.minCommission);
      const transferFee = Math.max(estimatedCost * TRADING_FEES.transferFee, TRADING_FEES.minTransferFee);
      const totalCost = estimatedCost + commission + transferFee;
      
      if (state.currentBalance < totalCost) {
        console.log('gameStore: placeOrder - 资金不足', { balance: state.currentBalance, needed: totalCost });
        return '';
      }

      // 直接扣款（预扣资金）
      const orderId = `order_${Date.now()}`;
      const currentData = state.currentETF.data[state.currentDataIndex];
      
      const newOrder: Order = {
        id: orderId,
        type,
        price,
        quantity,
        filledQuantity: 0,
        status: 'pending',
        timestamp: currentData ? currentData.time : '',
        dataIndex: state.currentDataIndex
      };

      console.log('gameStore: placeOrder - 买入委托单已创建，预扣资金', { totalCost, newOrder });
      set({
        orders: [...state.orders, newOrder],
        currentBalance: state.currentBalance - totalCost
      });

      return orderId;
    } else if (type === 'sell') {
      // 计算可用持仓（排除已冻结的持仓）
      let frozenPosition = 0;
      state.orders.forEach(order => {
        if (order.status === 'pending' && order.type === 'sell') {
          frozenPosition += order.quantity - order.filledQuantity;
        }
      });
      const availablePosition = state.position - frozenPosition;
      
      if (availablePosition < quantity) {
        console.log('gameStore: placeOrder - 持仓不足', { 
          totalPosition: state.position, 
          frozenPosition, 
          availablePosition, 
          needed: quantity 
        });
        return '';
      }

      // 卖出委托单不直接减少持仓，而是在processOrders中处理
      const orderId = `order_${Date.now()}`;
      const currentData = state.currentETF.data[state.currentDataIndex];
      
      const newOrder: Order = {
        id: orderId,
        type,
        price,
        quantity,
        filledQuantity: 0,
        status: 'pending',
        timestamp: currentData ? currentData.time : '',
        dataIndex: state.currentDataIndex
      };

      console.log('gameStore: placeOrder - 卖出委托单已创建', { 
        newOrder,
        totalPosition: state.position,
        frozenPosition,
        availablePosition
      });
      
      set({
        orders: [...state.orders, newOrder]
      });

      return orderId;
    }

    return '';
  },

  cancelOrder: (orderId: string) => {
    const state = get();
    const orderToCancel = state.orders.find(order => order.id === orderId);
    
    if (!orderToCancel || orderToCancel.status !== 'pending') {
      return false;
    }

    console.log('gameStore: cancelOrder - 开始撤单', { 
      orderId, 
      orderType: orderToCancel.type,
      orderPrice: orderToCancel.price,
      orderQuantity: orderToCancel.quantity,
      currentPosition: state.position,
      currentPositionCost: state.positionCost
    });

    // 退款或解冻持仓
    let updatedBalance = state.currentBalance;
    let updatedPosition = state.position;
    let updatedPositionCost = state.positionCost;

    if (orderToCancel.type === 'buy') {
      // 买入委托单：退款
      const estimatedCost = orderToCancel.price * orderToCancel.quantity;
      const commission = Math.max(estimatedCost * TRADING_FEES.commissionRate, TRADING_FEES.minCommission);
      const transferFee = Math.max(estimatedCost * TRADING_FEES.transferFee, TRADING_FEES.minTransferFee);
      const refundAmount = estimatedCost + commission + transferFee;
      
      updatedBalance += refundAmount;
      console.log('gameStore: cancelOrder - 买入委托单已撤销，退款', { 
        refundAmount,
        oldBalance: state.currentBalance,
        newBalance: updatedBalance
      });
    } else if (orderToCancel.type === 'sell') {
      // 卖出委托单：解冻持仓
      updatedPosition += orderToCancel.quantity;
      // 注意：卖出委托单只是冻结持仓，不涉及成本变化
      // 所以positionCost保持不变
      console.log('gameStore: cancelOrder - 卖出委托单已撤销，解冻持仓', { 
        unfrozenQuantity: orderToCancel.quantity,
        oldPosition: state.position,
        newPosition: updatedPosition,
        positionCost: updatedPositionCost // 保持成本不变
      });
    }

    const updatedOrders = state.orders.map(order =>
      order.id === orderId ? { ...order, status: 'cancelled' as OrderStatus } : order
    );

    console.log('gameStore: cancelOrder - 撤单完成，更新状态', {
      oldBalance: state.currentBalance,
      newBalance: updatedBalance,
      oldPosition: state.position,
      newPosition: updatedPosition,
      oldPositionCost: state.positionCost,
      newPositionCost: updatedPositionCost
    });

    set({ 
      orders: updatedOrders,
      currentBalance: updatedBalance,
      position: updatedPosition,
      positionCost: updatedPositionCost
    });
    return true;
  },

  getAvailableBalance: () => {
    const state = get();
    // 由于委托下单时已经直接扣款，所以可用余额就是当前余额
    return state.currentBalance;
  },

  getFrozenBalance: () => {
    const state = get();
    let frozenAmount = 0;
    
    // 计算所有待成交委托单的冻结资金（已经扣除的钱）
    state.orders.forEach(order => {
      if (order.status === 'pending' && order.type === 'buy') {
        const remainingQuantity = order.quantity - order.filledQuantity;
        const estimatedCost = order.price * remainingQuantity;
        const commission = Math.max(estimatedCost * TRADING_FEES.commissionRate, TRADING_FEES.minCommission);
        const transferFee = Math.max(estimatedCost * TRADING_FEES.transferFee, TRADING_FEES.minTransferFee);
        frozenAmount += estimatedCost + commission + transferFee;
      }
    });
    
    return frozenAmount;
  },

  getTotalFrozenPosition: () => {
    const state = get();
    let frozenPosition = 0;
    
    // 计算所有待成交卖出委托单的冻结持仓
    state.orders.forEach(order => {
      if (order.status === 'pending' && order.type === 'sell') {
        frozenPosition += order.quantity - order.filledQuantity;
      }
    });
    
    return frozenPosition;
  },

  processOrders: () => {
    const state = get();
    if (!state.currentETF) return;

    const currentPrice = state.getCurrentPrice();
    const currentData = state.currentETF.data[state.currentDataIndex];
    const logger = createLogger('processOrders');
    
    const pendingOrders = state.orders.filter(o => o.status === 'pending');
    if (pendingOrders.length > 0) {
      logger.log('开始处理委托单', { 
        currentPrice, 
        currentBalance: state.currentBalance,
        currentPosition: state.position,
        currentPositionCost: state.positionCost,
        pendingOrders: pendingOrders.length 
      });
    }

    // 先获取当前状态的快照
    let updatedBalance = state.currentBalance;
    let updatedPosition = state.position;
    let updatedPositionCost = state.positionCost;
    let updatedOrders = [...state.orders];
    let newTrades = [...state.trades];

    // 计算当前已冻结的持仓
    let frozenPosition = 0;
    state.orders.forEach(order => {
      if (order.status === 'pending' && order.type === 'sell') {
        frozenPosition += order.quantity - order.filledQuantity;
      }
    });
    const availablePosition = updatedPosition - frozenPosition;

    if (pendingOrders.length > 0) {
      logger.log('持仓状态', {
        totalPosition: updatedPosition,
        frozenPosition,
        availablePosition
      });
    }

    // 处理每个挂单
    updatedOrders = updatedOrders.map(order => {
      if (order.status !== 'pending') return order;

      let shouldFill = false;
      let actualPrice = currentPrice; // 实际成交价格
      
      // 买入单成交逻辑
      if (order.type === 'buy') {
        if (order.price >= currentPrice) {
          shouldFill = true;
          actualPrice = currentPrice;
          logger.log('买入单触发成交', { 
            orderId: order.id, 
            orderPrice: order.price, 
            currentPrice, 
            actualPrice,
            reason: '委托价 >= 当前价，以当前价成交'
          });
        }
      }
      
      // 卖出单成交逻辑
      if (order.type === 'sell') {
        if (order.price <= currentPrice) {
          shouldFill = true;
          actualPrice = currentPrice;
          logger.log('卖出单触发成交', { 
            orderId: order.id, 
            orderPrice: order.price, 
            currentPrice, 
            actualPrice,
            reason: '委托价 <= 当前价，以当前价成交'
          });
        }
      }

      if (shouldFill) {
        const fillQuantity = order.quantity - order.filledQuantity;
        
        if (order.type === 'buy') {
          const tradeAmount = fillQuantity * actualPrice;
          
          // 计算买入手续费
          const commission = Math.max(tradeAmount * TRADING_FEES.commissionRate, TRADING_FEES.minCommission);
          const transferFee = Math.max(tradeAmount * TRADING_FEES.transferFee, TRADING_FEES.minTransferFee);
          const totalFees = commission + transferFee;
          const totalCost = tradeAmount + totalFees;
          
          // 更新持仓
          const newPosition = updatedPosition + fillQuantity;
          const newPositionCost = updatedPositionCost + totalCost;
          
          console.log('processOrders: 买入单成交前', {
            orderId: order.id,
            currentBalance: updatedBalance,
            currentPosition: updatedPosition,
            currentPositionCost: updatedPositionCost,
            fillQuantity,
            totalCost
          });
          
          updatedPosition = newPosition;
          updatedPositionCost = newPositionCost;

          // 创建交易记录
          const newTrade: TradeRecord = {
            id: `trade_${Date.now()}`,
            type: 'buy',
            price: actualPrice,
            quantity: fillQuantity,
            amount: tradeAmount,
            fees: totalFees,
            timestamp: currentData ? currentData.time : '',
            dataIndex: state.currentDataIndex
          };
          newTrades.push(newTrade);

          console.log('=== 委托买入成交日志 ===');
          console.log('委托单ID: ' + order.id);
          console.log('委托价格: ¥' + order.price.toFixed(3));
          console.log('成交价格: ¥' + actualPrice.toFixed(3));
          console.log('成交数量: ' + fillQuantity + '股');
          console.log('交易金额: ¥' + tradeAmount.toFixed(2));
          console.log('手续费明细:');
          console.log('  - 佣金: ¥' + commission.toFixed(2) + ' (费率: ' + (TRADING_FEES.commissionRate * 100).toFixed(3) + '%)');
          console.log('  - 过户费: ¥' + transferFee.toFixed(2) + ' (费率: ' + (TRADING_FEES.transferFee * 100).toFixed(4) + '%)');
          console.log('总手续费: ¥' + totalFees.toFixed(2));
          console.log('总成本: ¥' + totalCost.toFixed(2));
          console.log('持仓变化:');
          console.log('  - 成交前持仓: ' + (updatedPosition - fillQuantity) + '股');
          console.log('  - 成交后持仓: ' + updatedPosition + '股');
          console.log('  - 持仓成本: ¥' + updatedPositionCost.toFixed(2));
          console.log('  - 平均成本: ¥' + (updatedPosition > 0 ? (updatedPositionCost / updatedPosition).toFixed(3) : '0.000'));
          console.log('成交时间: ' + (currentData ? currentData.time : ''));
          console.log('时间戳: ' + new Date().toISOString());
          console.log('========================');
          
          // 添加成交通知
          get().addNotification({
            type: 'success',
            title: '委托买入成交',
            message: `委托价 ¥${order.price.toFixed(3)}，成交价 ¥${actualPrice.toFixed(3)}，数量 ${fillQuantity}股`,
            duration: 500
          });
          
          return { ...order, status: 'filled' as OrderStatus, filledQuantity: order.quantity };
        } else if (order.type === 'sell') {
          // 对于卖出委托单，我们需要考虑冻结的持仓
          // 计算除当前委托单外的其他冻结持仓
          const otherFrozenPosition = frozenPosition - (order.quantity - order.filledQuantity);
          const availableForThisOrder = updatedPosition - otherFrozenPosition;
          
          console.log('processOrders: 卖出单持仓检查', {
            orderId: order.id,
            fillQuantity,
            totalPosition: updatedPosition,
            frozenPosition,
            otherFrozenPosition,
            availableForThisOrder
          });
          
          if (availableForThisOrder >= fillQuantity) {
            const tradeAmount = fillQuantity * actualPrice;
            
            // 计算卖出手续费
            const commission = Math.max(tradeAmount * TRADING_FEES.commissionRate, TRADING_FEES.minCommission);
            const stampTax = tradeAmount * TRADING_FEES.stampTaxRate;
            const transferFee = Math.max(tradeAmount * TRADING_FEES.transferFee, TRADING_FEES.minTransferFee);
            const totalFees = commission + stampTax + transferFee;
            const netAmount = tradeAmount - totalFees;
            
            // 正确的持仓成本计算：按比例减少成本，不进行盈亏分摊
            const oldAvgCost = updatedPosition > 0 ? updatedPositionCost / updatedPosition : 0;
            const newPosition = updatedPosition - fillQuantity;
            const soldCost = oldAvgCost * fillQuantity;
            
            // 亏损或盈利金额（仅用于显示和记录）
            const pnl = tradeAmount - soldCost;
            
            // 关键修正：剩余持仓成本按比例减少，不进行盈亏分摊
            const newPositionCost = updatedPositionCost - soldCost;
            
            console.log('processOrders: 卖出单成交前', {
              orderId: order.id,
              currentBalance: updatedBalance,
              currentPosition: updatedPosition,
              currentPositionCost: updatedPositionCost,
              oldAvgCost,
              fillQuantity,
              tradeAmount,
              totalFees,
              netAmount,
              soldCost,
              pnl,
              isLoss: pnl < 0
            });
            
            // 更新资金和持仓
            updatedBalance += netAmount;
            updatedPosition = newPosition;
            updatedPositionCost = newPositionCost;

            // 创建交易记录
            const newTrade: TradeRecord = {
              id: `trade_${Date.now()}`,
              type: 'sell',
              price: actualPrice,
              quantity: fillQuantity,
              amount: tradeAmount,
              fees: totalFees,
              timestamp: currentData ? currentData.time : '',
              dataIndex: state.currentDataIndex
            };
            newTrades.push(newTrade);

            const newAvgCost = newPosition > 0 ? newPositionCost / newPosition : 0;
            
            console.log('=== 委托卖出成交日志 ===');
            console.log('委托单ID: ' + order.id);
            console.log('委托价格: ¥' + order.price.toFixed(3));
            console.log('成交价格: ¥' + actualPrice.toFixed(3));
            console.log('成交数量: ' + fillQuantity + '股');
            console.log('交易金额: ¥' + tradeAmount.toFixed(2));
            console.log('手续费明细:');
            console.log('  - 佣金: ¥' + commission.toFixed(2) + ' (费率: ' + (TRADING_FEES.commissionRate * 100).toFixed(3) + '%)');
            console.log('  - 印花税: ¥' + stampTax.toFixed(2) + ' (费率: ' + (TRADING_FEES.stampTaxRate * 100).toFixed(3) + '%)');
            console.log('  - 过户费: ¥' + transferFee.toFixed(2) + ' (费率: ' + (TRADING_FEES.transferFee * 100).toFixed(4) + '%)');
            console.log('总手续费: ¥' + totalFees.toFixed(2));
            console.log('实际到账: ¥' + netAmount.toFixed(2));
            console.log('持仓变化:');
            console.log('  - 成交前持仓: ' + (updatedPosition + fillQuantity) + '股');
            console.log('  - 成交后持仓: ' + updatedPosition + '股');
            console.log('  - 原持仓成本: ¥' + (updatedPositionCost + soldCost).toFixed(2));
            console.log('  - 原平均成本: ¥' + oldAvgCost.toFixed(3));
            console.log('  - 新持仓成本: ¥' + newPositionCost.toFixed(2));
            console.log('  - 新平均成本: ¥' + newAvgCost.toFixed(3));
            console.log('盈亏分析:');
            console.log('  - 卖出成本: ¥' + soldCost.toFixed(2));
            console.log('  - 盈亏金额: ¥' + pnl.toFixed(2) + ' (' + (pnl >= 0 ? '盈利' : '亏损') + ')');
            if (newPosition > 0) {
              console.log('  - 成本说明: 剩余持仓成本保持不变，按比例减少总成本');
              console.log('  - 成本原则: 不进行盈亏分摊，保持成本独立性');
            }
            console.log('资金变化:');
            console.log('  - 成交前余额: ¥' + (updatedBalance - netAmount).toFixed(2));
            console.log('  - 成交后余额: ¥' + updatedBalance.toFixed(2));
            console.log('  - 增加金额: ¥' + netAmount.toFixed(2));
            console.log('成交时间: ' + (currentData ? currentData.time : ''));
            console.log('时间戳: ' + new Date().toISOString());
            console.log('========================');
            
            // 添加成交通知
            get().addNotification({
              type: 'success',
              title: '委托卖出成交',
              message: `委托价 ¥${order.price.toFixed(3)}，成交价 ¥${actualPrice.toFixed(3)}，数量 ${fillQuantity}股`,
              duration: 500
            });
            
            return { ...order, status: 'filled' as OrderStatus, filledQuantity: order.quantity };
          } else {
            console.log('processOrders: 卖出单持仓不足', {
              orderId: order.id,
              fillQuantity,
              totalPosition: updatedPosition,
              frozenPosition,
              availablePosition: availablePosition,
              availableForThisOrder
            });
          }
        }
      }

      return order;
    });

    if (pendingOrders.length > 0) {
      logger.log('处理完成，更新状态', {
        newBalance: updatedBalance,
        newPosition: updatedPosition,
        newPositionCost: updatedPositionCost
      });
    }

    set({
      orders: updatedOrders,
      trades: newTrades,
      currentBalance: updatedBalance,
      position: updatedPosition,
      positionCost: updatedPositionCost
    });
  }
}));
