import { Card, Input, Button, Typography, message, Table, Space } from 'antd';
import { useState, useEffect } from 'react';
import { useGetBalanceQuery } from '../store/apiSlice';

const { Title, Text } = Typography;

function TokenBalance() {
  const [address, setAddress] = useState('');
  const [skip, setSkip] = useState(true);
  const [balances, setBalances] = useState([]);
  const { data: balance, error, isLoading } = useGetBalanceQuery(address, {
    skip,
    // Add polling to keep balance updated
    pollingInterval: 5000,
  });

  // Load initial accounts from Ganache
  useEffect(() => {
    const loadInitialAccounts = async () => {
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
          setBalances(data.result.map(addr => ({ address: addr, balance: '0' })));
        }
      } catch (error) {
        console.error('Failed to load accounts:', error);
        message.error('Failed to connect to Ganache. Please ensure it is running.');
      }
    };
    loadInitialAccounts();
  }, []);

  const handleCheckBalance = async () => {
    if (!address) {
      message.error('Please enter an address');
      setSkip(true);
      return;
    }
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      message.error('Invalid Ethereum address format');
      setSkip(true);
      return;
    }
    setSkip(false);
    try {
      const response = await fetch(`http://localhost:3000/balance/${address}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // Update the balances array with the new balance
      setBalances(prevBalances => {
        const existingIndex = prevBalances.findIndex(item => item.address === address);
        if (existingIndex >= 0) {
          // Update existing entry
          const newBalances = [...prevBalances];
          newBalances[existingIndex] = { ...newBalances[existingIndex], balance: data.balance };
          return newBalances;
        } else {
          // Add new entry
          return [...prevBalances, { address, balance: data.balance }];
        }
      });
      
      // Clear the input field after successful check
      setAddress('');
      setSkip(true);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      message.error('Failed to fetch balance. Please check if the backend is running.');
      setSkip(true);
    }
  };

  const handleCheckAllBalances = async () => {
    try {
      const newBalances = await Promise.all(
        balances.map(async (item) => {
          try {
            const response = await fetch(`http://localhost:3000/balance/${item.address}`);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return { ...item, balance: data.balance };
          } catch (error) {
            console.error(`Failed to fetch balance for ${item.address}:`, error);
            return { ...item, balance: 'Error' };
          }
        })
      );
      setBalances(newBalances);
      message.success('Balances updated');
    } catch (error) {
      console.error('Failed to update balances:', error);
      message.error('Failed to update balances. Please check the console for details.');
    }
  };

  const formatBalance = (balance) => {
    if (!balance) return '0';
    // Convert from wei to tokens (divide by 10^18)
    const balanceInTokens = Number(balance) / 1e18;
    return balanceInTokens.toString();
  };

  const columns = [
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      render: (text) => (
        <Text copyable style={{ maxWidth: '150px' }} ellipsis>
          {text}
        </Text>
      ),
    },
    {
      title: 'Balance',
      dataIndex: 'balance',
      key: 'balance',
      render: (text) => text === 'Error' ? 
        <Text type="danger">Failed to fetch</Text> : 
        `${formatBalance(text)} tokens`,
    },
  ];

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <div>
          <Title level={4} style={{ marginBottom: '16px' }}>Token Balances</Title>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Input
              placeholder="Enter Ethereum address"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                if (!e.target.value) {
                  setSkip(true);
                }
              }}
              style={{ flex: 1 }}
              status={error ? 'error' : undefined}
            />
            <Button type="primary" onClick={handleCheckBalance} loading={isLoading}>
              Check
            </Button>
          </div>
          {error && (
            <Text type="danger" style={{ display: 'block', marginTop: '8px' }}>
              {typeof error === 'object' ? 'Failed to fetch balance' : error}
            </Text>
          )}
          {balance && !error && (
            <Text style={{ display: 'block', marginTop: '8px' }}>
              Balance: {formatBalance(balance)} tokens
            </Text>
          )}
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <Text strong>Account Balances</Text>
            <Button size="small" onClick={handleCheckAllBalances}>Refresh All</Button>
          </div>
          <Table
            dataSource={balances}
            columns={columns}
            rowKey="address"
            pagination={false}
            size="small"
            scroll={{ y: 200 }}
          />
        </div>
      </Space>
    </Card>
  );
}

export default TokenBalance; 