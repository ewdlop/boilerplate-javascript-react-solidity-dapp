import { Layout, Typography } from 'antd';
import TokenBalance from './components/TokenBalance';
import TokenTransfer from './components/TokenTransfer';
import './App.css';

const { Header, Content } = Layout;
const { Title } = Typography;

function App() {
  return (
    <Layout className="layout">
      <Header style={{ background: '#fff', padding: '0 24px' }}>
        <Title level={3} style={{ margin: '16px 0' }}>Token DApp</Title>
      </Header>
      <Content className="content">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <TokenBalance />
          <TokenTransfer />
        </div>
      </Content>
    </Layout>
  );
}

export default App;
