import { Card, Form, Input, Button, Typography, message, Space, Table, Tag, Divider } from 'antd';
import { useState } from 'react';
import { CheckOutlined, StopOutlined, EyeOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

function TokenApproval() {
  const [form] = Form.useForm();
  const [allowanceForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [allowances, setAllowances] = useState([]);
  const [checkingAllowance, setCheckingAllowance] = useState(false);

  const approveTokens = async (values) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner: values.owner,
          spender: values.spender,
          amount: values.amount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Approval failed');
      }

      const result = await response.json();
      message.success('Token approval successful! / 代币授权成功！');
      
      // Add to transaction history
      if (window.addTransactionToHistory) {
        window.addTransactionToHistory({
          type: 'approval',
          from: values.owner,
          to: values.spender,
          amount: values.amount,
          status: 'success',
          hash: result.transactionHash
        });
      }

      form.resetFields();
    } catch (error) {
      console.error('Approval error:', error);
      message.error(`Approval failed: ${error.message} / 授权失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkAllowance = async (values) => {
    setCheckingAllowance(true);
    try {
      const response = await fetch(`http://localhost:3000/allowance/${values.owner}/${values.spender}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check allowance');
      }

      const result = await response.json();
      const allowanceAmount = (Number(result.allowance) / 1e18).toLocaleString();
      
      const newAllowance = {
        id: Date.now(),
        owner: values.owner,
        spender: values.spender,
        allowance: allowanceAmount,
        timestamp: new Date().toLocaleString(),
      };

      setAllowances(prev => [newAllowance, ...prev.slice(0, 9)]); // Keep last 10 checks
      message.success(`Allowance: ${allowanceAmount} STK / 授权额度: ${allowanceAmount} STK`);
      
      allowanceForm.resetFields();
    } catch (error) {
      console.error('Allowance check error:', error);
      message.error(`Failed to check allowance: ${error.message} / 检查授权额度失败: ${error.message}`);
    } finally {
      setCheckingAllowance(false);
    }
  };

  const revokeApproval = async (owner, spender) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner,
          spender,
          amount: '0', // Set allowance to 0 to revoke
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Revoke failed');
      }

      message.success('Approval revoked successfully! / 授权已成功撤销！');
      
      // Update allowances list
      setAllowances(prev => prev.map(a => 
        a.owner === owner && a.spender === spender 
          ? { ...a, allowance: '0', timestamp: new Date().toLocaleString() }
          : a
      ));

      // Add to transaction history
      if (window.addTransactionToHistory) {
        window.addTransactionToHistory({
          type: 'revoke',
          from: owner,
          to: spender,
          amount: '0',
          status: 'success',
          hash: `revoke_${Date.now()}`
        });
      }
    } catch (error) {
      console.error('Revoke error:', error);
      message.error(`Revoke failed: ${error.message} / 撤销失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const columns = [
    {
      title: 'Owner / 所有者',
      dataIndex: 'owner',
      key: 'owner',
      render: (owner) => (
        <Text copyable style={{ fontSize: '12px' }}>
          {formatAddress(owner)}
        </Text>
      ),
    },
    {
      title: 'Spender / 支出者',
      dataIndex: 'spender',
      key: 'spender',
      render: (spender) => (
        <Text copyable style={{ fontSize: '12px' }}>
          {formatAddress(spender)}
        </Text>
      ),
    },
    {
      title: 'Allowance / 授权额度',
      dataIndex: 'allowance',
      key: 'allowance',
      render: (allowance) => (
        <Text strong style={{ color: Number(allowance.replace(/,/g, '')) > 0 ? 'green' : 'red' }}>
          {allowance} STK
        </Text>
      ),
    },
    {
      title: 'Checked At / 检查时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp) => <Text type="secondary">{timestamp}</Text>,
    },
    {
      title: 'Actions / 操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="text" 
            size="small"
            icon={<EyeOutlined />}
            onClick={() => checkAllowance({ owner: record.owner, spender: record.spender })}
          >
            Refresh / 刷新
          </Button>
          {Number(record.allowance.replace(/,/g, '')) > 0 && (
            <Button 
              type="text" 
              danger 
              size="small"
              icon={<StopOutlined />}
              onClick={() => revokeApproval(record.owner, record.spender)}
              loading={loading}
            >
              Revoke / 撤销
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Title level={4}>Token Approval Management / 代币授权管理</Title>
        
        <Card size="small" title="Approve Tokens / 授权代币" type="inner">
          <Form form={form} onFinish={approveTokens} layout="vertical">
            <Form.Item
              name="owner"
              label="Owner Address (Your Address) / 所有者地址（您的地址）"
              rules={[
                { required: true, message: 'Please enter owner address / 请输入所有者地址' },
                { pattern: /^0x[a-fA-F0-9]{40}$/, message: 'Invalid Ethereum address / 无效的以太坊地址' }
              ]}
            >
              <Input placeholder="0x..." />
            </Form.Item>

            <Form.Item
              name="spender"
              label="Spender Address (Who can spend) / 支出者地址（谁可以支出）"
              rules={[
                { required: true, message: 'Please enter spender address / 请输入支出者地址' },
                { pattern: /^0x[a-fA-F0-9]{40}$/, message: 'Invalid Ethereum address / 无效的以太坊地址' }
              ]}
            >
              <Input placeholder="0x..." />
            </Form.Item>

            <Form.Item
              name="amount"
              label="Amount to Approve / 授权数量"
              rules={[
                { required: true, message: 'Please enter amount / 请输入数量' },
                { pattern: /^\d+$/, message: 'Please enter a valid number / 请输入有效数字' }
              ]}
            >
              <Input type="number" min="1" placeholder="1000" />
            </Form.Item>

            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              icon={<CheckOutlined />}
              style={{ width: '100%' }}
            >
              Approve Tokens / 授权代币
            </Button>
          </Form>
        </Card>

        <Divider />

        <Card size="small" title="Check Allowance / 检查授权额度" type="inner">
          <Form form={allowanceForm} onFinish={checkAllowance} layout="vertical">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', alignItems: 'end' }}>
              <Form.Item
                name="owner"
                label="Owner Address / 所有者地址"
                rules={[
                  { required: true, message: 'Please enter owner address / 请输入所有者地址' },
                  { pattern: /^0x[a-fA-F0-9]{40}$/, message: 'Invalid address / 无效地址' }
                ]}
              >
                <Input placeholder="0x..." />
              </Form.Item>

              <Form.Item
                name="spender"
                label="Spender Address / 支出者地址"
                rules={[
                  { required: true, message: 'Please enter spender address / 请输入支出者地址' },
                  { pattern: /^0x[a-fA-F0-9]{40}$/, message: 'Invalid address / 无效地址' }
                ]}
              >
                <Input placeholder="0x..." />
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={checkingAllowance}
                  icon={<EyeOutlined />}
                >
                  Check / 检查
                </Button>
              </Form.Item>
            </div>
          </Form>
        </Card>

        {allowances.length > 0 && (
          <>
            <Divider />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text strong>Recent Allowance Checks / 最近的授权检查</Text>
              <Button 
                size="small" 
                onClick={() => setAllowances([])}
              >
                Clear History / 清除历史
              </Button>
            </div>

            <Table
              dataSource={allowances}
              columns={columns}
              rowKey="id"
              pagination={false}
              size="small"
              scroll={{ x: 700 }}
            />
          </>
        )}

        <Card size="small" type="inner">
          <Text type="secondary" style={{ fontSize: '12px' }}>
            <strong>Note / 注意:</strong><br />
            • Approval allows another address to spend your tokens on your behalf / 授权允许其他地址代表您支出代币<br />
            • Always verify the spender address before approving / 授权前请务必验证支出者地址<br />
            • You can revoke approval by setting the amount to 0 / 您可以通过将数量设置为 0 来撤销授权<br />
            • Check allowances regularly for security / 定期检查授权额度以确保安全
          </Text>
        </Card>
      </Space>
    </Card>
  );
}

export default TokenApproval; 