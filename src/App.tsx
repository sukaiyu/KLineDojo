import { useState, useEffect, useCallback } from 'react';
import { KLineChart } from './components/KLineChart';
import { GamePanel } from './components/GamePanel';
import { GameControls } from './components/GameControls';
import { AccountInfo } from './components/AccountInfo';
import { TradeButtons } from './components/TradeButtons';
import { OrderPanel } from './components/OrderPanel';
import { GameResult } from './components/GameResult';
import { useGameStore } from './stores/gameStore';
import { prepareGameData } from './utils/dataLoader';
import { ETFInfo } from './types/game';

function App() {
  // const [etfData, setEtfData] = useState<ETFInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  const {
    isPlaying,
    isPaused,
    gameSpeed,
    nextKLine,
    resetGame,
    gameResult,
    // notifications,
    // removeNotification
  } = useGameStore();

  // 初始化（不再需要预加载数据）
  useEffect(() => {
    setLoading(false);
  }, []);

  // 游戏循环
  useEffect(() => {
    console.log('游戏循环useEffect触发:', { isPlaying, isPaused, gameSpeed });
    
    if (!isPlaying || isPaused) {
      console.log('游戏循环暂停:', { isPlaying, isPaused });
      return;
    }

    console.log('开始游戏循环，间隔:', 1000 / gameSpeed);
    const interval = setInterval(() => {
      console.log('执行nextKLine');
      nextKLine();
    }, 1000 / gameSpeed); // 根据游戏速度调整间隔

    return () => {
      console.log('清除游戏循环');
      clearInterval(interval);
    };
  }, [isPlaying, isPaused, gameSpeed, nextKLine]);

  // 显示消息
  const showMessage = useCallback((text: string, type: 'success' | 'error' | 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  }, []);

  // 开始游戏
  const handleStartGame = useCallback(async () => {
    try {
      showMessage('正在加载股票数据...', 'info');
      
      const gameData = await prepareGameData();
      if (!gameData) {
        showMessage('加载股票数据失败', 'error');
        return;
      }

      const { startGame } = useGameStore.getState();
      
      // 创建完整的ETFInfo对象，包含数据
      const etfInfo: ETFInfo = {
        code: gameData.stock.code,
        name: gameData.stock.name,
        market: gameData.stock.market,
        data: gameData.data
      };
      
      startGame(etfInfo, gameData.startIndex);
      showMessage(`游戏开始！${gameData.stock.name} (${gameData.stock.code})`, 'success');
    } catch (error) {
      console.error('开始游戏失败:', error);
      showMessage('开始游戏失败', 'error');
    }
  }, [showMessage]);

  // 重置游戏
  const handleResetGame = useCallback(() => {
    resetGame();
    showMessage('游戏已重置', 'info');
  }, [resetGame, showMessage]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isPlaying) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          const { pauseGame, resumeGame } = useGameStore.getState();
          if (isPaused) {
            resumeGame();
          } else {
            pauseGame();
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (isPaused) {
            nextKLine();
          }
          break;
        case '1':
        case '2':
        case '3':
          const speed = parseInt(e.key);
          useGameStore.getState().setGameSpeed(speed);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, isPaused, nextKLine]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-white text-lg">正在初始化游戏...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* 消息提示 */}
      {message && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg transition-all duration-300 ${
          message.type === 'success' ? 'bg-green-600' :
          message.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        } text-white`}>
          {message.text}
        </div>
      )}

      {/* 游戏结果弹窗 */}
      {gameResult && <GameResult />}

      {/* 主界面 */}
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* 游戏标题 */}
        <header className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">K线交易训练营</h1>
          <p className="text-gray-400">使用真实A股数据，测试你的交易技巧</p>
        </header>

        {/* 游戏信息面板 */}
        <div className="mb-6">
          <GamePanel
            onStartGame={handleStartGame}
            onResetGame={handleResetGame}
          />
        </div>

        {/* 主要内容区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* K线图区域 */}
          <div className="lg:col-span-2">
            <KLineChart height={500} />
            
            {/* 游戏控制按钮 */}
            <div className="mt-6">
              <GameControls
                onStartGame={handleStartGame}
                onResetGame={handleResetGame}
              />
            </div>
          </div>

          {/* 侧边栏 */}
          <div className="space-y-6">
            {/* 交易按钮 */}
            <div>
              <TradeButtons onShowMessage={showMessage} />
            </div>

            {/* 账户信息 */}
            <AccountInfo />

            {/* 委托单 */}
            <OrderPanel />


          </div>
        </div>

        {/* 页脚 */}
        <footer className="mt-8 text-center text-gray-500 text-sm">
          <p>基于真实A股数据 | 仅供学习和娱乐使用</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
