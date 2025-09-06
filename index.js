import { createRGB20Contract } from './src/rgb20Contract.js';

/**
 * Network parameters
 */
const NETWORKS = {
  bitcoin: { pubKeyHash: 0x00, scriptHash: 0x05, wif: 0x80, bech32: 'bc' },
  testnet: { pubKeyHash: 0x6f, scriptHash: 0xc4, wif: 0xef, bech32: 'tb' },
  liquid: { pubKeyHash: 0x39, scriptHash: 0x27, wif: 0x80, bech32: 'ex', assetHRP: 'a' },
  liquidtestnet: { pubKeyHash: 0x6f, scriptHash: 0xc4, wif: 0xef, bech32: 'tex', assetHRP: 'ta' }
};

// Select network via URL parameter or default to mainnet
const urlParams = new URLSearchParams(window.location.search);
const networkName = urlParams.get('network') || 'bitcoin';
const NETWORK = NETWORKS[networkName];
console.log(`Selected network: ${networkName}`, NETWORK);

/**
 * Example: create RGB20 contract on selected network
 */
function testContract() {
    // Example genesis UTXO for testnet/mainnet (replace with real one)
    const exampleUTXO = networkName.includes('testnet') ? 
        'f1c2...abcd:0' : 'a1b2...1234:0';

    const contractParams = {
        ticker: 'TST',
        name: 'TestToken',
        precision: 8,
        contractTerms: `RGB20 token on ${networkName}`,
        totalSupply: 1000000,
        genesisUtxo: exampleUTXO
    };

    const contract = createRGB20Contract(contractParams);
    console.log('Contract ID:', contract.contractId);
    return contract;
}

// Run test
const contract = testContract();

/**
 * Optional: UI network selector
 */
const networkSelect = document.getElementById('networkSelect');
if (networkSelect) {
    networkSelect.value = networkName;
    networkSelect.addEventListener('change', (e) => {
        const selected = e.target.value;
        window.location.search = '?network=' + selected;
    });
}
