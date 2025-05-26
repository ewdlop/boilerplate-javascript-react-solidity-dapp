import { Card, Table, Typography, Button, Space, Tag, Input, Select, DatePicker, message } from 'antd';
import { useState, useEffect } from 'react';
import { DownloadOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Load transactions from localStorage
  const loadTransactions = () => {
    try {
      const stored = localStorage.getItem('transactionHistory');
      if (stored) {
        const parsedTransactions = JSON.parse(stored);
        setTransactions(parsedTransactions);
        setFilteredTransactions(parsedTransactions);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      message.error('Failed to load transaction history / 加载交易历史失败');
    }
  };

  // Save transactions to localStorage
  const saveTransactions = (newTransactions) => {
    try {
      localStorage.setItem('transactionHistory', JSON.stringify(newTransactions));
    } catch (error) {
      console.error('Error saving transactions:', error);
    }
  };

  // Add transaction to history (exposed globally)
  const addTransaction = (transaction) => {
    const newTransaction = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...transaction
    };
    
    const updatedTransactions = [newTransaction, ...transactions];
    setTransactions(updatedTransactions);
    setFilteredTransactions(updatedTransactions);
    saveTransactions(updatedTransactions);
  };

  // Expose addTransaction globally
  useEffect(() => {
    window.addTransactionToHistory = addTransaction;
    loadTransactions();
    
    return () => {
      delete window.addTransactionToHistory;
    };
  }, [transactions]);

  // Filter transactions
  useEffect(() => {
    let filtered = [...transactions];

    // Search filter
    if (searchText) {
      filtered = filtered.filter(tx => 
        tx.from?.toLowerCase().includes(searchText.toLowerCase()) ||
        tx.to?.toLowerCase().includes(searchText.toLowerCase()) ||
        tx.hash?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(tx => tx.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(tx => tx.type === typeFilter);
    }

    setFilteredTransactions(filtered);
  }, [transactions, searchText, statusFilter, typeFilter]);

  const clearHistory = () => {
    setTransactions([]);
    setFilteredTransactions([]);
    localStorage.removeItem('transactionHistory');
    message.success('Transaction history cleared / 交易历史已清除');
  };

  const exportTransactions = () => {
    try {
      const dataStr = JSON.stringify(filteredTransactions, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `transaction-history-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      message.success('Transaction history exported / 交易历史已导出');
    } catch (error) {
      console.error('Export error:', error);
      message.error('Failed to export transactions / 导出交易失败');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'green';
      case 'failed': return 'red';
      case 'pending': return 'orange';
      default: return 'default';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'transfer': return 'blue';
      case 'approval': return 'purple';
      case 'deployment': return 'gold';
      case 'revoke': return 'red';
      default: return 'default';
    }
  };

  const formatAddress = (address) => {
    if (!address) return 'N/A';
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const columns = [
    {
      title: 'Time / 时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp) => new Date(timestamp).toLocaleString(),
      width: 150,
      sorter: (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Type / 类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={getTypeColor(type)}>
          {type === 'transfer' ? 'Transfer / 转账' :
           type === 'approval' ? 'Approval / 授权' :
           type === 'deployment' ? 'Deploy / 部署' :
           type === 'revoke' ? 'Revoke / 撤销' : type}
        </Tag>
      ),
      width: 120,
    },
    {
      title: 'From / 发送方',
      dataIndex: 'from',
      key: 'from',
      render: (from) => (
        <Text copyable style={{ fontSize: '12px' }}>
          {formatAddress(from)}
        </Text>
      ),
      width: 120,
    },
    {
      title: 'To / 接收方',
      dataIndex: 'to',
      key: 'to',
      render: (to) => (
        <Text copyable style={{ fontSize: '12px' }}>
          {formatAddress(to)}
        </Text>
      ),
      width: 120,
    },
    {
      title: 'Amount / 数量',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => amount ? `${Number(amount).toLocaleString()} STK` : 'N/A',
      width: 120,
    },
    {
      title: 'Status / 状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status === 'success' ? 'Success / 成功' :
           status === 'failed' ? 'Failed / 失败' :
           status === 'pending' ? 'Pending / 待处理' : status}
        </Tag>
      ),
      width: 100,
    },
    {
      title: 'Hash / 哈希',
      dataIndex: 'hash',
      key: 'hash',
      render: (hash) => hash ? (
        <Text copyable style={{ fontSize: '12px' }}>
          {formatAddress(hash)}
        </Text>
      ) : 'N/A',
      width: 120,
    },
  ];

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4}>Transaction History / 交易历史</Title>
          <Space>
            <Button 
              icon={<ReloadOutlined />}
              onClick={loadTransactions}
            >
              Refresh / 刷新
            </Button>
            <Button 
              type="primary"
              icon={<DownloadOutlined />}
              onClick={exportTransactions}
              disabled={filteredTransactions.length === 0}
            >
              Export / 导出
            </Button>
            <Button 
              danger
              icon={<DeleteOutlined />}
              onClick={clearHistory}
              disabled={transactions.length === 0}
            >
              Clear / 清除
            </Button>
          </Space>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          <Input
            placeholder="Search by address or hash / 按地址或哈希搜索"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          
          <Select
            placeholder="Filter by status / 按状态筛选"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: '100%' }}
          >
            <Select.Option value="all">All Status / 所有状态</Select.Option>
            <Select.Option value="success">Success / 成功</Select.Option>
            <Select.Option value="failed">Failed / 失败</Select.Option>
            <Select.Option value="pending">Pending / 待处理</Select.Option>
          </Select>

          <Select
            placeholder="Filter by type / 按类型筛选"
            value={typeFilter}
            onChange={setTypeFilter}
            style={{ width: '100%' }}
          >
            <Select.Option value="all">All Types / 所有类型</Select.Option>
            <Select.Option value="transfer">Transfer / 转账</Select.Option>
            <Select.Option value="approval">Approval / 授权</Select.Option>
            <Select.Option value="deployment">Deployment / 部署</Select.Option>
            <Select.Option value="revoke">Revoke / 撤销</Select.Option>
          </Select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text>
            Showing {filteredTransactions.length} of {transactions.length} transactions / 
            显示 {filteredTransactions.length} / {transactions.length} 条交易
          </Text>
        </div>

        <Table
          dataSource={filteredTransactions}
          columns={columns}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} items / 第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
          scroll={{ x: 900 }}
          size="small"
          locale={{
            emptyText: 'No transactions found / 未找到交易记录'
          }}
        />

        <Text type="secondary" style={{ fontSize: '12px' }}>
          * Transaction history is stored locally in your browser / 
          * 交易历史存储在您的浏览器本地
        </Text>
      </Space>
    </Card>
  );
}

export default TransactionHistory; 