const ganache = require('ganache');

const options = {
  wallet: {
    totalAccounts: 10,
    defaultBalance: 1000
  },
  server: {
    port: 8545,
    host: "127.0.0.1"
  },
  chain: {
    gasLimit: 8000000,
    hardfork: "london",
    vmErrorsOnRPCResponse: true
  },
  logging: {
    verbose: true
  }
};

const server = ganache.server(options);
server.listen(8545, () => {
  console.log('Ganache is running on http://127.0.0.1:8545');
  console.log('\nAvailable Accounts:');
  const accounts = server.provider.getInitialAccounts();
  Object.keys(accounts).forEach((address, index) => {
    console.log(`(${index}) ${address} (${accounts[address].balance} ETH)`);
  });
}); 