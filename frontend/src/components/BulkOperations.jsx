import { Card, Form, Input, Button, Typography, message, Space, Table, Tag, Divider } from 'antd';
import { useState } from 'react';
import { PlusOutlined, DeleteOutlined, SendOutlined } from '@ant-design/icons';
import { useTransferTokensMutation } from '../store/apiSlice';

const { Title, Text } = Typography;
const { TextArea } = Input;

function BulkOperations() {
  const [form] = Form.useForm();
  const [transferTokens, { isLoading }] = useTransferTokensMutation();
  const [recipients, setRecipients] = useState([]);
  const [bulkResults, setBulkResults] = useState([]);

  const addRecipient = () => {
    const values = form.getFieldsValue();
    if (!values.address || !values.amount) {
      message.error('Please enter both address and amount / 请输入地址和数量');
      return;
    }

    if (!values.address.match(/^0x[a-fA-F0-9]{40}$/)) {
      message.error('Invalid Ethereum address format / 无效的以太坊地址格式');
      return;
    }

    const newRecipient = {
      id: Date.now(),
      address: values.address,
      amount: values.amount,
      status: 'pending'
    };

    setRecipients([...recipients, newRecipient]);
    form.setFieldsValue({ address: '', amount: '' });
    message.success('Recipient added / 接收者已添加');
  };

  const removeRecipient = (id) => {
    setRecipients(recipients.filter(r => r.id !== id));
    message.success('Recipient removed / 接收者已移除');
  };

  const clearAllRecipients = () => {
    setRecipients([]);
    setBulkResults([]);
    message.success('All recipients cleared / 所有接收者已清除');
  };

  const parseBulkText = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    const newRecipients = [];

    lines.forEach((line, index) => {
      const parts = line.trim().split(/\s+|,/);
      if (parts.length >= 2) {
        const address = parts[0];
        const amount = parts[1];

        if (address.match(/^0x[a-fA-F0-9]{40}$/) && !isNaN(amount)) {
          newRecipients.push({
            id: Date.now() + index,
            address,
            amount,
            status: 'pending'
          });
        }
      }
    });

    if (newRecipients.length > 0) {
      setRecipients([...recipients, ...newRecipients]);
      message.success(`Added ${newRecipients.length} recipients / 已添加 ${newRecipients.length} 个接收者`);
    } else {
      message.error('No valid recipients found in text / 文本中未找到有效的接收者');
    }
  };

  const executeBulkTransfer = async () => {
    if (recipients.length === 0) {
      message.error('No recipients to transfer to / 没有要转账的接收者');
      return;
    }

    const sourceAddress = form.getFieldValue('sourceAddress');
    if (!sourceAddress) {
      message.error('Please enter source address / 请输入源地址');
      return;
    }

    setBulkResults([]);
    const results = [];

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      
      try {
        // Update status to processing
        setRecipients(prev => prev.map(r => 
          r.id === recipient.id ? { ...r, status: 'processing' } : r
        ));

        await transferTokens({
          from: sourceAddress,
          to: recipient.address,
          amount: recipient.amount,
        }).unwrap();

        // Update status to success
        setRecipients(prev => prev.map(r => 
          r.id === recipient.id ? { ...r, status: 'success' } : r
        ));

        results.push({
          ...recipient,
          status: 'success',
          message: 'Transfer successful / 转账成功'
        });

        // Add to transaction history
        if (window.addTransactionToHistory) {
          window.addTransactionToHistory({
            type: 'transfer',
            from: sourceAddress,
            to: recipient.address,
            amount: recipient.amount,
            status: 'success',
            hash: `bulk_${Date.now()}_${i}`
          });
        }

      } catch (error) {
        // Update status to failed
        setRecipients(prev => prev.map(r => 
          r.id === recipient.id ? { ...r, status: 'failed' } : r
        ));

        results.push({
          ...recipient,
          status: 'failed',
          message: error.data || error.message || 'Transfer failed / 转账失败'
        });
      }

      // Small delay between transfers
      if (i < recipients.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    setBulkResults(results);
    
    const successCount = results.filter(r => r.status === 'success').length;
    const failCount = results.filter(r => r.status === 'failed').length;
    
    message.info(`Bulk transfer completed: ${successCount} success, ${failCount} failed / 批量转账完成: ${successCount} 成功, ${failCount} 失败`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'green';
      case 'failed': return 'red';
      case 'processing': return 'orange';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: 'Address / 地址',
      dataIndex: 'address',
      key: 'address',
      render: (address) => (
        <Text copyable style={{ fontSize: '12px' }}>
          {`${address.slice(0, 10)}...${address.slice(-8)}`}
        </Text>
      ),
    },
    {
      title: 'Amount / 数量',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `${Number(amount).toLocaleString()} STK`,
    },
    {
      title: 'Status / 状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status === 'pending' ? 'Pending / 待处理' :
           status === 'processing' ? 'Processing / 处理中' :
           status === 'success' ? 'Success / 成功' :
           status === 'failed' ? 'Failed / 失败' : status}
        </Tag>
      ),
    },
    {
      title: 'Actions / 操作',
      key: 'actions',
      render: (_, record) => (
        <Button 
          type="text" 
          danger 
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => removeRecipient(record.id)}
          disabled={record.status === 'processing'}
        >
          Remove / 移除
        </Button>
      ),
    },
  ];

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Title level={4}>Bulk Operations / 批量操作</Title>
        
        <Form form={form} layout="vertical">
          <Form.Item
            name="sourceAddress"
            label="Source Address / 源地址"
            rules={[
              { required: true, message: 'Please enter source address / 请输入源地址' },
              { pattern: /^0x[a-fA-F0-9]{40}$/, message: 'Invalid Ethereum address / 无效的以太坊地址' }
            ]}
          >
            <Input placeholder="0x..." />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', alignItems: 'end' }}>
            <Form.Item
              name="address"
              label="Recipient Address / 接收地址"
            >
              <Input placeholder="0x..." />
            </Form.Item>
            
            <Form.Item
              name="amount"
              label="Amount / 数量"
            >
              <Input type="number" min="1" placeholder="100" />
            </Form.Item>
            
            <Form.Item>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={addRecipient}
              >
                Add / 添加
              </Button>
            </Form.Item>
          </div>
        </Form>

        <Divider>Bulk Import / 批量导入</Divider>
        
        <Form.Item
          label="Bulk Recipients (Format: address amount, one per line) / 批量接收者（格式：地址 数量，每行一个）"
        >
          <TextArea
            rows={4}
            placeholder="0x1234... 100&#10;0x5678... 200&#10;0x9abc... 150"
            onBlur={(e) => {
              if (e.target.value.trim()) {
                parseBulkText(e.target.value);
                e.target.value = '';
              }
            }}
          />
        </Form.Item>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong>Recipients ({recipients.length}) / 接收者 ({recipients.length})</Text>
          <Space>
            <Button onClick={clearAllRecipients} disabled={recipients.length === 0}>
              Clear All / 清除全部
            </Button>
            <Button 
              type="primary" 
              icon={<SendOutlined />}
              onClick={executeBulkTransfer}
              loading={isLoading}
              disabled={recipients.length === 0}
            >
              Execute Bulk Transfer / 执行批量转账
            </Button>
          </Space>
        </div>

        <Table
          dataSource={recipients}
          columns={columns}
          rowKey="id"
          pagination={false}
          size="small"
          scroll={{ x: 600 }}
          locale={{
            emptyText: 'No recipients added / 未添加接收者'
          }}
        />

        {bulkResults.length > 0 && (
          <Card size="small" title="Transfer Results / 转账结果" type="inner">
            <Space direction="vertical" style={{ width: '100%' }}>
              {bulkResults.map((result, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>{`${result.address.slice(0, 10)}...${result.address.slice(-8)}`}</Text>
                  <Tag color={getStatusColor(result.status)}>{result.message}</Tag>
                </div>
              ))}
            </Space>
          </Card>
        )}
      </Space>
    </Card>
  );
}

export default BulkOperations; 