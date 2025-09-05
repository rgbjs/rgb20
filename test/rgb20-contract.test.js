/**
 * @fileoverview Tests for RGB20Contract class
 */

import { RGB20Contract, createRGB20Contract, validateRGB20Params } from '../index.js';

describe('RGB20Contract', () => {
    const validParams = {
        ticker: 'NIATCKR',
        name: 'NIA asset name',
        precision: 0,
        contractTerms: 'NIA terms',
        totalSupply: 666,
        genesisUtxo: '22f0538e189f32922e55daf6fa0b7120bc01de8520a9a4c80655fdaf70272ac0:1'
    };

    describe('constructor', () => {
        test('creates contract with valid parameters', () => {
            const contract = new RGB20Contract(validParams);
            expect(contract.ticker).toBe('NIATCKR');
            expect(contract.name).toBe('NIA asset name');
            expect(contract.precision).toBe(0);
            expect(contract.contractTerms).toBe('NIA terms');
            expect(contract.totalSupply).toBe(666n);
            expect(contract.genesisUtxo).toBe('22f0538e189f32922e55daf6fa0b7120bc01de8520a9a4c80655fdaf70272ac0:1');
        });

        test('converts totalSupply to BigInt', () => {
            const contract = new RGB20Contract({
                ...validParams,
                totalSupply: '1000000'
            });
            expect(contract.totalSupply).toBe(1000000n);
        });

        test('throws on missing ticker', () => {
            expect(() => new RGB20Contract({
                ...validParams,
                ticker: ''
            })).toThrow('Ticker must be a non-empty string');
        });

        test('throws on missing name', () => {
            expect(() => new RGB20Contract({
                ...validParams,
                name: null
            })).toThrow('Name must be a non-empty string');
        });

        test('throws on invalid precision', () => {
            expect(() => new RGB20Contract({
                ...validParams,
                precision: -1
            })).toThrow('Precision must be an integer between 0-18');

            expect(() => new RGB20Contract({
                ...validParams,
                precision: 19
            })).toThrow('Precision must be an integer between 0-18');

            expect(() => new RGB20Contract({
                ...validParams,
                precision: 1.5
            })).toThrow('Precision must be an integer between 0-18');
        });

        test('throws on invalid total supply', () => {
            expect(() => new RGB20Contract({
                ...validParams,
                totalSupply: 0
            })).toThrow('Total supply must be positive');

            expect(() => new RGB20Contract({
                ...validParams,
                totalSupply: -100
            })).toThrow('Total supply must be positive');
        });

        test('throws on invalid genesis UTXO format', () => {
            expect(() => new RGB20Contract({
                ...validParams,
                genesisUtxo: 'invalid'
            })).toThrow('Genesis UTXO must be in format "txid:vout"');

            expect(() => new RGB20Contract({
                ...validParams,
                genesisUtxo: 'abcd:notanumber'
            })).toThrow('Genesis UTXO must be in format "txid:vout"');
        });
    });

    describe('createAssetSpec', () => {
        test('creates correct asset specification', () => {
            const contract = new RGB20Contract(validParams);
            const assetSpec = contract.createAssetSpec();
            
            expect(assetSpec).toEqual({
                ticker: 'NIATCKR',
                name: 'NIA asset name',
                precision: 0,
                details: null
            });
        });
    });

    describe('createContractTerms', () => {
        test('creates correct contract terms', () => {
            const contract = new RGB20Contract(validParams);
            const contractTerms = contract.createContractTerms();
            
            expect(contractTerms).toEqual({
                text: 'NIA terms',
                media: null
            });
        });
    });

    describe('encodeContract', () => {
        test('generates consistent encoded data', () => {
            const contract = new RGB20Contract(validParams);
            const encoded = contract.encodeContract();
            
            expect(typeof encoded).toBe('string');
            expect(encoded.length).toBeGreaterThan(0);
            expect(/^[0-9a-f]+$/i.test(encoded)).toBe(true);
        });

        test('generates same encoding for same parameters', () => {
            const contract1 = new RGB20Contract(validParams);
            const contract2 = new RGB20Contract(validParams);
            
            expect(contract1.encodeContract()).toBe(contract2.encodeContract());
        });

        test('generates different encoding for different parameters', () => {
            const contract1 = new RGB20Contract(validParams);
            const contract2 = new RGB20Contract({
                ...validParams,
                totalSupply: 777
            });
            
            expect(contract1.encodeContract()).not.toBe(contract2.encodeContract());
        });
    });

    describe('createContractHash', () => {
        test('generates consistent hash', () => {
            const contract = new RGB20Contract(validParams);
            const hash = contract.createContractHash();
            
            expect(typeof hash).toBe('string');
            expect(hash.length).toBe(64); // SHA256 hex length
            expect(/^[0-9a-f]+$/i.test(hash)).toBe(true);
        });

        test('generates same hash for same parameters', () => {
            const contract1 = new RGB20Contract(validParams);
            const contract2 = new RGB20Contract(validParams);
            
            expect(contract1.createContractHash()).toBe(contract2.createContractHash());
        });

        test('generates different hash for different parameters', () => {
            const contract1 = new RGB20Contract(validParams);
            const contract2 = new RGB20Contract({
                ...validParams,
                ticker: 'DIFFERENT'
            });
            
            expect(contract1.createContractHash()).not.toBe(contract2.createContractHash());
        });
    });

    describe('createContractId', () => {
        test('generates BAID64 ID with contract prefix', () => {
            const contract = new RGB20Contract(validParams);
            const contractId = contract.createContractId();
            
            expect(typeof contractId).toBe('string');
            expect(contractId.startsWith('contract:')).toBe(true);
            expect(contractId.length).toBeGreaterThan(10);
        });

        test('generates same ID for same parameters', () => {
            const contract1 = new RGB20Contract(validParams);
            const contract2 = new RGB20Contract(validParams);
            
            expect(contract1.createContractId()).toBe(contract2.createContractId());
        });
    });

    describe('generateContract', () => {
        test('generates complete contract information', () => {
            const contract = new RGB20Contract(validParams);
            const generated = contract.generateContract();
            
            expect(generated).toHaveProperty('ticker', 'NIATCKR');
            expect(generated).toHaveProperty('name', 'NIA asset name');
            expect(generated).toHaveProperty('precision', 0);
            expect(generated).toHaveProperty('contractTerms', 'NIA terms');
            expect(generated).toHaveProperty('totalSupply', '666');
            expect(generated).toHaveProperty('genesisUtxo');
            expect(generated).toHaveProperty('assetSpec');
            expect(generated).toHaveProperty('contractTermsStruct');
            expect(generated).toHaveProperty('encodedData');
            expect(generated).toHaveProperty('contractHash');
            expect(generated).toHaveProperty('contractId');
            expect(generated).toHaveProperty('encodedLength');
            expect(generated).toHaveProperty('timestamp');
        });

        test('encoded length matches actual data', () => {
            const contract = new RGB20Contract(validParams);
            const generated = contract.generateContract();
            
            expect(generated.encodedLength).toBe(generated.encodedData.length / 2);
        });
    });

    describe('edge cases', () => {
        test('handles maximum precision', () => {
            const contract = new RGB20Contract({
                ...validParams,
                precision: 18
            });
            
            expect(contract.precision).toBe(18);
            expect(() => contract.generateContract()).not.toThrow();
        });

        test('handles large total supply', () => {
            const contract = new RGB20Contract({
                ...validParams,
                totalSupply: '18446744073709551615' // Max u64
            });
            
            expect(contract.totalSupply).toBe(18446744073709551615n);
            expect(() => contract.generateContract()).not.toThrow();
        });

        test('handles long ticker and name', () => {
            const contract = new RGB20Contract({
                ...validParams,
                ticker: 'VERYLONGTICKER',
                name: 'Very Long Asset Name With Many Characters'
            });
            
            expect(() => contract.generateContract()).not.toThrow();
        });

        test('handles unicode in contract terms', () => {
            const contract = new RGB20Contract({
                ...validParams,
                contractTerms: 'Terms with 🌈 unicode and 中文 characters'
            });
            
            expect(() => contract.generateContract()).not.toThrow();
        });
    });
});

describe('Helper Functions', () => {
    const validParams = {
        ticker: 'TEST',
        name: 'Test Asset',
        precision: 8,
        contractTerms: 'Test terms',
        totalSupply: 1000,
        genesisUtxo: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef:0'
    };

    describe('createRGB20Contract', () => {
        test('creates contract using helper function', () => {
            const contract = createRGB20Contract(validParams);
            
            expect(contract).toHaveProperty('ticker', 'TEST');
            expect(contract).toHaveProperty('contractId');
            expect(contract).toHaveProperty('contractHash');
        });
    });

    describe('validateRGB20Params', () => {
        test('returns true for valid parameters', () => {
            expect(validateRGB20Params(validParams)).toBe(true);
        });

        test('throws for invalid parameters', () => {
            expect(() => validateRGB20Params({
                ...validParams,
                ticker: ''
            })).toThrow();
        });
    });
});