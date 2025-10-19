/**
 * 数据加载器
 * 负责加载和管理股票数据
 */
import { stockApiService } from '../services/stockApi';
import { StockInfo, KLineData } from '../types/game';

// 游戏配置
export const GAME_CONFIG = {
  // 游戏时长：1年（约252个交易日）
  GAME_DURATION_DAYS: 252,
  // 初始资金
  INITIAL_BALANCE: 100000,
  // 交易手续费率
  TRANSACTION_FEE_RATE: 0.0003,
  // 最小交易金额
  MIN_TRANSACTION_AMOUNT: 1000
};

/**
 * 准备游戏数据
 * @returns 游戏数据
 */
export async function prepareGameData(): Promise<{
  stock: StockInfo;
  startIndex: number;
  data: KLineData[];
} | null> {
  try {
    // 计算日期范围
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - 2); // 2年前，确保有足够数据

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // 获取随机股票数据
    const result = await stockApiService.getRandomStockData(startDateStr, endDateStr);
    
    if (!result || result.data.length < GAME_CONFIG.GAME_DURATION_DAYS) {
      throw new Error('Insufficient data for game');
    }

    // 随机选择开始位置，确保有足够的数据进行游戏
    const maxStartIndex = result.data.length - GAME_CONFIG.GAME_DURATION_DAYS;
    const startIndex = Math.floor(Math.random() * maxStartIndex);

    console.log(`Game data prepared: ${result.stock.name} (${result.stock.code})`);
    console.log(`Data range: ${result.data[startIndex].time} to ${result.data[startIndex + GAME_CONFIG.GAME_DURATION_DAYS - 1].time}`);
    console.log(`Total data points: ${result.data.length}, Game will use: ${GAME_CONFIG.GAME_DURATION_DAYS}`);

    return {
      stock: result.stock,
      startIndex,
      data: result.data
    };

  } catch (error) {
    console.error('Failed to prepare game data:', error);
    return null;
  }
}

/**
 * 加载特定股票的数据
 * @param stockCode 股票代码
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @returns 股票数据
 */
export async function loadStockData(
  stockCode: string,
  startDate: string,
  endDate?: string
): Promise<KLineData[]> {
  try {
    return await stockApiService.getStockData(stockCode, startDate, endDate);
  } catch (error) {
    console.error(`Failed to load stock data for ${stockCode}:`, error);
    return [];
  }
}

/**
 * 获取所有可用的股票列表
 * @returns 股票列表
 */
export async function getAvailableStocks(): Promise<StockInfo[]> {
  try {
    return await stockApiService.getAllStocks();
  } catch (error) {
    console.error('Failed to get available stocks:', error);
    return [];
  }
}

/**
 * 格式化时间显示
 */
export function formatTime(timeStr: string): string {
  try {
    const date = new Date(timeStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch {
    return timeStr;
  }
}

/**
 * 计算价格变化
 */
export function calculatePriceChange(current: number, previous: number): {
  change: number;
  changePercent: number;
  isUp: boolean;
} {
  const change = current - previous;
  const changePercent = previous === 0 ? 0 : (change / previous) * 100;
  return {
    change,
    changePercent,
    isUp: change >= 0
  };
}

/**
 * 获取股票的中文市场名称
 */
export function getMarketName(market: string): string {
  switch (market) {
    case 'sh': return '上海证券交易所';
    case 'sz': return '深圳证券交易所';
    default: return '未知市场';
  }
}

/**
 * 生成股票的完整显示名称
 */
export function getStockDisplayName(stock: StockInfo): string {
  const marketName = getMarketName(stock.market);
  return `${stock.name} (${stock.code}.${marketName})`;
}
