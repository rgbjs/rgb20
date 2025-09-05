/**
 * @fileoverview CLI integration tests
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const cliPath = join(__dirname, '..', 'cli.js');

describe('RGB20 CLI', () => {
    const validArgs = [
        '--ticker', 'TESTCOIN',
        '--name', '"Test Coin"',
        '--precision', '8',
        '--terms', '"Test terms"',
        '--supply', '1000000',
        '--utxo', '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef:0'
    ];

    describe('help command', () => {
        test('shows help with --help flag', async () => {
            const { stdout } = await execAsync(`node ${cliPath} --help`);
            expect(stdout).toContain('RGB20 Contract Creator');
            expect(stdout).toContain('USAGE:');
            expect(stdout).toContain('CONTRACT CREATION OPTIONS:');
        });

        test('shows help with help command', async () => {
            const { stdout } = await execAsync(`node ${cliPath} help`);
            expect(stdout).toContain('RGB20 Contract Creator');
        });

        test('shows help when no arguments provided', async () => {
            const { stdout } = await execAsync(`node ${cliPath}`);
            expect(stdout).toContain('RGB20 Contract Creator');
        });
    });

    describe('version command', () => {
        test('shows version with --version flag', async () => {
            const { stdout } = await execAsync(`node ${cliPath} --version`);
            expect(stdout).toContain('RGB20 Contract Creator');
        });

        test('shows version with version command', async () => {
            const { stdout } = await execAsync(`node ${cliPath} version`);
            expect(stdout).toContain('RGB20 Contract Creator');
        });
    });

    describe('example command', () => {
        test('shows test vectors example', async () => {
            const { stdout } = await execAsync(`node ${cliPath} example`);
            expect(stdout).toContain('Test Contract Parameters');
            expect(stdout).toContain('NIATCKR');
            expect(stdout).toContain('NIA asset name');
            expect(stdout).toContain('Command to run');
        });
    });

    describe('create command', () => {
        test('creates contract with all required parameters', async () => {
            const { stdout } = await execAsync(`node ${cliPath} create ${validArgs.join(' ')}`);
            expect(stdout).toContain('RGB20 Contract Created');
            expect(stdout).toContain('Contract Details:');
            expect(stdout).toContain('Ticker:      TESTCOIN');
            expect(stdout).toContain('Name:        Test Coin');
            expect(stdout).toContain('Precision:   8');
            expect(stdout).toContain('Generated Data:');
            expect(stdout).toContain('Contract Hash:');
            expect(stdout).toContain('Contract ID:');
            expect(stdout).toContain('contract:');
        });

        test('creates contract with JSON output', async () => {
            const { stdout } = await execAsync(`node ${cliPath} create ${validArgs.join(' ')} --json`);
            const output = JSON.parse(stdout);
            expect(output).toHaveProperty('ticker', 'TESTCOIN');
            expect(output).toHaveProperty('name', 'Test Coin');
            expect(output).toHaveProperty('precision', 8);
            expect(output).toHaveProperty('contractHash');
            expect(output).toHaveProperty('contractId');
            expect(output.contractId).toMatch(/^contract:/);
        });

        test('creates contract with hash-only output', async () => {
            const { stdout } = await execAsync(`node ${cliPath} create ${validArgs.join(' ')} --hash-only`);
            expect(stdout.trim()).toMatch(/^[0-9a-f]{64}$/);
        });

        test('creates contract with id-only output', async () => {
            const { stdout } = await execAsync(`node ${cliPath} create ${validArgs.join(' ')} --id-only`);
            expect(stdout.trim()).toMatch(/^contract:/);
        });

        test('creates contract with encoded-only output', async () => {
            const { stdout } = await execAsync(`node ${cliPath} create ${validArgs.join(' ')} --encoded-only`);
            expect(stdout.trim()).toMatch(/^[0-9a-f]+$/);
        });

        test('fails with missing required parameter', async () => {
            const incompleteArgs = validArgs.slice(0, -2); // Remove last parameter
            await expect(execAsync(`node ${cliPath} create ${incompleteArgs.join(' ')}`))
                .rejects.toThrow();
        });

        test('works with test vectors from specification', async () => {
            const testVectorArgs = [
                '--ticker', 'NIATCKR',
                '--name', '"NIA asset name"',
                '--precision', '0',
                '--terms', '"NIA terms"',
                '--supply', '666',
                '--utxo', '22f0538e189f32922e55daf6fa0b7120bc01de8520a9a4c80655fdaf70272ac0:1'
            ];

            const { stdout } = await execAsync(`node ${cliPath} create ${testVectorArgs.join(' ')} --json`);
            const output = JSON.parse(stdout);
            
            expect(output.ticker).toBe('NIATCKR');
            expect(output.name).toBe('NIA asset name');
            expect(output.precision).toBe(0);
            expect(output.contractTerms).toBe('NIA terms');
            expect(output.totalSupply).toBe('666');
            expect(output.genesisUtxo).toBe('22f0538e189f32922e55daf6fa0b7120bc01de8520a9a4c80655fdaf70272ac0:1');
        });
    });

    describe('validate command', () => {
        test('validates correct parameters', async () => {
            const { stdout } = await execAsync(`node ${cliPath} validate ${validArgs.join(' ')}`);
            expect(stdout).toContain('Contract parameters are valid');
        });

        test('fails validation with invalid precision', async () => {
            const invalidArgs = [...validArgs];
            const precisionIndex = invalidArgs.indexOf('--precision') + 1;
            invalidArgs[precisionIndex] = '25'; // Invalid precision > 18

            await expect(execAsync(`node ${cliPath} validate ${invalidArgs.join(' ')}`))
                .rejects.toThrow();
        });

        test('fails validation with invalid UTXO format', async () => {
            const invalidArgs = [...validArgs];
            const utxoIndex = invalidArgs.indexOf('--utxo') + 1;
            invalidArgs[utxoIndex] = 'invalid-utxo-format';

            await expect(execAsync(`node ${cliPath} validate ${invalidArgs.join(' ')}`))
                .rejects.toThrow();
        });
    });

    describe('error handling', () => {
        test('shows help for invalid command', async () => {
            const { stdout } = await execAsync(`node ${cliPath} invalid-command`);
            expect(stdout).toContain('RGB20 Contract Creator');
        });

        test('shows error for missing ticker', async () => {
            const argsWithoutTicker = validArgs.filter(arg => arg !== '--ticker' && arg !== 'TESTCOIN');
            await expect(execAsync(`node ${cliPath} create ${argsWithoutTicker.join(' ')}`))
                .rejects.toThrow();
        });

        test('shows error for negative supply', async () => {
            const invalidArgs = [...validArgs];
            const supplyIndex = invalidArgs.indexOf('--supply') + 1;
            invalidArgs[supplyIndex] = '-100';

            await expect(execAsync(`node ${cliPath} create ${invalidArgs.join(' ')}`))
                .rejects.toThrow();
        });
    });

    describe('output consistency', () => {
        test('same parameters produce same results', async () => {
            const { stdout: stdout1 } = await execAsync(`node ${cliPath} create ${validArgs.join(' ')} --hash-only`);
            const { stdout: stdout2 } = await execAsync(`node ${cliPath} create ${validArgs.join(' ')} --hash-only`);
            
            expect(stdout1.trim()).toBe(stdout2.trim());
        });

        test('different parameters produce different results', async () => {
            const args1 = [...validArgs];
            const args2 = [...validArgs];
            const supplyIndex = args2.indexOf('--supply') + 1;
            args2[supplyIndex] = '2000000';

            const { stdout: stdout1 } = await execAsync(`node ${cliPath} create ${args1.join(' ')} --hash-only`);
            const { stdout: stdout2 } = await execAsync(`node ${cliPath} create ${args2.join(' ')} --hash-only`);
            
            expect(stdout1.trim()).not.toBe(stdout2.trim());
        });
    });

    describe('comprehensive integration', () => {
        test('complete workflow with all output formats', async () => {
            // Test validation first
            await execAsync(`node ${cliPath} validate ${validArgs.join(' ')}`);
            
            // Test different output formats
            const formats = [
                { flag: '--json', test: (out) => expect(() => JSON.parse(out)).not.toThrow() },
                { flag: '--hash-only', test: (out) => expect(out.trim()).toMatch(/^[0-9a-f]{64}$/) },
                { flag: '--id-only', test: (out) => expect(out.trim()).toMatch(/^contract:/) },
                { flag: '--encoded-only', test: (out) => expect(out.trim()).toMatch(/^[0-9a-f]+$/) }
            ];

            for (const format of formats) {
                const { stdout } = await execAsync(`node ${cliPath} create ${validArgs.join(' ')} ${format.flag}`);
                format.test(stdout);
            }
        });
    });
}, 30000); // Increase timeout for CLI tests