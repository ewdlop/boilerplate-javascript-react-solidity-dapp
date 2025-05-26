import { Card, Table, Typography, Button, Space, message, Tag, Tooltip } from 'antd';
import { useState, useEffect } from 'react';
import { ReloadOutlined, CopyOutlined, EyeOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

function AccountManager() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  // Load Ganache accounts
  const loadAccounts = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8545', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_accounts',
          params: [],
          id: 1,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message);
      }
      
      if (data.result) {
        // Get balances for each account
        const accountsWithBalances = await Promise.all(
          data.result.map(async (address, index) => {
            try {
              // Get ETH balance
              const ethResponse = await fetch('http://localhost:8545', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  jsonrpc: '2.0',
                  method: 'eth_getBalance',
                  params: [address, 'latest'],
                  id: index + 2,
                }),
              });
              
              const ethData = await ethResponse.json();
              const ethBalance = ethData.result ? parseInt(ethData.result, 16) / 1e18 : 0;
              
              // Get token balance
              let tokenBalance = '0';
              try {
                const tokenResponse = await fetch(`http://localhost:3000/balance/${address}`);
                if (tokenResponse.ok) {
                  const tokenData = await tokenResponse.json();
                  tokenBalance = tokenData.balance || '0';
                }
              } catch (error) {
                console.log('Token balance not available for', address);
              }
              
              return {
                id: index,
                address,
                ethBalance: ethBalance.toFixed(4),
                tokenBalance: (Number(tokenBalance) / 1e18).toLocaleString(),
                isDeployer: index === 0,
              };
            } catch (error) {
              console.error(`Error loading balance for ${address}:`, error);
              return {
                id: index,
                address,
                ethBalance: 'Error',
                tokenBalance: 'Error',
                isDeployer: index === 0,
              };
            }
          })
        );
        
        setAccounts(accountsWithBalances);
        message.success('Accounts loaded successfully / 账户加载成功');
      }
    } catch (error) {
      console.error('Failed to load accounts:', error);
      message.error('Failed to load accounts. Please ensure Ganache is running. / 加载账户失败，请确保 Ganache 正在运行。');
    } finally {
      setLoading(false);
    }
  };

  // Load accounts on component mount
  useEffect(() => {
    loadAccounts();
  }, []);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    message.success('Address copied to clipboard! / 地址已复制到剪贴板！');
  };

  const selectAccount = (account) => {
    setSelectedAccount(account);
    message.info(`Selected account: ${account.address.slice(0, 10)}... / 已选择账户: ${account.address.slice(0, 10)}...`);
  };

  const columns = [
    {
      title: 'Account / 账户',
      dataIndex: 'id',
      key: 'id',
      render: (id, record) => (
        <Space>
          <Text strong>#{id}</Text>
          {record.isDeployer && (
            <Tag color="gold">Deployer / 部署者</Tag>
          )}
          {selectedAccount?.id === id && (
            <Tag color="blue">Selected / 已选择</Tag>
          )}
        </Space>
      ),
      width: 150,
    },
    {
      title: 'Address / 地址',
      dataIndex: 'address',
      key: 'address',
      render: (address) => (
        <Space>
          <Text code style={{ fontSize: '12px' }}>
            {`${address.slice(0, 10)}...${address.slice(-8)}`}
          </Text>
          <Tooltip title="Copy address / 复制地址">
            <Button 
              type="text" 
              size="small" 
              icon={<CopyOutlined />}
              onClick={() => copyToClipboard(address)}
            />
          </Tooltip>
        </Space>
      ),
      width: 200,
    },
    {
      title: 'ETH Balance / ETH 余额',
      dataIndex: 'ethBalance',
      key: 'ethBalance',
      render: (balance) => (
        <Text strong style={{ color: balance === 'Error' ? 'red' : 'inherit' }}>
          {balance === 'Error' ? 'Error' : `${balance} ETH`}
        </Text>
      ),
      width: 150,
    },
    {
      title: 'Token Balance / 代币余额',
      dataIndex: 'tokenBalance',
      key: 'tokenBalance',
      render: (balance) => (
        <Text style={{ color: balance === 'Error' ? 'red' : 'green' }}>
          {balance === 'Error' ? 'Error' : `${balance} STK`}
        </Text>
      ),
      width: 150,
    },
    {
      title: 'Actions / 操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="primary" 
            size="small"
            icon={<EyeOutlined />}
            onClick={() => selectAccount(record)}
          >
            Select / 选择
          </Button>
        </Space>
      ),
      width: 120,
    },
  ];

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4}>Account Manager / 账户管理</Title>
          <Button 
            type="primary"
            icon={<ReloadOutlined />}
            onClick={loadAccounts}
            loading={loading}
          >
            Refresh / 刷新
          </Button>
        </div>

        {selectedAccount && (
          <Card size="small" type="inner" title="Selected Account / 已选择账户">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text><strong>Address / 地址:</strong> <Text copyable>{selectedAccount.address}</Text></Text>
              <Text><strong>ETH Balance / ETH 余额:</strong> {selectedAccount.ethBalance} ETH</Text>
              <Text><strong>Token Balance / 代币余额:</strong> {selectedAccount.tokenBalance} STK</Text>
              {selectedAccount.isDeployer && (
                <Text type="warning"><strong>Note / 注意:</strong> This is the contract deployer account / 这是合约部署者账户</Text>
              )}
            </Space>
          </Card>
        )}

        <Table
          dataSource={accounts}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={false}
          scroll={{ x: 800 }}
          size="small"
          locale={{
            emptyText: 'No accounts found. Please start Ganache. / 未找到账户，请启动 Ganache。'
          }}
        />

        <Text type="secondary" style={{ fontSize: '12px' }}>
          * ETH is used for gas fees, STK tokens are your custom ERC-20 tokens / 
          * ETH 用于支付 gas 费用，STK 代币是您的自定义 ERC-20 代币
        </Text>
      </Space>
    </Card>
  );
}

export default AccountManager; 