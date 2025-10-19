import React, { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, HistogramData, LineData, Time } from 'lightweight-charts';
import { useGameStore } from '../stores/gameStore';
import { KLineData } from '../types/game';
import { formatTime } from '../utils/dataLoader';
import { KLineNotificationContainer } from './Notification';

// 日志配置
const LOG_CONFIG = {
  enabled: {
    costLine: false, // 关闭成本线日志以减少冗余
    chartUpdate: false,
  },
  level: 'info' as 'debug' | 'info' | 'warn' | 'error'
};

// 日志工具函数
const createLogger = (category: keyof typeof LOG_CONFIG.enabled) => {
  return {
    log: (message: string, data?: any) => {
      if (LOG_CONFIG.enabled[category]) {
        console.log(`KLineChart.${category}: ${message}`, data || '');
      }
    },
    warn: (message: string, data?: any) => {
      if (LOG_CONFIG.enabled[category]) {
        console.warn(`KLineChart.${category}: ${message}`, data || '');
      }
    },
    error: (message: string, data?: any) => {
      if (LOG_CONFIG.enabled[category]) {
        console.error(`KLineChart.${category}: ${message}`, data || '');
      }
    }
  };
};

interface KLineChartProps {
  width?: number;
  height?: number;
}

export const KLineChart: React.FC<KLineChartProps> = ({ 
  width = 800, 
  height = 400
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const volumeChartRef = useRef<HTMLDivElement>(null);
  
  const chartRef = useRef<IChartApi | null>(null);
  const volumeChartRef_api = useRef<IChartApi | null>(null);
  
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const costLineSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const buyOrderLineSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const sellOrderLineSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  
  // 时间轴订阅引用
  const mainTimeScaleSubscribeRef = useRef<any>(null);
  
  // 跟踪用户是否正在手动查看历史数据
  const lastScrollPositionRef = useRef<number | null>(null);
  
  const {
    currentETF,
    currentDataIndex,
    isPlaying,
    isPaused,
    // gameSpeed,
    trades,
    position,
    positionCost,
    orders,
    notifications,
    removeNotification
  } = useGameStore();

  // 初始化K线图表
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // 创建K线图表 (占50%高度)
    const chart = createChart(chartContainerRef.current, {
      width,
      height: height * 0.5,
      layout: {
        background: { color: '#161b22' },
        textColor: '#c9d1d9',
      },
      grid: {
        vertLines: { color: '#30363d' },
        horzLines: { color: '#30363d' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#30363d',
      },
      timeScale: {
        borderColor: '#30363d',
        timeVisible: true,
        secondsVisible: false,
      },
      // 启用缩放和平移
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
      // 隐藏TradingView水印和链接
      // attributionLogo: false, // 移除不支持的属性
      // 禁用水印点击事件
      // event: {
      //   click: false,
      // },
    });

    // 添加K线系列
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#ef4444',
      downColor: '#22c55e',
      borderDownColor: '#22c55e',
      borderUpColor: '#ef4444',
      wickDownColor: '#22c55e',
      wickUpColor: '#ef4444',
    });

    // 添加成本线系列
    const costLineSeries = chart.addLineSeries({
      color: '#8b5cf6', // 紫色
      lineWidth: 2,
      lineStyle: 2, // 虚线
      title: '成本线',
    });

    // 添加买入委托价线系列
    const buyOrderLineSeries = chart.addLineSeries({
      color: '#22c55e', // 绿色
      lineWidth: 2,
      lineStyle: 3, // 点线
      title: '买入委托价',
    });

    // 添加卖出委托价线系列
    const sellOrderLineSeries = chart.addLineSeries({
      color: '#ef4444', // 红色
      lineWidth: 2,
      lineStyle: 3, // 点线
      title: '卖出委托价',
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;
    costLineSeriesRef.current = costLineSeries;
    buyOrderLineSeriesRef.current = buyOrderLineSeries;
    sellOrderLineSeriesRef.current = sellOrderLineSeries;

    // 响应式调整
    const handleResize = () => {
      if (chartContainerRef.current) {
        const containerWidth = chartContainerRef.current.clientWidth;
        chart.applyOptions({ width: containerWidth });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [height]);

  // 初始化成交量图表
  useEffect(() => {
    if (!volumeChartRef.current || !chartRef.current) return;

    // 创建成交量图表 (占25%高度)，使用主图表的时间轴
    const volumeChart = createChart(volumeChartRef.current, {
      width,
      height: height * 0.25,
      layout: {
        background: { color: '#161b22' },
        textColor: '#c9d1d9',
      },
      grid: {
        vertLines: { color: '#30363d' },
        horzLines: { color: '#30363d' },
      },
      rightPriceScale: {
        borderColor: '#30363d',
      },
      timeScale: {
        borderColor: '#30363d',
        timeVisible: true,
        secondsVisible: false,
      },
      // 禁用独立的缩放和平移，将使用主图表的时间轴
      handleScroll: {
        mouseWheel: false,
        pressedMouseMove: false,
        horzTouchDrag: false,
        vertTouchDrag: false,
      },
      handleScale: {
        axisPressedMouseMove: false,
        mouseWheel: false,
        pinch: false,
      },
      // 隐藏TradingView水印和链接
      // attributionLogo: false, // 移除不支持的属性
      // 禁用水印点击事件
      // event: {
      //   click: false,
      // },
    });

    // 添加成交量系列
    const volumeSeries = volumeChart.addHistogramSeries({
      color: '#6b7280',
      priceFormat: {
        type: 'volume',
      },
    });

    volumeChartRef_api.current = volumeChart;
    volumeSeriesRef.current = volumeSeries;

    // 响应式调整
    const handleResize = () => {
      if (volumeChartRef.current) {
        const containerWidth = volumeChartRef.current.clientWidth;
        volumeChart.applyOptions({ width: containerWidth });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      volumeChart.remove();
    };
  }, [height]);



  // 更新图表数据
  useEffect(() => {
    if (!currentETF || !seriesRef.current) return;

    // 游戏从第26根K线开始，但显示所有数据（包括历史背景）
    const endIndex = Math.min(currentDataIndex + 1, currentETF.data.length);
    const startIndex = 0; // 显示所有数据，包括历史背景
    
    const visibleData = currentETF.data.slice(startIndex, endIndex);
    
    const candlestickData: CandlestickData[] = visibleData.map((item: KLineData) => {
      // 转换时间格式为lightweight-charts需要的格式
      let timeValue: Time;
      try {
        // 尝试解析时间字符串
        const date = new Date(item.time);
        if (isNaN(date.getTime())) {
          // 如果解析失败，使用原始字符串
          timeValue = item.time as Time;
        } else {
          // 转换为Unix时间戳（秒）
          timeValue = Math.floor(date.getTime() / 1000) as Time;
        }
      } catch {
        timeValue = item.time as Time;
      }
      
      return {
        time: timeValue,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
      };
    });

    // 更新K线数据
    if (seriesRef.current) {
      seriesRef.current.setData(candlestickData);
      
      // 添加游戏开始标记和历史数据标记
      const gameStartIndex = 26; // 游戏实际开始位置
      
      // 创建标记数组
      const allMarkers = [];
      
      // 为历史数据添加灰色背景标记（每5根K线添加一个标记，避免过于密集）
      for (let i = 0; i < gameStartIndex && i < visibleData.length; i += 5) {
        const klineData = visibleData[i];
        if (!klineData) continue;
        
        let timeValue: Time;
        try {
          const date = new Date(klineData.time);
          if (isNaN(date.getTime())) {
            timeValue = klineData.time as Time;
          } else {
            timeValue = Math.floor(date.getTime() / 1000) as Time;
          }
        } catch {
          timeValue = klineData.time as Time;
        }
        
        // 历史数据标记
        allMarkers.push({
          time: timeValue,
          position: 'belowBar' as const,
          color: 'rgba(156, 163, 175, 0.3)',
          shape: 'circle' as const,
          text: '',
        });
      }
      
      // 添加游戏开始标记
      if (gameStartIndex < visibleData.length) {
        const gameStartData = visibleData[gameStartIndex];
        if (gameStartData) {
          let timeValue: Time;
          try {
            const date = new Date(gameStartData.time);
            if (isNaN(date.getTime())) {
              timeValue = gameStartData.time as Time;
            } else {
              timeValue = Math.floor(date.getTime() / 1000) as Time;
            }
          } catch {
            timeValue = gameStartData.time as Time;
          }
          
          allMarkers.push({
            time: timeValue,
            position: 'aboveBar' as const,
            color: '#3b82f6',
            shape: 'arrowUp' as const,
            text: '游戏开始',
          });
        }
      }
      
      // 添加买入卖出标记
      const tradeMarkers = trades.map(trade => {
        // 检查交易是否在当前可见范围内
        if (trade.dataIndex < startIndex || trade.dataIndex >= endIndex) return null;
        
        const tradeData = currentETF.data[trade.dataIndex];
        if (!tradeData) return null;

        const timeValue = (() => {
          try {
            const date = new Date(tradeData.time);
            if (isNaN(date.getTime())) {
              return tradeData.time as Time;
            } else {
              return Math.floor(date.getTime() / 1000) as Time;
            }
          } catch {
            return tradeData.time as Time;
          }
        })();

        return {
          time: timeValue,
          position: trade.type === 'buy' ? 'belowBar' as const : 'aboveBar' as const,
          color: trade.type === 'buy' ? '#22c55e' : '#ef4444',
          shape: trade.type === 'buy' ? 'arrowUp' as const : 'arrowDown' as const,
          text: trade.type === 'buy' ? 'B' : 'S',
        };
      }).filter((marker): marker is Exclude<typeof marker, null> => marker !== null);

      // 合并所有标记
      allMarkers.push(...tradeMarkers);
      if (allMarkers.length > 0) {
        seriesRef.current.setMarkers(allMarkers);
      }

      // 智能自动滚动：游戏开始时显示包含历史数据的合适范围，游戏进行时跟随当前数据
      if (chartRef.current) {
        const timeScale = chartRef.current.timeScale();
        
        try {
          // 获取当前可见的逻辑范围
          const visibleRange = timeScale.getVisibleLogicalRange();
          
          if (visibleRange) {
            const totalBars = currentETF.data.length;
            
            // 计算默认显示范围（显示大约120根K线，包含历史背景）
            const defaultVisibleBars = 120;
            
            // 检查用户是否在查看最新数据
            const isAtLatestPosition = visibleRange.to >= totalBars - 5;
            
            // 如果是第一次加载，设置合适的显示范围
            if (lastScrollPositionRef.current === null) {
              // 显示从游戏开始前一个月到当前的数据
              const displayStartIndex = Math.max(0, gameStartIndex - 30); // 游戏开始前30根K线
              const displayEndIndex = Math.min(totalBars - 1, gameStartIndex + 90); // 游戏开始后90根K线
              
              timeScale.setVisibleLogicalRange({
                from: displayStartIndex,
                to: displayEndIndex
              });
            } else if (isAtLatestPosition && isPlaying) {
              // 游戏进行中且用户在查看最新数据：跟随最新数据，但保持历史背景可见
              const currentDisplayEnd = endIndex;
              const currentDisplayStart = Math.max(0, currentDisplayEnd - defaultVisibleBars);
              
              timeScale.setVisibleLogicalRange({
                from: currentDisplayStart,
                to: currentDisplayEnd
              });
            }
            
            lastScrollPositionRef.current = visibleRange.to;
          }
        } catch (error) {
          // 如果获取范围失败，默认滚动到游戏开始位置附近
          console.warn('获取时间轴范围失败，使用默认滚动:', error);
          const displayStartIndex = Math.max(0, gameStartIndex - 30);
          const displayEndIndex = Math.min(currentETF.data.length - 1, gameStartIndex + 90);
          
          timeScale.setVisibleLogicalRange({
            from: displayStartIndex,
            to: displayEndIndex
          });
        }
      }
    }

    // 更新成交量数据
    if (volumeSeriesRef.current) {
      const volumeData: HistogramData[] = visibleData.map((item: KLineData) => {
        let timeValue: Time;
        try {
          const date = new Date(item.time);
          if (isNaN(date.getTime())) {
            timeValue = item.time as Time;
          } else {
            timeValue = Math.floor(date.getTime() / 1000) as Time;
          }
        } catch {
          timeValue = item.time as Time;
        }
        
        return {
          time: timeValue,
          value: item.volume,
          color: item.close >= item.open ? '#ef4444' : '#22c55e',
        };
      });
      
      volumeSeriesRef.current.setData(volumeData);
      
      // 成交量图跟随主图，不需要独立滚动
    }


    // 更新成本线 - 修复撤单后的Y轴问题
    if (costLineSeriesRef.current) {
      if (position > 0 && positionCost > 0) {
        const avgCost = positionCost / position;
        
        // 确保成本是有效的数值
        if (!isNaN(avgCost) && isFinite(avgCost) && avgCost > 0) {
          const costLineData: LineData[] = visibleData.map((item: KLineData) => {
            let timeValue: Time;
            try {
              const date = new Date(item.time);
              if (isNaN(date.getTime())) {
                timeValue = item.time as Time;
              } else {
                timeValue = Math.floor(date.getTime() / 1000) as Time;
              }
            } catch {
              timeValue = item.time as Time;
            }
            
            return {
              time: timeValue,
              value: avgCost,
            };
          });
          
          costLineSeriesRef.current.setData(costLineData);
          const logger = createLogger('costLine');
          logger.log('成本线已更新', { avgCost, position, positionCost });
        } else {
          // 成本计算异常，清空成本线
          costLineSeriesRef.current.setData([]);
          const logger = createLogger('costLine');
          logger.warn('成本计算异常，清空成本线', { avgCost, position, positionCost });
        }
      } else {
        // 没有持仓或成本为0，清空成本线
        costLineSeriesRef.current.setData([]);
        const logger = createLogger('costLine');
        logger.log('无持仓，清空成本线', { position, positionCost });
      }
    }

    // 更新委托买卖价线
    const pendingOrders = orders.filter(order => order.status === 'pending');
    const buyOrders = pendingOrders.filter(order => order.type === 'buy');
    const sellOrders = pendingOrders.filter(order => order.type === 'sell');

    // 更新买入委托价线（显示最高买入价）
    if (buyOrderLineSeriesRef.current && buyOrders.length > 0) {
      const maxBuyPrice = Math.max(...buyOrders.map(order => order.price));
      const buyOrderLineData: LineData[] = visibleData.map((item: KLineData) => {
        let timeValue: Time;
        try {
          const date = new Date(item.time);
          if (isNaN(date.getTime())) {
            timeValue = item.time as Time;
          } else {
            timeValue = Math.floor(date.getTime() / 1000) as Time;
          }
        } catch {
          timeValue = item.time as Time;
        }
        
        return {
          time: timeValue,
          value: maxBuyPrice,
        };
      });
      
      buyOrderLineSeriesRef.current.setData(buyOrderLineData);
    } else if (buyOrderLineSeriesRef.current && buyOrders.length === 0) {
      // 清空买入委托价线
      buyOrderLineSeriesRef.current.setData([]);
    }

    // 更新卖出委托价线（显示最低卖出价）
    if (sellOrderLineSeriesRef.current && sellOrders.length > 0) {
      const minSellPrice = Math.min(...sellOrders.map(order => order.price));
      const sellOrderLineData: LineData[] = visibleData.map((item: KLineData) => {
        let timeValue: Time;
        try {
          const date = new Date(item.time);
          if (isNaN(date.getTime())) {
            timeValue = item.time as Time;
          } else {
            timeValue = Math.floor(date.getTime() / 1000) as Time;
          }
        } catch {
          timeValue = item.time as Time;
        }
        
        return {
          time: timeValue,
          value: minSellPrice,
        };
      });
      
      sellOrderLineSeriesRef.current.setData(sellOrderLineData);
    } else if (sellOrderLineSeriesRef.current && sellOrders.length === 0) {
      // 清空卖出委托价线
      sellOrderLineSeriesRef.current.setData([]);
    }
  }, [currentETF, currentDataIndex, trades, position, positionCost, orders]);

  // 时间轴同步功能
  useEffect(() => {
    if (!chartRef.current || !volumeChartRef_api.current) return;

    const mainChart = chartRef.current;
    const volumeChart = volumeChartRef_api.current;

    // 同步时间轴变化的函数
    const syncTimeScale = () => {
      const mainTimeScale = mainChart.timeScale();
      const volumeTimeScale = volumeChart.timeScale();

      // 获取主图表的时间范围
      const timeRange = mainTimeScale.getVisibleLogicalRange();
      if (timeRange) {
        // 同步到成交量图表
        volumeTimeScale.setVisibleLogicalRange(timeRange);
      }
    };

    // 监听主图表的时间轴变化
    const handleTimeScaleChange = () => {
      syncTimeScale();
    };

    // 订阅主图表的时间轴事件
    try {
      mainChart.timeScale().subscribeVisibleTimeRangeChange(handleTimeScaleChange);
      mainChart.timeScale().subscribeVisibleLogicalRangeChange(handleTimeScaleChange);
      
      // 简化存储，lightweight-charts会自动管理订阅
      mainTimeScaleSubscribeRef.current = null;
    } catch (error) {
      console.warn('订阅时间轴事件时出错:', error);
      mainTimeScaleSubscribeRef.current = null;
    }

    // 初始同步
    syncTimeScale();

    return () => {
      // lightweight-charts会自动清理订阅
    };
  }, []);


  // 隐藏TradingView水印的CSS样式
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      /* 隐藏TradingView水印 */
      .tv-watermark,
      .tv-watermark__source,
      .tv-watermark__link,
      a[href*="tradingview"],
      [data-layer*="watermark"],
      .chart-container .tv-watermark,
      .chart-container a[href*="tradingview"] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
      
      /* 隐藏可能的水印相关元素 */
      div[class*="watermark"],
      div[class*="attribution"],
      div[class*="branding"],
      span[class*="watermark"],
      span[class*="attribution"] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // 触摸手势支持
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const container = chartContainerRef.current;
    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!chartRef.current) return;
      
      const touchX = e.touches[0].clientX;
      const touchY = e.touches[0].clientY;
      const deltaX = touchX - touchStartX;
      const deltaY = touchY - touchStartY;

      // 如果是水平滑动，阻止默认行为
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        e.preventDefault();
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  // 获取当前价格信息
  const getCurrentPriceInfo = () => {
    if (!currentETF || currentDataIndex >= currentETF.data.length) {
      return null;
    }

    const current = currentETF.data[currentDataIndex];
    const previous = currentDataIndex > 0 ? currentETF.data[currentDataIndex - 1] : current;
    
    const change = current.close - previous.close;
    const changePercent = previous.close > 0 ? (change / previous.close) * 100 : 0;
    const isUp = change >= 0;

    return {
      price: current.close,
      change,
      changePercent,
      isUp,
      time: formatTime(current.time),
      volume: current.volume
    };
  };

  const priceInfo = getCurrentPriceInfo();

  return (
    <div className="kline-container p-4 relative">
      {/* K线图通知容器 */}
      <KLineNotificationContainer 
        notifications={notifications}
        onClose={removeNotification}
      />

      {/* 价格信息 */}
      {priceInfo && (
        <div className="mb-4 flex flex-wrap items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <span className="text-gray-400 text-sm">当前价格</span>
              <div className={`text-2xl font-bold ${priceInfo.isUp ? 'price-up' : 'price-down'}`}>
                ¥{priceInfo.price.toFixed(3)}
              </div>
            </div>
            <div>
              <span className="text-gray-400 text-sm">涨跌</span>
              <div className={`text-lg font-semibold ${priceInfo.isUp ? 'price-up' : 'price-down'}`}>
                {priceInfo.isUp ? '+' : ''}{priceInfo.change.toFixed(3)} 
                ({priceInfo.isUp ? '+' : ''}{priceInfo.changePercent.toFixed(2)}%)
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-gray-400 text-sm">{priceInfo.time}</div>
            <div className="text-sm">成交量: {priceInfo.volume.toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* K线图容器 */}
      <div className="mb-2 relative">
        <div className="text-sm text-gray-400 mb-1">K线图</div>
        <div
          ref={chartContainerRef}
          className="w-full border border-gray-700 rounded"
          style={{ height: `${height * 0.5}px` }}
        />
        
        {/* 暂停状态常驻悬浮提示 */}
        {isPlaying && isPaused && (
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-yellow-600 bg-opacity-90 text-white px-4 py-2 rounded-lg shadow-lg z-10 flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="font-medium">游戏已暂停</span>
            <span className="text-sm opacity-75">(按→键或点击下一日继续)</span>
          </div>
        )}
      </div>

      {/* 成交量图容器 */}
      <div className="mb-2">
        <div className="text-sm text-gray-400 mb-1 flex items-center">
          <div className="w-3 h-3 bg-gray-500 mr-1"></div>
          成交量
        </div>
        <div
          ref={volumeChartRef}
          className="w-full border border-gray-700 rounded"
          style={{ height: `${height * 0.25}px` }}
        />
      </div>


    </div>
  );
};
