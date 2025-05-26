import { Card, Button, Typography, message } from 'antd';
import { useGetContractInfoQuery, useDeployContractMutation } from '../store/apiSlice';

const { Title, Text } = Typography;

function ContractDeployment() {
  const { data: contractInfo, isLoading: isLoadingInfo } = useGetContractInfoQuery();
  const [deployContract, { isLoading: isDeploying }] = useDeployContractMutation();

  const handleDeploy = async () => {
    try {
      await deployContract().unwrap();
      message.success('Contract deployed successfully!');
    } catch (error) {
      message.error('Failed to deploy contract');
    }
  };

  return (
    <Card>
      <Title level={4}>Smart Contract</Title>
      {contractInfo ? (
        <div>
          <Text>Contract Address: {contractInfo.address}</Text>
          <br />
          <Text type="secondary">Contract is deployed and ready to use</Text>
        </div>
      ) : (
        <div>
          <Text type="warning">Contract is not deployed</Text>
          <br />
          <Button
            type="primary"
            onClick={handleDeploy}
            loading={isDeploying}
            style={{ marginTop: '16px' }}
          >
            Deploy Contract
          </Button>
        </div>
      )}
    </Card>
  );
}

export default ContractDeployment; 