/**
 * 股票数据API服务
 * 使用本地JSON文件数据
 */
import { KLineData, StockInfo } from '../types/game';

export interface StockData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockFileData {
  code: string;
  name: string;
  market: string;
  data: StockData[];
  update_time: string;
  data_count: number;
}

export interface StockListResponse {
  stocks: StockInfo[];
  update_time: string;
  data_source: string;
  total_count: number;
}

export interface StockApiService {
  getStockData: (stockCode: string, startDate: string, endDate?: string) => Promise<KLineData[]>;
  getRandomStock: () => StockInfo;
  getRandomStockData: (startDate: string, endDate?: string) => Promise<{ stock: StockInfo; data: KLineData[] } | null>;
}

class StockApiServiceImpl implements StockApiService {
  private stockList: StockInfo[] = [];
  private initialized = false;

  /**
   * 初始化，加载股票列表
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const response = await fetch('/data/stock-list.json');
      if (response.ok) {
        const stockListData: StockListResponse = await response.json();
        this.stockList = stockListData.stocks;
        this.initialized = true;
        console.log(`Loaded ${this.stockList.length} stocks from local data`);
      }
    } catch (error) {
      console.error('Failed to load stock list:', error);
      // 如果加载失败，使用默认列表
      this.stockList = [
        { code: '600519', name: '贵州茅台', market: 'sh' },
        { code: '000001', name: '平安银行', market: 'sz' },
        { code: '002594', name: '比亚迪', market: 'sz' },
        { code: '300750', name: '宁德时代', market: 'sz' },
        { code: '601318', name: '中国平安', market: 'sh' }
      ];
      this.initialized = true;
    }
  }

  /**
   * 获取股票日K线数据
   * @param stockCode 股票代码
   * @param startDate 开始日期，格式：YYYY-MM-DD
   * @param endDate 结束日期，格式：YYYY-MM-DD（可选）
   * @returns K线数据数组
   */
  async getStockData(stockCode: string, startDate: string, endDate?: string): Promise<KLineData[]> {
    try {
      const response = await fetch(`/data/stocks/${stockCode}.json`);
      
      if (!response.ok) {
        console.warn(`No data found for stock: ${stockCode}`);
        return [];
      }

      const stockData: StockFileData = await response.json();
      
      if (!stockData.data || stockData.data.length === 0) {
        console.warn(`Empty data for stock: ${stockCode}`);
        return [];
      }

      // 过滤日期范围
      let filteredData = stockData.data;
      
      if (startDate) {
        const start = new Date(startDate);
        filteredData = filteredData.filter(item => new Date(item.time) >= start);
      }
      
      if (endDate) {
        const end = new Date(endDate);
        filteredData = filteredData.filter(item => new Date(item.time) <= end);
      }

      // 转换为KLineData格式
      return filteredData.map(item => ({
        time: item.time,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume
      }));

    } catch (error) {
      console.error(`Error loading stock data for ${stockCode}:`, error);
      return [];
    }
  }

  /**
   * 获取随机股票
   * @returns 随机股票信息
   */
  getRandomStock(): StockInfo {
    if (!this.initialized) {
      // 同步初始化，避免async问题
      this.initializeSync();
    }
    
    if (this.stockList.length === 0) {
      return { code: '600519', name: '贵州茅台', market: 'sh' };
    }
    
    const randomIndex = Math.floor(Math.random() * this.stockList.length);
    return this.stockList[randomIndex];
  }

  /**
   * 同步初始化（用于getRandomStock）
   */
  private initializeSync(): void {
    if (this.initialized) return;
    
    // 使用默认股票列表
    this.stockList = [
      { code: '600519', name: '贵州茅台', market: 'sh' },
      { code: '000001', name: '平安银行', market: 'sz' },
      { code: '002594', name: '比亚迪', market: 'sz' },
      { code: '300750', name: '宁德时代', market: 'sz' },
      { code: '601318', name: '中国平安', market: 'sh' },
      { code: '600036', name: '招商银行', market: 'sh' },
      { code: '000858', name: '五粮液', market: 'sz' },
      { code: '002415', name: '海康威视', market: 'sz' }
    ];
    this.initialized = true;
  }

  /**
   * 获取随机股票数据
   * @param startDate 开始日期
   * @param endDate 结束日期（可选）
   * @returns 股票数据和K线数据
   */
  async getRandomStockData(startDate: string, endDate?: string): Promise<{ stock: StockInfo; data: KLineData[] } | null> {
    await this.initialize();
    
    if (this.stockList.length === 0) {
      console.error('No stocks available');
      return null;
    }

    // 随机选择一只股票
    const randomStock = this.getRandomStock();
    const data = await this.getStockData(randomStock.code, startDate, endDate);
    
    if (data.length === 0) {
      console.warn(`No data found for stock: ${randomStock.code}`);
      return null;
    }

    return { stock: randomStock, data };
  }

  /**
   * 获取所有可用的股票列表
   * @returns 股票列表
   */
  async getAllStocks(): Promise<StockInfo[]> {
    await this.initialize();
    return [...this.stockList];
  }
}

// 导出单例实例
export const stockApiService = new StockApiServiceImpl();
