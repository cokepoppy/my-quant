const axios = require('axios');
const HttpsProxyAgent = require('https-proxy-agent');

async function testDirectBybitAPI() {
    console.log('🔍 直接测试Bybit Unified Trading Account API...');
    
    try {
        // 配置代理
        const proxyUrl = process.env.http_proxy || process.env.https_proxy;
        console.log(`🔗 代理配置: ${proxyUrl || '无'}`);
        
        let axiosConfig = {
            timeout: 15000,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (proxyUrl) {
            const proxyAgent = new HttpsProxyAgent(proxyUrl);
            axiosConfig.httpsAgent = proxyAgent;
        }
        
        // 使用API密钥
        const apiKey = 'AOhvPLn0ql4CodaS2g';
        const apiSecret = 'hpe1oGrwqmP70x1QPChck6i04nTd1SGpOYEZ';
        
        // 创建签名
        const timestamp = Date.now();
        const recvWindow = 5000;
        const queryString = 'accountType=UNIFIED';
        
        const signatureString = timestamp + apiKey + recvWindow + queryString;
        
        const crypto = require('crypto');
        const signature = crypto.createHmac('sha256', apiSecret)
                               .update(signatureString)
                               .digest('hex');
        
        console.log('📋 API请求参数:');
        console.log(`   API Key: ${apiKey.substring(0, 8)}...`);
        console.log(`   时间戳: ${timestamp}`);
        console.log(`   签名: ${signature.substring(0, 16)}...`);
        
        // 直接调用Bybit API
        const response = await axios.get('https://api-testnet.bybit.com/v5/account/wallet-balance', {
            ...axiosConfig,
            headers: {
                ...axiosConfig.headers,
                'X-BAPI-SIGN': signature,
                'X-BAPI-API-KEY': apiKey,
                'X-BAPI-TIMESTAMP': timestamp.toString(),
                'X-BAPI-RECV-WINDOW': recvWindow.toString()
            },
            params: {
                accountType: 'UNIFIED'
            }
        });
        
        console.log('\n📊 Bybit API响应:');
        console.log(`   状态码: ${response.status}`);
        console.log(`   返回码: ${response.data.retCode}`);
        console.log(`   返回消息: ${response.data.retMsg}`);
        
        if (response.data.retCode === 0) {
            const balance = response.data.result;
            console.log('\n💰 账户余额详情:');
            
            if (balance.list && balance.list.length > 0) {
                balance.list.forEach((account, index) => {
                    console.log(`\n🏦 账户 ${index + 1}: ${account.accountType}`);
                    console.log(`   总资产: $${account.totalEquity || '0.00'}`);
                    console.log(`   可用余额: $${account.availableBalance || '0.00'}`);
                    
                    if (account.coin && account.coin.length > 0) {
                        console.log('   💵 货币余额:');
                        account.coin.forEach(coin => {
                            if (parseFloat(coin.walletBalance) > 0) {
                                console.log(`     ${coin.coin}: ${coin.walletBalance} (约 $${coin.usdValue})`);
                            }
                        });
                    }
                });
                
                const totalEquity = balance.list.reduce((sum, account) => {
                    return sum + parseFloat(account.totalEquity || 0);
                }, 0);
                
                console.log(`\n🎯 总资产价值: $${totalEquity.toFixed(2)}`);
                
                if (totalEquity > 0) {
                    console.log('✅ Bybit Unified Trading Account有余额！');
                    console.log('📝 这证明我们的修复应该有效，问题可能在后端实现');
                } else {
                    console.log('⚠️  Bybit Unified Trading Account余额为0');
                }
                
            } else {
                console.log('⚠️  未找到账户信息');
            }
            
        } else {
            console.log('❌ API调用失败:', response.data.retMsg);
        }
        
    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error.message);
        if (error.response) {
            console.error('   状态码:', error.response.status);
            console.error('   响应数据:', error.response.data);
        }
    }
}

// 运行测试
testDirectBybitAPI();