const axios = require('axios');
const HttpsProxyAgent = require('https-proxy-agent');

async function testBybitBalance() {
    console.log('💰 测试Bybit账户余额...');
    
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
            console.log('✅ 代理代理配置成功');
        }
        
        // 测试1: 检查服务器时间（验证基本连接）
        console.log('\n📡 测试1: 检查服务器时间');
        const timeResponse = await axios.get('https://api-testnet.bybit.com/v5/market/time', axiosConfig);
        
        if (timeResponse.data.retCode === 0) {
            console.log('✅ 服务器连接正常');
            console.log(`   服务器时间: ${new Date(timeResponse.data.result.timeSecond * 1000).toISOString()}`);
        } else {
            console.log('❌ 服务器连接失败:', timeResponse.data.retMsg);
            return;
        }
        
        // 测试2: 使用你的API密钥测试余额查询
        console.log('\n💰 测试2: 查询账户余额');
        
        // 注意：这里需要你的真实API密钥
        const apiKey = 'AOhvPLn0ql4CodaS2g'; // 你的API Key
        const apiSecret = 'hpe1oGrwqmP70x1QPChck6i04nTd1SGpOYEZ'; // 你的API Secret
        
        // 创建签名（这是Bybit V5 API的要求）
        const timestamp = Date.now();
        const recvWindow = 5000;
        const queryString = '';
        
        // 对于余额查询，不需要额外的查询参数
        const signatureString = timestamp + apiKey + recvWindow + queryString;
        
        // 这里需要使用crypto模块创建HMAC签名
        const crypto = require('crypto');
        const signature = crypto.createHmac('sha256', apiSecret)
                               .update(signatureString)
                               .digest('hex');
        
        console.log('📋 API请求参数:');
        console.log(`   API Key: ${apiKey.substring(0, 8)}...`);
        console.log(`   时间戳: ${timestamp}`);
        console.log(`   签名: ${signature.substring(0, 16)}...`);
        
        // 发送余额查询请求
        const balanceResponse = await axios.get('https://api-testnet.bybit.com/v5/account/wallet-balance', {
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
        
        console.log('\n📊 余额查询结果:');
        console.log(`   状态码: ${balanceResponse.status}`);
        console.log(`   返回码: ${balanceResponse.data.retCode}`);
        console.log(`   返回消息: ${balanceResponse.data.retMsg}`);
        
        if (balanceResponse.data.retCode === 0) {
            const balance = balanceResponse.data.result;
            console.log('\n💰 账户余额详情:');
            
            if (balance.list && balance.list.length > 0) {
                balance.list.forEach((account, index) => {
                    console.log(`\n🏦 账户 ${index + 1}: ${account.accountType || account.accountId}`);
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
                
                // 计算总资产
                const totalEquity = balance.list.reduce((sum, account) => {
                    return sum + parseFloat(account.totalEquity || 0);
                }, 0);
                
                console.log(`\n🎯 总资产价值: $${totalEquity.toFixed(2)}`);
                
                // 检查是否有BTC余额
                const hasBTC = balance.list.some(account => 
                    account.coin && account.coin.some(coin => 
                        coin.coin === 'BTC' && parseFloat(coin.walletBalance) > 0
                    )
                );
                
                if (hasBTC) {
                    console.log('✅ 发现BTC余额！测试币已到账。');
                } else {
                    console.log('⚠️  未发现BTC余额，可能需要等待或检查领取状态。');
                }
                
            } else {
                console.log('⚠️  未找到账户信息');
            }
            
        } else {
            console.log('❌ 余额查询失败:', balanceResponse.data.retMsg);
            console.log('可能的原因:');
            console.log('  - API密钥错误');
            console.log('  - 签名验证失败');
            console.log('  - 账户权限不足');
            console.log('  - 网络问题');
        }
        
        // 测试3: 测试我们系统的后端API
        console.log('\n🔧 测试3: 测试我们系统的后端API');
        
        try {
            const backendResponse = await axios.get('http://localhost:8000/api/exchange/balance', {
                timeout: 10000,
                headers: {
                    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtZ' // 你的token
                }
            });
            
            console.log('✅ 后端API响应成功');
            console.log(`   状态码: ${backendResponse.status}`);
            console.log(`   数据: ${JSON.stringify(backendResponse.data, null, 2)}`);
            
        } catch (backendError) {
            console.log('⚠️  后端API测试失败:', backendError.message);
            console.log('   这可能是因为后端服务未运行或需要认证');
        }
        
        console.log('\n🎉 测试完成！');
        
    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error.message);
        if (error.response) {
            console.error('   状态码:', error.response.status);
            console.error('   响应数据:', error.response.data);
        }
        if (error.request) {
            console.error('   请求错误:', error.request);
        }
    }
}

// 运行测试
testBybitBalance();