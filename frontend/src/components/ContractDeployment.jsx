import { Card, Button, Typography, message, Space, Descriptions, Alert, Spin } from 'antd';
import { useState } from 'react';
import { useGetContractInfoQuery, useDeployContractMutation } from '../store/apiSlice';

const { Title, Text, Paragraph } = Typography;

function ContractDeployment() {
  const { data: contractInfo, isLoading: isLoadingInfo, refetch } = useGetContractInfoQuery();
  const [deployContract, { isLoading: isDeploying }] = useDeployContractMutation();
  const [deploymentDetails, setDeploymentDetails] = useState(null);

  const handleDeploy = async () => {
    try {
      const result = await deployContract().unwrap();
      setDeploymentDetails(result);
      message.success('Contract deployed successfully!');
      refetch(); // Refresh contract info
    } catch (error) {
      console.error('Deployment error:', error);
      message.error(`Failed to deploy contract: ${error.data || error.message}`);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    message.success('Copied to clipboard!');
  };

  if (isLoadingInfo) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size="large" />
          <Paragraph>Loading contract information...</Paragraph>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Title level={4}>Smart Contract Management / 智能合约管理</Title>
        
        {contractInfo ? (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Alert
              message="Contract Deployed Successfully / 合约部署成功"
              description="Your ERC-20 token contract is ready to use / 您的 ERC-20 代币合约已准备就绪"
              type="success"
              showIcon
            />
            
            <Descriptions title="Contract Details / 合约详情" bordered column={1}>
              <Descriptions.Item label="Contract Address / 合约地址">
                <Text copyable={{ onCopy: () => copyToClipboard(contractInfo.address) }}>
                  {contractInfo.address}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Token Name / 代币名称">
                Simple Token
              </Descriptions.Item>
              <Descriptions.Item label="Token Symbol / 代币符号">
                STK
              </Descriptions.Item>
              <Descriptions.Item label="Decimals / 小数位数">
                18
              </Descriptions.Item>
              <Descriptions.Item label="Total Supply / 总供应量">
                1,000,000 STK
              </Descriptions.Item>
              <Descriptions.Item label="Network / 网络">
                Ganache Local (localhost:8545)
              </Descriptions.Item>
            </Descriptions>

            <Button 
              type="primary" 
              danger 
              onClick={handleDeploy} 
              loading={isDeploying}
              style={{ width: '100%' }}
            >
              Redeploy Contract / 重新部署合约
            </Button>
          </Space>
        ) : (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Alert
              message="No Contract Deployed / 未部署合约"
              description="Deploy your ERC-20 token contract to start using the DApp / 部署您的 ERC-20 代币合约以开始使用 DApp"
              type="warning"
              showIcon
            />
            
            <Descriptions title="Contract Specifications / 合约规格" bordered column={1}>
              <Descriptions.Item label="Token Name / 代币名称">
                Simple Token
              </Descriptions.Item>
              <Descriptions.Item label="Token Symbol / 代币符号">
                STK
              </Descriptions.Item>
              <Descriptions.Item label="Decimals / 小数位数">
                18
              </Descriptions.Item>
              <Descriptions.Item label="Initial Supply / 初始供应量">
                1,000,000 STK
              </Descriptions.Item>
              <Descriptions.Item label="Standard / 标准">
                ERC-20
              </Descriptions.Item>
            </Descriptions>

            <Button
              type="primary"
              size="large"
              onClick={handleDeploy}
              loading={isDeploying}
              style={{ width: '100%', height: '50px' }}
            >
              {isDeploying ? 'Deploying Contract... / 正在部署合约...' : 'Deploy Contract / 部署合约'}
            </Button>
          </Space>
        )}

        {deploymentDetails && (
          <Alert
            message="Latest Deployment / 最新部署"
            description={
              <Space direction="vertical">
                <Text>Contract Address: {deploymentDetails.address}</Text>
                <Text>Deployment successful at {new Date().toLocaleString()}</Text>
              </Space>
            }
            type="info"
            showIcon
            closable
          />
        )}
      </Space>
    </Card>
  );
}

export default ContractDeployment; 