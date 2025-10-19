# K线交易训练营

基于真实ETF数据的K线交易训练游戏，模拟同花顺K线训练营体验。

## 功能特点

- 🎯 **真实数据**: 使用真实的ETF 5分钟K线数据
- 🎮 **游戏化体验**: 随机选择ETF和开始时间，1周游戏时长
- 📈 **专业K线图**: 基于Lightweight Charts的交互式K线图
- 💰 **交易模拟**: 买入卖出操作，实时计算盈亏
- 📊 **成绩评分**: 游戏结束后显示详细交易统计和评分
- 📱 **响应式设计**: 支持桌面端和移动端
- ⚡ **实时游戏**: 可暂停、调速的实时K线播放

## 技术栈

- **前端框架**: React 18 + TypeScript
- **状态管理**: Zustand
- **UI样式**: Tailwind CSS
- **K线图表**: Lightweight Charts
- **数据处理**: PapaParse (CSV解析)
- **构建工具**: Vite

## 项目结构

```
kline_game/
├── src/
│   ├── components/          # React组件
│   │   ├── KLineChart.tsx  # K线图组件
│   │   ├── GamePanel.tsx   # 游戏控制面板
│   │   ├── TradeButtons.tsx # 交易按钮
│   │   ├── AccountInfo.tsx # 账户信息
│   │   └── GameResult.tsx  # 游戏结果
│   ├── stores/             # 状态管理
│   │   └── gameStore.ts    # 游戏状态
│   ├── utils/              # 工具函数
│   │   └── dataLoader.ts   # 数据加载
│   ├── types/              # 类型定义
│   │   └── game.ts         # 游戏类型
│   ├── App.tsx             # 主应用组件
│   ├── main.tsx            # 入口文件
│   └── index.css           # 全局样式
├── data/                   # ETF数据文件 (来自上级目录)
├── public/                 # 静态资源
├── package.json            # 项目配置
├── vite.config.ts          # Vite配置
├── tailwind.config.js      # Tailwind配置
└── README.md               # 项目说明
```

## 安装和运行

### 1. 安装依赖

```bash
cd kline_game
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

服务器将在 http://localhost:3000 启动

### 3. 构建生产版本

```bash
npm run build
```

### 4. 预览生产版本

```bash
npm run preview
```

## 游戏规则

1. **开始游戏**: 随机选择一个ETF和开始时间点
2. **游戏时长**: 1周交易时间 (约560根5分钟K线)
3. **初始资金**: 10万元人民币
4. **交易操作**: 根据K线走势进行买入卖出操作
5. **游戏结束**: 时间结束后显示最终成绩和评分

## 操作说明

### 基本操作
- **开始游戏**: 点击"开始游戏"按钮
- **买入**: 点击"买入"按钮，输入数量
- **卖出**: 点击"卖出"按钮，输入数量
- **暂停/继续**: 点击"暂停"或"继续"按钮

### 快捷键
- **空格键**: 暂停/继续游戏
- **数字键 1/2/3**: 调整播放速度 (1x/2x/4x)

### K线图操作
- **拖动**: 查看历史K线
- **滚轮**: 缩放显示范围
- **触摸**: 移动端手势支持

## 评分系统

游戏结束后会根据以下指标计算评分：

- **收益率**: 基础分数 (收益率 × 10)
- **最大回撤**: 风险惩罚 (回撤 × 10)
- **胜率**: 操作奖励 (胜率 × 2)
- **总分**: 0-100分

### 评分等级
- **90分以上**: 交易大师
- **70-89分**: 高手
- **50-69分**: 良好
- **30-49分**: 及格
- **30分以下**: 需要练习

## 数据说明

项目使用真实的ETF 5分钟K线数据，包含以下ETF：

- 标普500ETF (159529)
- 纳斯达克100ETF (513000)
- 恒生科技ETF (513020)
- 新能源车ETF (159632)
- 医药ETF (159687)
- 半导体ETF (159688)
- 人工智能ETF (159812)
- 游戏ETF (159954)
- 等等...

数据文件格式为CSV，包含以下字段：
- Date: 时间戳
- Open: 开盘价
- High: 最高价
- Low: 最低价
- Close: 收盘价
- Volume: 成交量

## 开发说明

### 添加新的ETF数据

1. 将CSV数据文件放入 `data/` 目录
2. 文件命名格式: `etf_{代码}_5min_data.csv`
3. 在 `src/utils/dataLoader.ts` 中添加ETF名称映射

### 自定义游戏配置

在 `src/stores/gameStore.ts` 中修改 `GAME_CONFIG`:

```typescript
const GAME_CONFIG: GameConfig = {
  initialBalance: 100000,    // 初始资金
  gameDuration: 560,         // 游戏时长(K线数量)
  speedOptions: [1, 2, 4]    // 播放速度选项
};
```

### 样式定制

项目使用Tailwind CSS，可以在 `src/index.css` 中自定义样式：

- 主色调: 蓝色系
- 涨色: 红色 (#ef4444)
- 跌色: 绿色 (#22c55e)
- 背景色: 深色主题

## 浏览器支持

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request来改进这个项目。

## 免责声明

本项目仅供学习和娱乐使用，不构成任何投资建议。交易有风险，投资需谨慎。
