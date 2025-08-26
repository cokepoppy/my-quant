#!/usr/bin/env python3
"""
系统测试脚本
验证所有API端点的功能
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

def test_health():
    """测试健康检查端点"""
    print("🔍 测试健康检查...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 健康检查成功: {data['status']}")
            return True
        else:
            print(f"❌ 健康检查失败: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 健康检查错误: {e}")
        return False

def test_connection():
    """测试数据源连接"""
    print("\n🔍 测试数据源连接...")
    try:
        payload = {
            "source": "binance",
            "type": "rest"
        }
        response = requests.post(f"{BASE_URL}/data-test/test-connection", json=payload)
        if response.status_code == 200:
            data = response.json()
            if data['success']:
                print(f"✅ 连接测试成功: {data['message']}")
                print(f"   延迟: {data['data']['latency']}ms")
                return True
            else:
                print(f"⚠️ 连接测试失败: {data['message']}")
                return False
        else:
            print(f"❌ 连接测试失败: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 连接测试错误: {e}")
        return False

def test_sample_data():
    """测试获取数据样例"""
    print("\n🔍 测试获取数据样例...")
    try:
        payload = {
            "source": "binance",
            "symbol": "BTCUSDT",
            "limit": 3
        }
        response = requests.post(f"{BASE_URL}/data-test/sample", json=payload)
        if response.status_code == 200:
            data = response.json()
            if data['success']:
                print(f"✅ 数据样例获取成功: {len(data['data'])} 条记录")
                sample = data['data'][0]
                print(f"   样例数据: {sample['symbol']} - {sample['close']:.2f}")
                return True
            else:
                print(f"❌ 数据样例获取失败: {data['message']}")
                return False
        else:
            print(f"❌ 数据样例获取失败: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 数据样例获取错误: {e}")
        return False

def test_api():
    """测试API功能"""
    print("\n🔍 测试API功能...")
    try:
        payload = {
            "source": "binance",
            "apiType": "market",
            "symbol": "BTCUSDT"
        }
        response = requests.post(f"{BASE_URL}/data-test/test-api", json=payload)
        if response.status_code == 200:
            data = response.json()
            if data['success']:
                print(f"✅ API测试成功: {data['message']}")
                market_data = data['data']
                print(f"   价格: {market_data['price']:.2f}")
                print(f"   24h变化: {market_data['change24h']:.2f}%")
                return True
            else:
                print(f"❌ API测试失败: {data['message']}")
                return False
        else:
            print(f"❌ API测试失败: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ API测试错误: {e}")
        return False

def main():
    """主测试函数"""
    print("🚀 开始系统测试...")
    print(f"📅 测试时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🔗 API地址: {BASE_URL}")
    print("-" * 50)

    tests = [
        test_health,
        test_connection,
        test_sample_data,
        test_api
    ]

    passed = 0
    total = len(tests)

    for test in tests:
        if test():
            passed += 1

    print("-" * 50)
    print(f"📊 测试结果: {passed}/{total} 通过")

    if passed == total:
        print("🎉 所有测试通过！系统运行正常。")
        print("\n🌐 你可以访问以下地址:")
        print("   - 前端应用: http://localhost:3004/")
        print("   - 数据源测试: http://localhost:3004/market/data-source-test")
        print("   - API健康检查: http://localhost:8000/health")
    else:
        print("⚠️ 部分测试失败，请检查系统状态。")

if __name__ == "__main__":
    main()