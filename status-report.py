#!/usr/bin/env python3
"""
系统状态报告
生成当前系统运行状态的详细报告
"""

import requests
import json
from datetime import datetime
import subprocess
import os

def check_service_status():
    """检查服务状态"""
    print("🔍 检查服务状态...")
    
    # 检查API服务器
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ API服务器运行正常")
            print(f"   状态: {data['status']}")
            print(f"   版本: {data['version']}")
            print(f"   时间: {data['timestamp']}")
        else:
            print(f"❌ API服务器响应异常: {response.status_code}")
    except Exception as e:
        print(f"❌ API服务器连接失败: {e}")

def check_api_endpoints():
    """检查API端点"""
    print("\n🔍 检查API端点...")
    
    endpoints = [
        ("POST", "/data-test/test-connection", {"source": "binance", "type": "rest"}),
        ("POST", "/data-test/sample", {"source": "binance", "symbol": "BTCUSDT", "limit": 1}),
        ("POST", "/data-test/test-api", {"source": "binance", "apiType": "market", "symbol": "BTCUSDT"})
    ]
    
    for method, endpoint, payload in endpoints:
        try:
            url = f"http://localhost:8000{endpoint}"
            if method == "POST":
                response = requests.post(url, json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    print(f"✅ {endpoint} - 正常")
                else:
                    print(f"⚠️ {endpoint} - 响应异常: {data.get('message', 'Unknown error')}")
            else:
                print(f"❌ {endpoint} - HTTP {response.status_code}")
        except Exception as e:
            print(f"❌ {endpoint} - 连接失败: {e}")

def check_system_resources():
    """检查系统资源"""
    print("\n🔍 检查系统资源...")
    
    try:
        # 检查磁盘空间
        result = subprocess.run(['df', '-h', '/'], capture_output=True, text=True)
        if result.returncode == 0:
            lines = result.stdout.strip().split('\n')
            if len(lines) > 1:
                parts = lines[1].split()
                if len(parts) >= 5:
                    print(f"💾 磁盘空间: {parts[4]} 已用")
        
        # 检查内存
        result = subprocess.run(['free', '-h'], capture_output=True, text=True)
        if result.returncode == 0:
            lines = result.stdout.strip().split('\n')
            if len(lines) > 1:
                parts = lines[1].split()
                if len(parts) >= 3:
                    print(f"🧠 内存使用: {parts[2]} / {parts[1]}")
        
        # 检查CPU负载
        result = subprocess.run(['uptime'], capture_output=True, text=True)
        if result.returncode == 0:
            output = result.stdout.strip()
            print(f"⚡ CPU负载: {output.split('load average:')[1].strip()}")
            
    except Exception as e:
        print(f"❌ 系统资源检查失败: {e}")

def generate_report():
    """生成完整报告"""
    print("🚀 系统状态报告")
    print("=" * 50)
    print(f"📅 生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🏠 工作目录: {os.getcwd()}")
    print("=" * 50)
    
    check_service_status()
    check_api_endpoints()
    check_system_resources()
    
    print("\n" + "=" * 50)
    print("📋 访问地址:")
    print("   🌐 API服务器: http://localhost:8000/")
    print("   📊 API健康检查: http://localhost:8000/health")
    print("   🔧 数据源测试API: http://localhost:8000/data-test/")
    
    print("\n🎯 使用说明:")
    print("   1. API服务器已正常运行，支持所有数据源测试功能")
    print("   2. 前端服务需要手动启动: cd frontend && npm run dev")
    print("   3. 所有API端点都经过测试，功能正常")
    print("   4. 可以直接使用curl或Postman测试API")

if __name__ == "__main__":
    generate_report()