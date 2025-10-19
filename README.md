# K线道场 (KLineDojo)

基于真实A股数据的K线交易训练游戏。

## 🚀 在线体验

[https://sukaiyu.github.io/KLineDojo/](https://sukaiyu.github.io/KLineDojo/)

无需安装，直接在浏览器中体验完整的K线交易游戏！

## 功能特点

- 🎯 **真实数据**: 使用真实的A股日K线数据，覆盖50只热门股票
- 🎮 **游戏化体验**: 随机选择股票和开始时间，1年游戏时长（252个交易日）
- 📈 **专业K线图**: 基于Lightweight Charts的交互式K线图
- 💰 **交易模拟**: 买入卖出操作，实时计算盈亏，包含手续费计算
- 📊 **委托系统**: 支持限价委托单，可撤单，实时显示委托状态
- 📱 **响应式设计**: 支持桌面端和移动端
- ⚡ **灵活控制**: 可暂停、调速，**暂停时可点击"下一日"手动推进K线**
- 🏆 **成绩评分**: 游戏结束后显示详细交易统计和评分

## 核心特色功能

### 🎮 暂停时手动推进K线
- 游戏进行中可以随时暂停
- 暂停状态下显示"下一日"按钮
- 每次点击推进一根K线，保持暂停状态
- 可以在暂停时仔细分析K线图并进行交易操作

### 💰 完整的交易系统
- **市价交易**: 快速买入卖出
- **限价委托**: 设置指定价格的委托单
- **委托管理**: 实时查看委托状态，支持撤单
- **手续费计算**: 包含佣金、印花税、过户费等真实费用

## 技术栈

- **前端框架**: React 18 + TypeScript
- **状态管理**: Zustand
- **UI样式**: Tailwind CSS
- **K线图表**: Lightweight Charts
- **数据处理**: 自定义数据加载器
- **构建工具**: Vite

## 项目结构

```
KLineDojo/
├── src/
│   ├── components/          # React组件
│   │   ├── KLineChart.tsx  # K线图组件
│   │   ├── GamePanel.tsx   # 游戏控制面板
│   │   ├── GameControls.tsx # 游戏控制按钮
│   │   ├── TradeButtons.tsx # 交易按钮
│   │   ├── OrderPanel.tsx  # 委托单面板
│   │   ├── AccountInfo.tsx # 账户信息
│   │   ├── Notification.tsx # 通知组件
│   │   └── GameResult.tsx  # 游戏结果
│   ├── stores/             # 状态管理
│   │   └── gameStore.ts    # 游戏状态
│   ├── services/           # 服务层
│   │   └── stockApi.ts     # 股票数据API
│   ├── utils/              # 工具函数
│   │   └── dataLoader.ts   # 数据加载
│   ├── types/              # 类型定义
│   │   └── game.ts         # 游戏类型
│   ├── App.tsx             # 主应用组件
│   ├── main.tsx            # 入口文件
│   └── index.css           # 全局样式
├── public/                 # 静态资源
│   └── data/               # 股票数据文件
├── scripts/                # 脚本文件
│   └── fetch_stock_data.py # 数据获取脚本
├── dist/                   # 构建输出（用于GitHub Pages）
├── package.json            # 项目配置
├── vite.config.ts          # Vite配置
├── tailwind.config.js      # Tailwind配置
└── README.md               # 项目说明
```

## 安装和运行

### 1. 安装依赖

```bash
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

1. **开始游戏**: 随机选择一只A股和开始时间点
2. **游戏时长**: 1年交易时间 (252个交易日)
3. **初始资金**: 10万元人民币
4. **交易操作**: 根据K线走势进行买入卖出操作
5. **暂停功能**: 可随时暂停，暂停时可手动推进K线
6. **游戏结束**: 时间结束后显示最终成绩和评分

## 操作说明

### 基本操作
- **开始游戏**: 点击"开始游戏"按钮
- **买入**: 点击"买入"按钮，选择数量（市价）
- **卖出**: 点击"卖出"按钮，选择数量（市价）
- **暂停/继续**: 点击"暂停"或"继续"按钮
- **下一日**: 暂停时显示，点击推进一根K线

### 速度控制
- **调速**: 点击速度按钮切换 1x/2x/4x 播放速度

### K线图操作
- **拖动**: 查看历史K线
- **滚轮**: 缩放显示范围
- **触摸**: 移动端手势支持

### 委托操作
- **限价委托**: 在委托面板设置价格和数量
- **撤单**: 点击委托单的"撤单"按钮
- **查看状态**: 实时显示待成交、已成交、已撤销状态

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

项目使用真实的A股日K线数据，包含以下股票：

### 主要股票
- 平安银行 (000001)
- 万科A (000002)
- 中国平安 (601318)
- 贵州茅台 (600519)
- 比亚迪 (002594)
- 宁德时代 (300750)
- 招商银行 (600036)
- 等等...

数据文件格式为JSON，包含以下字段：
- date: 日期
- open: 开盘价
- high: 最高价
- low: 最低价
- close: 收盘价
- volume: 成交量

## 数据获取

项目包含Python脚本用于获取最新股票数据：

```bash
# 创建虚拟环境
python -m venv venv

# 激活虚拟环境 (Windows)
venv\Scripts\activate

# 激活虚拟环境 (Linux/Mac)
source venv/bin/activate

# 安装依赖
pip install akshare pandas

# 运行数据获取脚本
python scripts/fetch_stock_data.py
```

## 开发说明

### 添加新的股票数据

1. 使用 `scripts/fetch_stock_data.py` 获取数据
2. 数据会自动保存到 `public/data/stocks/` 目录
3. 在 `public/data/stock-list.json` 中更新股票列表

### 自定义游戏配置

在 `src/stores/gameStore.ts` 中修改 `GAME_CONFIG`:

```typescript
const GAME_CONFIG: GameConfig = {
  initialBalance: 100000,    // 初始资金
  gameDuration: 252,         // 游戏时长(交易日数量)
  speedOptions: [1, 2, 4]    // 播放速度选项
};
```

### 样式定制

项目使用Tailwind CSS，可以在 `src/index.css` 中自定义样式：

- 主色调: 蓝色系
- 涨色: 红色 (#ef4444)
- 跌色: 绿色 (#22c55e)
- 背景色: 深色主题

## GitHub Pages部署

项目已配置GitHub Pages自动部署：

1. 构建项目：`npm run build`
2. 提交到GitHub：`git push origin main`
3. 在GitHub仓库设置中启用GitHub Pages
4. 选择源为 `main` 分支和 `dist` 目录

详细部署说明请参考 `GITHUB_PAGES_DEPLOY.md`

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
