import { Layout, Typography, Tabs, Space } from 'antd';
import { 
  WalletOutlined, 
  SendOutlined, 
  HistoryOutlined, 
  TeamOutlined, 
  ThunderboltOutlined, 
  SafetyOutlined,
  SettingOutlined 
} from '@ant-design/icons';
import TokenBalance from './components/TokenBalance';
import TokenTransfer from './components/TokenTransfer';
import ContractDeployment from './components/ContractDeployment';
import TransactionHistory from './components/TransactionHistory';
import AccountManager from './components/AccountManager';
import BulkOperations from './components/BulkOperations';
import TokenApproval from './components/TokenApproval';
import './App.css';

const { Header, Content } = Layout;
const { Title } = Typography;

function App() {
  const tabItems = [
    {
      key: 'overview',
      label: (
        <span>
          <WalletOutlined />
          Overview / 概览
        </span>
      ),
      children: (
        <div className="overview-grid">
          <TokenBalance />
          <TokenTransfer />
        </div>
      ),
    },
    {
      key: 'contract',
      label: (
        <span>
          <SettingOutlined />
          Contract / 合约
        </span>
      ),
      children: <ContractDeployment />,
    },
    {
      key: 'accounts',
      label: (
        <span>
          <TeamOutlined />
          Accounts / 账户
        </span>
      ),
      children: <AccountManager />,
    },
    {
      key: 'bulk',
      label: (
        <span>
          <ThunderboltOutlined />
          Bulk Ops / 批量操作
        </span>
      ),
      children: <BulkOperations />,
    },
    {
      key: 'approval',
      label: (
        <span>
          <SafetyOutlined />
          Approvals / 授权
        </span>
      ),
      children: <TokenApproval />,
    },
    {
      key: 'history',
      label: (
        <span>
          <HistoryOutlined />
          History / 历史
        </span>
      ),
      children: <TransactionHistory />,
    },
  ];

  return (
    <Layout className="layout">
      <Header style={{ background: '#fff', padding: '0 24px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={3} style={{ margin: '16px 0', color: '#1890ff' }}>
            🚀 Advanced Token DApp / 高级代币 DApp
          </Title>
          <Space>
            <span style={{ fontSize: '12px', color: '#666' }}>
              Powered by Ganache + React + Solidity
            </span>
          </Space>
        </div>
      </Header>
      <Content className="content" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
        <Tabs
          defaultActiveKey="overview"
          items={tabItems}
          size="large"
          tabBarStyle={{ 
            marginBottom: '24px',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            background: 'white',
            paddingTop: '8px'
          }}
          style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        />
      </Content>
    </Layout>
  );
}

export default App;
