/**
 * @fileoverview RGB20 Contract Creation Library
 * 
 * This module provides RGB20 token contract creation using StrictEncode for
 * deterministic serialization and BAID64 for hash encoding with HRI prefixes.
 * 
 * @author RGB Community
 * @license Apache-2.0
 */

import { StrictEncoder, RGB20Encoder } from 'strictencode';
import { encode as baid64Encode } from 'baid64';
import { createHash } from 'crypto';

/**
 * RGB20 contract creation and encoding utilities.
 */


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

export class RGB20Contract {
    /**
     * Create a new RGB20 contract instance.
     * @param {Object} params - Contract parameters
     * @param {string} params.ticker - Asset ticker symbol
     * @param {string} params.name - Asset name
     * @param {number} params.precision - Decimal precision (0-18)
     * @param {string} params.contractTerms - Contract terms text
     * @param {number|bigint} params.totalSupply - Total token supply
     * @param {string} params.genesisUtxo - Genesis UTXO in format "txid:vout"
     */
    constructor(params) {
        this.ticker = params.ticker;
        this.name = params.name;
        this.precision = params.precision;
        this.contractTerms = params.contractTerms;
        this.totalSupply = BigInt(params.totalSupply);
        this.genesisUtxo = params.genesisUtxo;
        
        this._validateParams();
    }

    /**
     * Validate contract parameters.
     * @private
     */
    _validateParams() {
        if (!this.ticker || typeof this.ticker !== 'string') {
            throw new Error('Ticker must be a non-empty string');
        }
        if (!this.name || typeof this.name !== 'string') {
            throw new Error('Name must be a non-empty string');
        }
        if (!Number.isInteger(this.precision) || this.precision < 0 || this.precision > 18) {
            throw new Error('Precision must be an integer between 0-18');
        }
        if (!this.contractTerms || typeof this.contractTerms !== 'string') {
            throw new Error('Contract terms must be a non-empty string');
        }
        if (this.totalSupply <= 0n) {
            throw new Error('Total supply must be positive');
        }
        if (!this.genesisUtxo || !/^[0-9a-f]{64}:[0-9]+$/i.test(this.genesisUtxo)) {
            throw new Error('Genesis UTXO must be in format "txid:vout"');
        }
    }

    /**
     * Create the asset specification structure.
     * @returns {Object} AssetSpec structure
     */
    createAssetSpec() {
        return {
            ticker: this.ticker,
            name: this.name,
            precision: this.precision,
            details: null
        };
    }

    /**
     * Create the contract terms structure.
     * @returns {Object} ContractTerms structure
     */
    createContractTerms() {
        return {
            text: this.contractTerms,
            media: null
        };
    }

    /**
     * Encode the complete RGB20 contract using StrictEncode.
     * @returns {string} Hex-encoded contract data
     */
    encodeContract() {
        const encoder = new StrictEncoder();
        
        // Encode AssetSpec
        const assetSpec = this.createAssetSpec();
        const assetSpecHex = RGB20Encoder.encodeAssetSpec(assetSpec);
        encoder._appendBytes(new Uint8Array(Buffer.from(assetSpecHex, 'hex')));
        
        // Encode ContractTerms
        const contractTerms = this.createContractTerms();
        const contractTermsHex = RGB20Encoder.encodeContractTerms(contractTerms);
        encoder._appendBytes(new Uint8Array(Buffer.from(contractTermsHex, 'hex')));
        
        // Encode Amount (total supply)
        const amountHex = RGB20Encoder.encodeAmount(this.totalSupply);
        encoder._appendBytes(new Uint8Array(Buffer.from(amountHex, 'hex')));
        
        // Encode Genesis UTXO
        const [txid, vout] = this.genesisUtxo.split(':');
        const txidBytes = new Uint8Array(Buffer.from(txid, 'hex').reverse()); // Little-endian
        const voutNum = parseInt(vout);
        
        encoder._appendBytes(txidBytes);
        encoder.encodeU32(voutNum);
        
        return encoder.toHex();
    }

