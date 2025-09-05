# RGB20 Contract Creator

[![npm version](https://badge.fury.io/js/rgb20.svg)](https://badge.fury.io/js/rgb20)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

A comprehensive RGB20 token contract creation library that combines **StrictEncode** deterministic binary serialization with **BAID64** encoding to generate contract hashes and human-readable identifiers.

## Features

- 🎨 **Complete RGB20 contract creation** with validation
- 🔧 **StrictEncode integration** for deterministic binary serialization  
- 🔐 **SHA256 hashing** of encoded contract data
- 🆔 **BAID64 encoding** with `contract:` HRI prefix and checksums
- 🖥️ **Rich CLI interface** with multiple output formats
- ✅ **Comprehensive validation** of all contract parameters
- 📦 **Dual module support** (ES modules + CommonJS)
- 🧪 **48 comprehensive tests** ensuring reliability

## Installation

```bash
npm install rgb20
```

## Quick Start

### Library Usage

```javascript
import { RGB20Contract, createRGB20Contract } from 'rgb20';

// Create a contract
const contract = createRGB20Contract({
    ticker: 'MYTOKEN',
    name: 'My Token',
    precision: 8,
    contractTerms: 'Token contract terms',
    totalSupply: 1000000,
    genesisUtxo: 'abcd1234...ef56:0'
});

console.log('Contract ID:', contract.contractId);
console.log('Contract Hash:', contract.contractHash);
```

### CLI Usage

```bash
# Create a contract
rgb20 create \
    --ticker "MYTOKEN" \
    --name "My Token" \
    --precision 8 \
    --terms "Token contract terms" \
    --supply 1000000 \
    --utxo "abcd1234...ef56:0"

# JSON output
rgb20 create --ticker "MYTOKEN" --name "My Token" \
    --precision 8 --terms "Terms" --supply 1000000 \
    --utxo "abcd...ef:0" --json

# Interactive mode
rgb20 interactive

# Show examples
rgb20 example
```

## API Reference

### RGB20Contract Class

#### Constructor

```javascript
const contract = new RGB20Contract({
    ticker: string,        // Asset ticker symbol
    name: string,          // Asset name
    precision: number,     // Decimal precision (0-18)
    contractTerms: string, // Contract terms text
    totalSupply: number,   // Total token supply
    genesisUtxo: string   // Genesis UTXO (txid:vout format)
});
```

#### Methods

- `createAssetSpec()` - Generate RGB20 AssetSpec structure
- `createContractTerms()` - Generate RGB20 ContractTerms structure  
- `encodeContract()` - StrictEncode the complete contract
- `createContractHash()` - Generate SHA256 hash of encoded data
- `createContractId()` - Generate BAID64 contract ID with HRI prefix
- `generateContract()` - Generate complete contract information

### Helper Functions

```javascript
import { createRGB20Contract, validateRGB20Params } from 'rgb20';

// Quick contract creation
const contract = createRGB20Contract(params);

// Validate parameters
const isValid = validateRGB20Params(params); // throws on invalid
```

## CLI Commands

### Contract Creation

```bash
rgb20 create [options]
```

**Required Options:**
- `--ticker <symbol>` - Asset ticker symbol
- `--name <name>` - Asset name  
- `--precision <0-18>` - Decimal precision
- `--terms <text>` - Contract terms
- `--supply <amount>` - Total supply
- `--utxo <txid:vout>` - Genesis UTXO

**Output Options:**
- `--json` - JSON format output
- `--hash-only` - Show only contract hash
- `--id-only` - Show only contract ID
- `--encoded-only` - Show only encoded data
- `--compact` - Compact JSON output

### Other Commands

- `rgb20 validate [options]` - Validate contract parameters
- `rgb20 example` - Show example with test vectors
- `rgb20 interactive` - Interactive contract creation
- `rgb20 help` - Show help information

## Example Output

```json
{
  "ticker": "NIATCKR",
  "name": "NIA asset name", 
  "precision": 0,
  "contractTerms": "NIA terms",
  "totalSupply": "666",
  "genesisUtxo": "22f0538e...2ac0:1",
  "contractHash": "74e6a36a7ba3948c43ed4653c1723f8426bbc8c038016b9439e59e804fbf5c95",
  "contractId": "contract:dOajanujlIxD7UZTwXI~hCa7yMA4AWuUOeWegE_~XJXV9~e0",
  "encodedData": "074e494154434b52...",
  "encodedLength": 80
}
```

## Technical Details

### Contract Structure

RGB20 contracts consist of:
1. **AssetSpec** - Ticker, name, precision, optional details
2. **ContractTerms** - Legal terms, optional media attachments
3. **Amount** - Total token supply (u64)
4. **Genesis UTXO** - Transaction output reference

### Encoding Process

1. **StrictEncode** each component using deterministic binary serialization
2. **Concatenate** all encoded components
3. **SHA256 hash** the complete encoded data
4. **BAID64 encode** the hash with `contract:` HRI prefix and embedded checksum

### Dependencies

- **[strictencode](../strictencode)** - Deterministic binary encoding
- **[baid64](../baid64)** - Base64 variant with HRI and checksums

## Test Vectors

The package includes comprehensive test vectors from the RGB20 specification:

```bash
# Run the specification test vector
rgb20 create \
    --ticker "NIATCKR" \
    --name "NIA asset name" \
    --precision 0 \
    --terms "NIA terms" \
    --supply 666 \
    --utxo "22f0538e189f32922e55daf6fa0b7120bc01de8520a9a4c80655fdaf70272ac0:1"
```

**Expected Output:**
- Contract Hash: `74e6a36a7ba3948c43ed4653c1723f8426bbc8c038016b9439e59e804fbf5c95`
- Contract ID: `contract:dOajanujlIxD7UZTwXI~hCa7yMA4AWuUOeWegE_~XJXV9~e0`

## Development

### Running Tests

```bash
npm test                # Run all tests
npm run test:watch      # Watch mode  
npm run test:coverage   # With coverage
```

### Building

```bash
npm run build:cjs       # Build CommonJS version
npm run lint           # Run linter
```

### Project Structure

```
rgb20/
├── index.js           # Main ES module
├── index.cjs          # CommonJS build
├── cli.js             # Command-line interface
├── package.json       # Package configuration
├── test/             # Test files
│   ├── rgb20-contract.test.js
│   └── cli.test.js
└── README.md         # This file
```

## Standards Compliance

- **RGB20** - RGB token standard specification
- **StrictEncode** - Deterministic binary serialization
- **BAID64** - Base64 variant with HRI prefixes
- **Node.js ESM** - Modern ES module support
- **Jest** - Comprehensive test coverage

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality  
4. Ensure all tests pass
5. Submit a pull request

## License

Apache-2.0 License - see [LICENSE](LICENSE) file for details.

## Links

- [RGB Website](https://rgb.tech)
- [RGB20 Specification](https://github.com/RGB-WG/rgb-core)
- [StrictEncode Package](../strictencode)
- [BAID64 Package](../baid64)
- [GitHub Repository](https://github.com/rgbjs/rgb20)

---

**RGB Community** | Building the future of Bitcoin smart contracts