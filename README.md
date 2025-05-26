# Advanced Token DApp / 高级代币去中心化应用

A comprehensive decentralized application (DApp) for ERC-20 token management with advanced features, built with React, Solidity, and Web3.js.

一个功能全面的 ERC-20 代币管理去中心化应用，具有高级功能，基于 React、Solidity 和 Web3.js 构建。

## 🚀 Features / 功能特性

### Core Features / 核心功能
- **Smart Contract Management / 智能合约管理**: Deploy and manage ERC-20 token contracts
- **Token Balance Checking / 代币余额查询**: Real-time balance checking for any Ethereum address
- **Token Transfer / 代币转账**: Secure token transfers with transaction tracking
- **Account Management / 账户管理**: Comprehensive Ganache account overview with ETH and token balances

### Advanced Features / 高级功能
- **Bulk Operations / 批量操作**: Batch token transfers and airdrops
- **Token Approval System / 代币授权系统**: ERC-20 allowance management and approval tracking
- **Transaction History / 交易历史**: Complete transaction logging with export functionality
- **Multi-language Support / 多语言支持**: Full English and Simplified Chinese interface

### Developer Features / 开发者功能
- **Local Development / 本地开发**: Integrated Ganache blockchain environment
- **Real-time Updates / 实时更新**: Automatic balance and transaction updates
- **Error Handling / 错误处理**: Comprehensive error handling and user feedback
- **Modern UI/UX / 现代化界面**: Beautiful Ant Design interface with responsive design

## 🛠 Technology Stack / 技术栈

- **Frontend / 前端**: React 18, Vite, Redux Toolkit, RTK Query, Ant Design
- **Backend / 后端**: Node.js, Express.js, Web3.js, CORS
- **Blockchain / 区块链**: Solidity, Ganache (local Ethereum blockchain)
- **Development Tools / 开发工具**: Concurrently, dotenv

## 📋 Prerequisites / 前置要求

- Node.js (v16 or higher / v16 或更高版本)
- npm or yarn
- Git
- 4GB+ RAM for Ganache / 4GB+ 内存用于 Ganache

## 🚀 Quick Start / 快速开始

1. **Clone the repository / 克隆仓库**
   ```bash
   git clone <repository-url>
   cd DApp
   ```

2. **Install dependencies / 安装依赖**
   ```bash
   npm install
   ```

3. **Start the development environment / 启动开发环境**
   ```bash
   npm run dev
   ```

   This will start:
   - 🔗 Ganache blockchain on `http://localhost:8545`
   - 🖥️ Express server on `http://localhost:3000`
   - 🌐 React frontend on `http://localhost:5173`

   这将启动：
   - 🔗 Ganache 区块链在 `http://localhost:8545`
   - 🖥️ Express 服务器在 `http://localhost:3000`
   - 🌐 React 前端在 `http://localhost:5173`

## 📖 Usage Guide / 使用指南

### 1. Contract Management / 合约管理
- Navigate to the **Contract** tab / 导航到**合约**选项卡
- Deploy your ERC-20 token contract / 部署您的 ERC-20 代币合约
- View contract details and specifications / 查看合约详情和规格

### 2. Account Management / 账户管理
- **Accounts** tab shows all Ganache accounts / **账户**选项卡显示所有 Ganache 账户
- View ETH and token balances / 查看 ETH 和代币余额
- Copy addresses and select accounts / 复制地址并选择账户

### 3. Token Operations / 代币操作
- **Overview** tab for basic balance checking and transfers / **概览**选项卡用于基本余额查询和转账
- Real-time balance updates after transactions / 交易后实时余额更新

### 4. Bulk Operations / 批量操作
- **Bulk Ops** tab for batch transfers / **批量操作**选项卡用于批量转账
- Add recipients individually or import in bulk / 单独添加接收者或批量导入
- Execute multiple transfers with progress tracking / 执行多个转账并跟踪进度

### 5. Token Approvals / 代币授权
- **Approvals** tab for ERC-20 allowance management / **授权**选项卡用于 ERC-20 授权额度管理
- Approve spending limits for other addresses / 为其他地址批准支出限额
- Check and revoke existing approvals / 检查和撤销现有授权

### 6. Transaction History / 交易历史
- **History** tab shows all transactions / **历史**选项卡显示所有交易
- Export transaction data / 导出交易数据
- Filter and search transaction records / 过滤和搜索交易记录

## 🏗 Project Structure / 项目结构