    /**
     * Create contract hash from encoded data.
     * @returns {string} SHA256 hash of contract data (hex)
     */
    createContractHash() {
        const encodedData = this.encodeContract();
        const hash = createHash('sha256');
        hash.update(Buffer.from(encodedData, 'hex'));
        return hash.digest('hex');
    }

    /**
     * Create BAID64 encoded contract ID with HRI prefix.
     * @returns {string} BAID64 encoded contract ID with "contract:" prefix
     */
    createContractId() {
        const contractHash = this.createContractHash();
        const hashBytes = new Uint8Array(Buffer.from(contractHash, 'hex'));
        return baid64Encode(hashBytes, { 
            hri: 'contract', 
            prefix: true, 
            embedChecksum: true,
            chunking: true,
            chunkFirst: 8,
            chunkLen: 7
        });
    }

    /**
     * Generate detailed encoding breakdown for verbose mode.
     * @returns {Object} Detailed encoding information
     */
    generateVerboseContract() {
        const assetSpec = this.createAssetSpec();
        const contractTerms = this.createContractTerms();
        const [txid, vout] = this.genesisUtxo.split(':');
        
        // Step 1: Encode AssetSpec
        const assetSpecHex = RGB20Encoder.encodeAssetSpec(assetSpec);
        
        // Step 2: Encode ContractTerms  
        const contractTermsHex = RGB20Encoder.encodeContractTerms(contractTerms);
        
        // Step 3: Encode Amount (total supply)
        const amountHex = RGB20Encoder.encodeAmount(this.totalSupply);
        
        // Step 4: Encode Genesis UTXO
        const txidBytes = Buffer.from(txid, 'hex').reverse(); // Little-endian
        const txidHex = Buffer.from(txidBytes).toString('hex');
        const voutNum = parseInt(vout);
        const voutEncoder = new StrictEncoder();
        voutEncoder.encodeU32(voutNum);
        const voutHex = voutEncoder.toHex();
        const utxoHex = txidHex + voutHex;
        
        // Step 5: Concatenate all parts
        const fullEncodedData = assetSpecHex + contractTermsHex + amountHex + utxoHex;
        
        // Step 6: Create hash
        const hash = createHash('sha256');
        hash.update(Buffer.from(fullEncodedData, 'hex'));
        const contractHash = hash.digest('hex');
        
        // Step 7: BAID64 encoding
        const hashBytes = new Uint8Array(Buffer.from(contractHash, 'hex'));
        const contractId = baid64Encode(hashBytes, { 
            hri: 'contract', 
            prefix: true, 
            embedChecksum: true,
            chunking: true,
            chunkFirst: 8,
            chunkLen: 7
        });
        
        return {
            // Input parameters
            input: {
                ticker: this.ticker,
                name: this.name,
                precision: this.precision,
                contractTerms: this.contractTerms,
                totalSupply: this.totalSupply.toString(),
                genesisUtxo: this.genesisUtxo
            },
            
            // Detailed encoding breakdown
            encoding: {
                step1_assetSpec: {
                    description: 'Encode AssetSpec (ticker, name, precision, details)',
                    structure: assetSpec,
                    encoded: assetSpecHex,
                    length: assetSpecHex.length / 2,
                    breakdown: {
                        ticker_length: `0x${assetSpecHex.substring(0, 2)} (${this.ticker.length})`,
                        ticker_utf8: `0x${assetSpecHex.substring(2, 2 + this.ticker.length * 2)} ("${this.ticker}")`,
                        name_length: `0x${assetSpecHex.substring(2 + this.ticker.length * 2, 4 + this.ticker.length * 2)} (${this.name.length})`,
                        name_utf8: `0x${assetSpecHex.substring(4 + this.ticker.length * 2, 4 + (this.ticker.length + this.name.length) * 2)} ("${this.name}")`,
                        precision: `0x${assetSpecHex.slice(-4, -2)} (${this.precision})`,
                        details_option: `0x${assetSpecHex.slice(-2)} (None)`
                    }
                },
                
                step2_contractTerms: {
                    description: 'Encode ContractTerms (text, media)',
                    structure: contractTerms,
                    encoded: contractTermsHex,
                    length: contractTermsHex.length / 2,
                    breakdown: {
                        text_length: `0x${contractTermsHex.substring(0, 2)} (${this.contractTerms.length})`,
                        text_utf8: `0x${contractTermsHex.substring(2, 2 + this.contractTerms.length * 2)} ("${this.contractTerms}")`,
                        media_option: `0x${contractTermsHex.slice(-2)} (None)`
                    }
                },
                
                step3_amount: {
                    description: 'Encode Amount (u64 little-endian)',
                    value: this.totalSupply.toString(),
                    encoded: amountHex,
                    length: amountHex.length / 2,
                    breakdown: `0x${amountHex} (${this.totalSupply} as u64 LE)`
                },
                
                step4_genesisUtxo: {
                    description: 'Encode Genesis UTXO (txid reversed + vout u32 LE)',
                    txid: txid,
                    vout: voutNum,
                    encoded: utxoHex,
                    length: utxoHex.length / 2,
                    breakdown: {
                        txid_reversed: `0x${txidHex} (${txid} reversed for LE)`,
                        vout_u32: `0x${voutHex} (${voutNum} as u32 LE)`
                    }
                },
                
                step5_concatenation: {
                    description: 'Concatenate all encoded parts',
                    parts: [
                        `AssetSpec: ${assetSpecHex}`,
                        `ContractTerms: ${contractTermsHex}`, 
                        `Amount: ${amountHex}`,
                        `GenesisUTXO: ${utxoHex}`
                    ],
                    result: fullEncodedData,
                    totalLength: fullEncodedData.length / 2
                }
            },
            
            // Hashing step
            hashing: {
                step6_sha256: {
                    description: 'SHA256 hash of concatenated data',
                    input: fullEncodedData,
                    inputLength: fullEncodedData.length / 2,
                    hash: contractHash,
                    hashLength: 32
                }
            },
            
            // BAID64 encoding step
            baid64: {
                step7_encoding: {
                    description: 'BAID64 encode hash with HRI prefix, checksum and chunking',
                    hashInput: contractHash,
                    hri: 'contract',
                    options: {
                        prefix: true,
                        embedChecksum: true,
                        chunking: true,
                        chunkFirst: 8,
                        chunkLen: 7
                    },
                    result: contractId,
                    breakdown: `HRI "contract:" + chunked BAID64(${contractHash}) + embedded checksum (8-7-7-7-7 format)`
                }
            },
            
            // Final results
            results: {
                encodedData: fullEncodedData,
                contractHash: contractHash,
                contractId: contractId,
                encodedLength: fullEncodedData.length / 2,
                timestamp: new Date().toISOString()
            }
        };
    }

