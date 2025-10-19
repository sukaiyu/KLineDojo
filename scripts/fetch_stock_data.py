#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
股票数据获取脚本
使用adata库获取股票历史数据，转换为游戏需要的JSON格式
"""

import json
import os
import sys
from datetime import datetime, timedelta
from typing import List, Dict, Any
import pandas as pd

try:
    import adata
except ImportError:
    print("请安装adata库: pip install adata")
    sys.exit(1)

def load_stock_list():
    """从stock-list.json文件加载股票列表"""
    try:
        with open("public/data/stock-list.json", 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data.get('stocks', [])
    except Exception as e:
        print(f"加载股票列表失败: {e}")
        return []

# 数据配置
DATA_DIR = "public/data/stocks"
START_DATE = (datetime.now() - timedelta(days=3*365)).strftime("%Y%m%d")  # 3年前
END_DATE = datetime.now().strftime("%Y%m%d")

def ensure_data_dir():
    """确保数据目录存在"""
    os.makedirs(DATA_DIR, exist_ok=True)

def fetch_stock_data(stock_code: str, market: str) -> pd.DataFrame:
    """获取单只股票的历史数据"""
    try:
        print(f"正在获取 {stock_code} 的数据...")
        
        # 使用adata获取日K线数据
        df = adata.stock.market.get_market(
            stock_code=stock_code,
            start_date=START_DATE,
            end_date=END_DATE,
            k_type=1  # 日K线
        )
        
        if df.empty:
            print(f"警告: {stock_code} 没有数据")
            return pd.DataFrame()
            
        print(f"成功获取 {stock_code} 数据，共 {len(df)} 条记录")
        return df
        
    except Exception as e:
        print(f"获取 {stock_code} 数据失败: {e}")
        return pd.DataFrame()

def convert_to_game_format(df: pd.DataFrame, stock_info: Dict[str, str]) -> List[Dict[str, Any]]:
    """将adata数据转换为游戏需要的格式"""
    if df.empty:
        return []
    
    # adata返回的列名可能不同，需要映射
    column_mapping = {
        '日期': 'time',
        '开盘': 'open', 
        '收盘': 'close',
        '最高': 'high',
        '最低': 'low',
        '成交量': 'volume',
        'date': 'time',
        'trade_date': 'time',
        'open': 'open',
        'close': 'close', 
        'high': 'high',
        'low': 'low',
        'volume': 'volume'
    }
    
    # 重命名列
    df_mapped = df.rename(columns=column_mapping)
    
    # 确保必要的列存在
    required_columns = ['time', 'open', 'high', 'low', 'close', 'volume']
    missing_columns = [col for col in required_columns if col not in df_mapped.columns]
    
    if missing_columns:
        print(f"警告: {stock_info['code']} 缺少必要列: {missing_columns}")
        print(f"可用列: {list(df_mapped.columns)}")
        return []
    
    # 转换数据格式
    result = []
    for _, row in df_mapped.iterrows():
        try:
            # 确保时间格式正确
            time_str = str(row['time'])
            if len(time_str) == 8:  # YYYYMMDD格式
                time_str = f"{time_str[:4]}-{time_str[4:6]}-{time_str[6:8]}"
            
            kline_data = {
                "time": time_str,
                "open": float(row['open']),
                "high": float(row['high']),
                "low": float(row['low']),
                "close": float(row['close']),
                "volume": int(row['volume']) if not pd.isna(row['volume']) else 0
            }
            
            # 数据验证
            if kline_data["open"] > 0 and kline_data["high"] > 0 and kline_data["low"] > 0 and kline_data["close"] > 0:
                # 确保最高价 >= 最低价
                if (kline_data["high"] >= kline_data["low"] and 
                    kline_data["high"] >= kline_data["open"] and kline_data["high"] >= kline_data["close"] and
                    kline_data["low"] <= kline_data["open"] and kline_data["low"] <= kline_data["close"]):
                    result.append(kline_data)
                    
        except (ValueError, TypeError) as e:
            print(f"跳过无效数据行: {e}")
            continue
    
    # 按时间排序
    result.sort(key=lambda x: x['time'])
    
    return result

def save_stock_data(stock_info: Dict[str, str], kline_data: List[Dict[str, Any]]):
    """保存股票数据到JSON文件"""
    if not kline_data:
        print(f"警告: {stock_info['code']} 没有有效数据，跳过保存")
        return
    
    filename = os.path.join(DATA_DIR, f"{stock_info['code']}.json")
    
    stock_data = {
        "code": stock_info['code'],
        "name": stock_info['name'],
        "market": stock_info['market'],
        "data": kline_data,
        "update_time": datetime.now().isoformat(),
        "data_count": len(kline_data)
    }
    
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(stock_data, f, ensure_ascii=False, indent=2)
        print(f"成功保存 {stock_info['name']} 数据到 {filename}")
        print(f"数据范围: {kline_data[0]['time']} 到 {kline_data[-1]['time']}")
        print(f"数据量: {len(kline_data)} 条")
        
    except Exception as e:
        print(f"保存 {stock_info['code']} 数据失败: {e}")

def save_stock_list(stock_list):
    """保存股票列表信息"""
    stock_list_data = {
        "stocks": stock_list,
        "update_time": datetime.now().isoformat(),
        "data_source": "adata",
        "total_count": len(stock_list)
    }
    
    filename = os.path.join("public/data", "stock-list.json")
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(stock_list_data, f, ensure_ascii=False, indent=2)
        print(f"成功保存股票列表到 {filename}")
    except Exception as e:
        print(f"保存股票列表失败: {e}")

def main():
    """主函数"""
    # 加载股票列表
    STOCK_LIST = load_stock_list()
    
    if not STOCK_LIST:
        print("错误: 没有找到股票列表，请检查 stock-list.json 文件")
        return 1
    
    print("开始获取股票数据...")
    print(f"数据目录: {DATA_DIR}")
    print(f"时间范围: {START_DATE} 到 {END_DATE}")
    print(f"股票数量: {len(STOCK_LIST)}")
    print("-" * 50)
    
    ensure_data_dir()
    
    success_count = 0
    
    for stock_info in STOCK_LIST:
        print(f"\n处理股票: {stock_info['name']} ({stock_info['code']}.{stock_info['market']})")
        
        # 获取数据
        df = fetch_stock_data(stock_info['code'], stock_info['market'])
        
        if not df.empty:
            # 转换格式
            kline_data = convert_to_game_format(df, stock_info)
            
            if kline_data:
                # 保存数据
                save_stock_data(stock_info, kline_data)
                success_count += 1
            else:
                print(f"警告: {stock_info['code']} 数据转换失败")
        else:
            print(f"警告: {stock_info['code']} 没有获取到数据")
    
    # 保存股票列表
    save_stock_list(STOCK_LIST)
    
    print("-" * 50)
    print(f"数据获取完成!")
    print(f"成功: {success_count}/{len(STOCK_LIST)} 只股票")
    
    if success_count < len(STOCK_LIST):
        print("警告: 部分股票数据获取失败，请检查网络连接或股票代码")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
