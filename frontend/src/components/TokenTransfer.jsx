import { Card, Form, Input, Button, Typography, message, Space, Row, Col } from 'antd';
import { useState } from 'react';
import { useTransferTokensMutation, useGetBalanceQuery } from '../store/apiSlice';

const { Title, Text } = Typography;

function TokenTransfer() {
  const [form] = Form.useForm();
  const [transferTokens, { isLoading }] = useTransferTokensMutation();
  const [sourceAddress, setSourceAddress] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [showBalances, setShowBalances] = useState(false);

  // Query for source address balance
  const { data: sourceBalance, refetch: refetchSourceBalance } = useGetBalanceQuery(sourceAddress, {
    skip: !sourceAddress || !showBalances,
  });

  // Query for recipient address balance
  const { data: recipientBalance, refetch: refetchRecipientBalance } = useGetBalanceQuery(recipientAddress, {
    skip: !recipientAddress || !showBalances,
  });

  const formatBalance = (balance) => {
    if (!balance) return '0';
    const balanceInTokens = Number(balance) / 1e18;
    return balanceInTokens.toLocaleString();
  };

  const handleTransfer = async (values) => {
    try {
      await transferTokens({
        from: values.from,
        to: values.to,
        amount: values.amount,
      }).unwrap();
      message.success('Transfer successful');
      
      // Update addresses and show balances
      setSourceAddress(values.from);
      setRecipientAddress(values.to);
      setShowBalances(true);
      
      // Fetch updated balances
      await Promise.all([
        refetchSourceBalance(),
        refetchRecipientBalance()
      ]);
      
      form.resetFields();
    } catch (error) {
      message.error(error.data || 'Transfer failed');
    }
  };

  const handleRefreshBalances = async () => {
    try {
      await Promise.all([
        refetchSourceBalance(),
        refetchRecipientBalance()
      ]);
      message.success('Balances updated');
    } catch (error) {
      message.error('Failed to update balances');
    }
  };

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Title level={4} style={{ marginBottom: '16px' }}>Transfer Tokens</Title>
        <Form
          form={form}
          onFinish={handleTransfer}
          layout="vertical"
          requiredMark={false}
        >
          <Form.Item
            name="from"
            label="Source Address"
            rules={[
              { required: true, message: 'Please enter source address' },
              { pattern: /^0x[a-fA-F0-9]{40}$/, message: 'Invalid Ethereum address' }
            ]}
          >
            <Input placeholder="0x..." />
          </Form.Item>

          <Form.Item
            name="to"
            label="Recipient Address"
            rules={[
              { required: true, message: 'Please enter recipient address' },
              { pattern: /^0x[a-fA-F0-9]{40}$/, message: 'Invalid Ethereum address' }
            ]}
          >
            <Input placeholder="0x..." />
          </Form.Item>

          <Form.Item
            name="amount"
            label="Amount"
            rules={[
              { required: true, message: 'Please enter amount' },
              { pattern: /^\d+$/, message: 'Amount must be a whole number' }
            ]}
          >
            <Input type="number" min="1" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={isLoading} block>
              Transfer
            </Button>
          </Form.Item>
        </Form>

        {showBalances && (sourceBalance || recipientBalance) && (
          <Card 
            size="small" 
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Updated Balances</span>
                <Button size="small" onClick={handleRefreshBalances}>
                  Refresh
                </Button>
              </div>
            } 
            style={{ marginTop: '16px' }}
          >
            <Row gutter={[16, 16]}>
              {sourceAddress && (
                <Col span={24}>
                  <Card size="small" type="inner">
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Text strong>Source Address</Text>
                      <Text copyable>{sourceAddress}</Text>
                      <Text strong style={{ fontSize: '16px' }}>
                        {formatBalance(sourceBalance)} tokens
                      </Text>
                    </Space>
                  </Card>
                </Col>
              )}
              {recipientAddress && (
                <Col span={24}>
                  <Card size="small" type="inner">
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Text strong>Recipient Address</Text>
                      <Text copyable>{recipientAddress}</Text>
                      <Text strong style={{ fontSize: '16px' }}>
                        {formatBalance(recipientBalance)} tokens
                      </Text>
                    </Space>
                  </Card>
                </Col>
              )}
            </Row>
          </Card>
        )}
      </Space>
    </Card>
  );
}

export default TokenTransfer; 