    /**
     * Generate complete contract summary.
     * @returns {Object} Complete contract information
     */
    generateContract() {
        const encodedData = this.encodeContract();
        const contractHash = this.createContractHash();
        const contractId = this.createContractId();
        
        return {
            // Input parameters
            ticker: this.ticker,
            name: this.name,
            precision: this.precision,
            contractTerms: this.contractTerms,
            totalSupply: this.totalSupply.toString(),
            genesisUtxo: this.genesisUtxo,
            
            // Generated data
            assetSpec: this.createAssetSpec(),
            contractTermsStruct: this.createContractTerms(),
            encodedData,
            contractHash,
            contractId,
            
            // Metadata
            encodedLength: encodedData.length / 2,
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * Quick contract creation helper function.
 * @param {Object} params - Contract parameters
 * @returns {Object} Complete contract information
 */
export function createRGB20Contract(params) {
    const contract = new RGB20Contract(params);
    return contract.generateContract();
}

/**
 * Batch create multiple RGB20 contracts.
 * @param {Array<Object>} contractsParams - Array of contract parameters
 * @returns {Array<Object>} Array of complete contract information
 */
export function createRGB20Contracts(contractsParams) {
    return contractsParams.map(params => createRGB20Contract(params));
}

/**
 * Validate RGB20 contract parameters without creating the contract.
 * @param {Object} params - Contract parameters to validate
 * @returns {boolean} True if valid
 * @throws {Error} If validation fails
 */
export function validateRGB20Params(params) {
    try {
        new RGB20Contract(params);
        return true;
    } catch (error) {
        throw error;
    }
}
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

export default RGB20Contract;
