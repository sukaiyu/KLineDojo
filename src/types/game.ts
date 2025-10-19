// K线数据类型
export interface KLineData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// 股票信息
export interface StockInfo {
  code: string;
  name: string;
  market: string;
}

// ETF信息（保持向后兼容）
export interface ETFInfo {
  code: string;
  name: string;
  market?: string; // 添加可选的market属性
  data: KLineData[];
}

// 游戏状态
export interface GameState {
  // 游戏基本信息
  isPlaying: boolean;
  isPaused: boolean;
  gameSpeed: number; // 1x, 2x, 4x
  
  // 当前选择的ETF
  currentETF: ETFInfo | null;
  currentDataIndex: number;
  totalDataCount: number;
  
  // 玩家账户信息
  initialBalance: number;
  currentBalance: number;
  position: number; // 持仓数量
  positionCost: number; // 持仓成本
  
  // 交易记录
  trades: TradeRecord[];
  
  // 委托单
  orders: Order[];
  
  // 游戏进度
  gameProgress: number; // 0-100
  remainingTime: number; // 剩余K线数量
  
  // 游戏结果
  gameResult: GameResult | null;
  
  // 交易状态
  isTrading: boolean; // 是否正在交易（下单时暂停时间）
}

// 交易记录
export interface TradeRecord {
  id: string;
  type: 'buy' | 'sell';
  price: number;
  quantity: number;
  amount: number; // 交易金额（不含手续费）
  fees?: number;  // 手续费
  timestamp: string;
  dataIndex: number;
}

// 委托单状态
export type OrderStatus = 'pending' | 'filled' | 'cancelled';

// 委托单类型
export type OrderType = 'buy' | 'sell';

// 委托单
export interface Order {
  id: string;
  type: OrderType;
  price: number;
  quantity: number;
  filledQuantity: number;
  status: OrderStatus;
  timestamp: string;
  dataIndex: number;
}

// 游戏结果
export interface GameResult {
  finalBalance: number;
  totalReturn: number;
  returnRate: number;
  maxDrawdown: number;
  tradeCount: number;
  winRate: number;
  score: number;
  duration: number;
}

// 游戏配置
export interface GameConfig {
  initialBalance: number;
  gameDuration: number; // 游戏持续的K线数量
  speedOptions: number[];
}

// K线图配置
export interface ChartConfig {
  width: number;
  height: number;
  layout: {
    background: {
      type: string;
      color: string;
    };
    textColor: string;
  };
  grid: {
    vertLines: {
      color: string;
    };
    horzLines: {
      color: string;
    };
  };
  crosshair: {
    mode: number;
  };
  rightPriceScale: {
    borderColor: string;
  };
  timeScale: {
    borderColor: string;
    timeVisible: boolean;
    secondsVisible: boolean;
  };
}
