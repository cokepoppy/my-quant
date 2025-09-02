#!/bin/bash

echo "🧪 Testing Bybit API Connectivity with Proxy"
echo "=========================================="

# Test 1: Check proxy environment variables
echo "📡 Test 1: Proxy Environment Variables"
echo "http_proxy: $http_proxy"
echo "https_proxy: $https_proxy"
echo "HTTP_PROXY: $HTTP_PROXY"
echo "HTTPS_PROXY: $HTTPS_PROXY"
echo ""

# Test 2: Basic connectivity test
echo "📡 Test 2: Basic API Connectivity"
echo "Testing: https://api-testnet.bybit.com/v5/market/time"

if command -v curl &> /dev/null; then
    if [ -n "$http_proxy" ]; then
        echo "Using proxy: $http_proxy"
        response=$(curl -s --connect-timeout 10 --proxy "$http_proxy" "https://api-testnet.bybit.com/v5/market/time")
    else
        echo "No proxy configured"
        response=$(curl -s --connect-timeout 10 "https://api-testnet.bybit.com/v5/market/time")
    fi
    
    if [ $? -eq 0 ]; then
        echo "✅ Basic connectivity: PASSED"
        echo "Response: $response" | head -c 200
        echo ""
    else
        echo "❌ Basic connectivity: FAILED"
    fi
else
    echo "❌ curl not available"
fi

echo ""

# Test 3: Test different endpoints
echo "📡 Test 3: Test Different Endpoints"

endpoints=(
    "https://api-testnet.bybit.com/v5/market/time"
    "https://api.bybit.com/v5/market/time"
    "https://api-testnet.bybit.com/v5/market/tickers?category=spot&symbol=BTCUSDT"
)

for endpoint in "${endpoints[@]}"; do
    echo "Testing: $endpoint"
    if command -v curl &> /dev/null; then
        if [ -n "$http_proxy" ]; then
            response=$(curl -s --connect-timeout 5 --proxy "$http_proxy" "$endpoint")
        else
            response=$(curl -s --connect-timeout 5 "$endpoint")
        fi
        
        if [ $? -eq 0 ]; then
            echo "   ✅ Success"
        else
            echo "   ❌ Failed"
        fi
    fi
done

echo ""
echo "🎯 Summary:"
echo "   - Proxy environment: ${http_proxy:+✅ Configured}❌ Not set"
echo "   - Network connectivity: ✅ Working (if tests passed)"
echo "   - Bybit API access: ✅ Available (if tests passed)"

echo ""
echo "🔧 BybitAdapter Fix Applied:"
echo "   - Updated constructor to properly configure proxy"
echo "   - Enhanced testConnection method with fallbacks"
echo "   - Added detailed logging for troubleshooting"

echo ""
echo "📋 Next Steps:"
echo "   1. Restart backend service to apply changes"
echo "   2. Test exchange connection in web interface"
echo "   3. Monitor backend logs for connection status"