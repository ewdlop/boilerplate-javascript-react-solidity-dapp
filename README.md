# Token DApp / 代币 DApp

A simple decentralized application for managing ERC-20 tokens with a user-friendly interface.
一个简单的去中心化应用程序，用于管理 ERC-20 代币，具有用户友好的界面。

## Features / 功能

- Deploy ERC-20 token contract / 部署 ERC-20 代币合约
- Check token balances / 查询代币余额
- Transfer tokens between addresses / 在地址之间转移代币
- Real-time balance updates / 实时余额更新
- User-friendly interface / 用户友好界面

## Prerequisites / 前置要求

- Node.js (v14 or higher / v14 或更高版本)
- npm (v6 or higher / v6 或更高版本)
- Ganache (local blockchain / 本地区块链)

## Installation / 安装

1. Clone the repository / 克隆仓库
```bash
git clone <repository-url>
cd dapp-project
```

2. Install dependencies / 安装依赖
```bash
npm install
cd frontend
npm install
```

3. Start the development environment / 启动开发环境
```bash
# In the root directory / 在根目录下
npm run dev
```

## Usage / 使用方法

1. Deploy the Contract / 部署合约
   - Click the "Deploy Contract" button / 点击"部署合约"按钮
   - Wait for deployment confirmation / 等待部署确认

2. Check Balances / 查询余额
   - Enter an Ethereum address / 输入以太坊地址
   - Click "Check" to view the balance / 点击"查询"查看余额

3. Transfer Tokens / 转移代币
   - Enter the source address / 输入源地址
   - Enter the recipient address / 输入接收地址
   - Enter the amount / 输入数量
   - Click "Transfer" to send tokens / 点击"转移"发送代币

## Testing / 测试

The application uses Ganache for local testing. Available test accounts:
应用程序使用 Ganache 进行本地测试。可用的测试账户：

```
Account 0: 0x3cb9500d033687e5a5f865c7c17f9df6ef9f8156
Account 1: 0x97eb2b8193bf0cb60114a1ffbdac5ba9e4688be9
Account 2: 0x9c7d60f90b0839ff1accdc1c27afc94bd735de84
```

## Project Structure / 项目结构

```
dapp-project/
├── contracts/          # Smart contracts / 智能合约
├── frontend/          # React frontend / React 前端
├── scripts/           # Deployment scripts / 部署脚本
├── server.js          # Backend server / 后端服务器
└── package.json       # Project dependencies / 项目依赖
```

## Technologies Used / 使用的技术

- Solidity / 智能合约语言
- Web3.js / 区块链交互库
- React / 前端框架
- Ant Design / UI 组件库
- Express / 后端框架
- Ganache / 本地区块链

## Contributing / 贡献

Feel free to submit issues and pull requests.
欢迎提交问题和拉取请求。

## License / 许可证

MIT License / MIT 许可证 