```
DApp/
├── contracts/                    # Smart contracts / 智能合约
│   └── SimpleToken.sol          # ERC-20 token contract / ERC-20 代币合约
├── scripts/                     # Deployment scripts / 部署脚本
│   ├── deploy.js               # Contract deployment / 合约部署
│   └── start-ganache.js        # Ganache configuration / Ganache 配置
├── frontend/                    # React frontend / React 前端
│   ├── src/
│   │   ├── components/         # React components / React 组件
│   │   │   ├── TokenBalance.jsx      # Balance checker / 余额查询器
│   │   │   ├── TokenTransfer.jsx     # Transfer interface / 转账界面
│   │   │   ├── ContractDeployment.jsx # Contract management / 合约管理
│   │   │   ├── AccountManager.jsx    # Account overview / 账户概览
│   │   │   ├── BulkOperations.jsx    # Batch operations / 批量操作
│   │   │   ├── TokenApproval.jsx     # Approval management / 授权管理
│   │   │   └── TransactionHistory.jsx # Transaction log / 交易日志
│   │   ├── store/              # Redux store / Redux 存储
│   │   │   └── apiSlice.js     # RTK Query API / RTK Query API
│   │   └── App.jsx             # Main app / 主应用
│   └── package.json
├── server.js                    # Express backend / Express 后端
├── package.json                 # Dependencies / 依赖项
└── README.md                    # Documentation / 文档
```

## 🔌 API Endpoints / API 端点

### Contract Management / 合约管理
- `POST /deploy` - Deploy smart contract / 部署智能合约
- `GET /contract-info` - Get contract information / 获取合约信息
- `GET /token-info` - Get token details / 获取代币详情
- `GET /total-supply` - Get total token supply / 获取代币总供应量

### Token Operations / 代币操作
- `GET /balance/:address` - Get token balance / 获取代币余额
- `POST /transfer` - Transfer tokens / 转账代币
- `POST /approve` - Approve token spending / 授权代币支出
- `GET /allowance/:owner/:spender` - Check allowance / 检查授权额度

## 💎 Smart Contract Details / 智能合约详情

### Token Specifications / 代币规格
- **Name / 名称**: Simple Token
- **Symbol / 符号**: STK
- **Decimals / 小数位数**: 18
- **Total Supply / 总供应量**: 1,000,000 STK
- **Standard / 标准**: ERC-20

### Contract Features / 合约功能
- ✅ Standard ERC-20 functions / 标准 ERC-20 功能
- ✅ Transfer and approval mechanisms / 转账和授权机制
- ✅ Balance and allowance queries / 余额和授权额度查询
- ✅ Event emission for transparency / 事件发射以提高透明度

## 🔧 Development / 开发

### Available Scripts / 可用脚本

```bash
# Full development environment / 完整开发环境
npm run dev

# Individual services / 单独服务
npm start                    # Backend only / 仅后端
npm run start:ganache       # Ganache only / 仅 Ganache
npm run frontend            # Frontend only / 仅前端
```

### Environment Configuration / 环境配置

Create `.env` file / 创建 `.env` 文件:
```env
ETHEREUM_NODE_URL=http://localhost:8545
PORT=3000
NODE_ENV=development
```

### Ganache Configuration / Ganache 配置
- **Network ID**: 1337
- **Gas Limit**: 10,000,000
- **Gas Price**: 20 Gwei
- **Accounts**: 10 pre-funded accounts with 1000 ETH each
- **Hardfork**: London

## 🐛 Troubleshooting / 故障排除

### Common Issues / 常见问题

1. **Port Conflicts / 端口冲突**
   ```bash
   # Kill processes on specific ports / 终止特定端口的进程
   npx kill-port 3000 8545
   ```

2. **Contract Deployment Issues / 合约部署问题**
   - Ensure Ganache is running / 确保 Ganache 正在运行
   - Check gas limits and balances / 检查 gas 限制和余额
   - Verify network connectivity / 验证网络连接

3. **Transaction Failures / 交易失败**
   - Insufficient gas / Gas 不足
   - Invalid addresses / 地址无效
   - Insufficient token balance / 代币余额不足

4. **Frontend Connection Issues / 前端连接问题**
   - Check CORS configuration / 检查 CORS 配置
   - Verify API endpoints / 验证 API 端点
   - Ensure backend is running / 确保后端正在运行

### Debug Mode / 调试模式

Enable detailed logging / 启用详细日志记录:
```bash
DEBUG=* npm run dev
```

## 🤝 Contributing / 贡献

1. Fork the repository / 分叉仓库
2. Create feature branch / 创建功能分支
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. Commit changes / 提交更改
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. Push to branch / 推送到分支
   ```bash
   git push origin feature/amazing-feature
   ```
5. Open Pull Request / 开启拉取请求

## 📄 License / 许可证

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

本项目采用 MIT 许可证 - 详情请参阅 [LICENSE](LICENSE) 文件。

## 🙏 Acknowledgments / 致谢

- Ethereum Foundation for Web3 standards / 以太坊基金会的 Web3 标准
- OpenZeppelin for secure contract patterns / OpenZeppelin 的安全合约模式
- Ant Design for beautiful UI components / Ant Design 的美观 UI 组件
- Ganache for local blockchain development / Ganache 的本地区块链开发

---

**Happy Coding! / 编程愉快！** 🚀 