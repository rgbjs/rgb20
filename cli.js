#!/usr/bin/env node

/**
 * @fileoverview RGB20 Contract Creation CLI
 * 
 * Command-line interface for creating RGB20 token contracts with
 * StrictEncode serialization and BAID64 contract ID generation.
 */

import { RGB20Contract, createRGB20Contract, validateRGB20Params } from './index.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Color utilities
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m'
};

const c = (color, text) => process.stdout.isTTY ? `${colors[color]}${text}${colors.reset}` : text;

function printVersion() {
    try {
        const packageJson = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf8'));
        console.log(`${c('cyan', '🎨 RGB20 Contract Creator')} v${packageJson.version}`);
    } catch {
        console.log(`${c('cyan', '🎨 RGB20 Contract Creator')} v0.0.1`);
    }
}

function printHelp() {
    console.log(`${c('cyan', '🎨 RGB20 Contract Creator')} - Create RGB20 token contracts

${c('bright', 'USAGE:')}
  rgb20 create [options]        Create RGB20 contract
  rgb20 validate [options]      Validate contract parameters
  rgb20 example                 Show example with test vectors
  rgb20 interactive             Interactive contract creation
  rgb20 help                    Show this help

${c('bright', 'CONTRACT CREATION OPTIONS:')}
  --ticker <symbol>             Asset ticker symbol (required)
  --name <name>                 Asset name (required)
  --precision <0-18>            Decimal precision (required)
  --terms <text>                Contract terms (required)
  --supply <amount>             Total supply (required)
  --utxo <txid:vout>            Genesis UTXO (required)

${c('bright', 'OUTPUT OPTIONS:')}
  --json                        Output as JSON
  --compact                     Compact JSON output
  --hash-only                   Show only contract hash
  --id-only                     Show only contract ID
  --encoded-only                Show only encoded data
  --no-color                    Disable colored output

${c('bright', 'EXAMPLES:')}

  ${c('gray', '# Create contract with test vectors')}
  rgb20 create \\
    --ticker "NIATCKR" \\
    --name "NIA asset name" \\
    --precision 0 \\
    --terms "NIA terms" \\
    --supply 666 \\
    --utxo "22f0538e189f32922e55daf6fa0b7120bc01de8520a9a4c80655fdaf70272ac0:1"

  ${c('gray', '# Show example with test vectors')}
  rgb20 example

  ${c('gray', '# Interactive mode')}
  rgb20 interactive

  ${c('gray', '# JSON output')}
  rgb20 create --ticker BTC --name Bitcoin --precision 8 \\
    --terms "Bitcoin on RGB" --supply 21000000 \\
    --utxo "abcd...ef:0" --json

For more information: ${c('blue', 'https://github.com/rgbjs/rgb20')}`);
}

function parseArgs(args) {
    const options = {};
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--')) {
            const key = arg.slice(2);
            const value = args[i + 1];
            if (value && !value.startsWith('--')) {
                options[key] = value;
                i++;
            } else {
                options[key] = true;
            }
        }
    }
    return options;
}

function validateRequiredOptions(options, required) {
    const missing = required.filter(key => !options[key]);
    if (missing.length > 0) {
        console.error(`${c('red', '❌ Error:')} Missing required options: ${missing.map(k => `--${k}`).join(', ')}`);
        process.exit(1);
    }
}

function formatContractOutput(contract, options = {}) {
    if (options['hash-only']) {
        return contract.contractHash;
    }
    if (options['id-only']) {
        return contract.contractId;
    }
    if (options['encoded-only']) {
        return contract.encodedData;
    }
    if (options.json) {
        return JSON.stringify(contract, null, options.compact ? 0 : 2);
    }

    // Formatted output
    return `${c('cyan', '🎨 RGB20 Contract Created')}

${c('bright', '📋 Contract Details:')}
  ${c('green', 'Ticker:')}      ${contract.ticker}
  ${c('green', 'Name:')}        ${contract.name}
  ${c('green', 'Precision:')}   ${contract.precision}
  ${c('green', 'Total Supply:')} ${contract.totalSupply}
  ${c('green', 'Terms:')}       ${contract.contractTerms}
  ${c('green', 'Genesis UTXO:')} ${contract.genesisUtxo}

${c('bright', '🔗 Generated Data:')}
  ${c('yellow', 'Contract Hash:')} ${contract.contractHash}
  ${c('yellow', 'Contract ID:')}   ${contract.contractId}
  ${c('yellow', 'Encoded Data:')}  ${contract.encodedData}
  ${c('yellow', 'Data Length:')}   ${contract.encodedLength} bytes

${c('bright', '⏰ Created:')} ${new Date(contract.timestamp).toLocaleString()}`;
}

async function interactiveMode() {
    const readline = await import('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const question = (prompt) => new Promise((resolve) => {
        rl.question(prompt, resolve);
    });

    console.log(`${c('cyan', '🎮 RGB20 Interactive Contract Creator')}\n`);

    try {
        const ticker = await question(`${c('green', 'Asset Ticker:')} `);
        const name = await question(`${c('green', 'Asset Name:')} `);
        const precision = await question(`${c('green', 'Precision (0-18):')} `);
        const terms = await question(`${c('green', 'Contract Terms:')} `);
        const supply = await question(`${c('green', 'Total Supply:')} `);
        const utxo = await question(`${c('green', 'Genesis UTXO (txid:vout):')} `);

        const params = {
            ticker: ticker.trim(),
            name: name.trim(),
            precision: parseInt(precision),
            contractTerms: terms.trim(),
            totalSupply: supply.trim(),
            genesisUtxo: utxo.trim()
        };

        const contract = createRGB20Contract(params);
        console.log('\n' + formatContractOutput(contract));

    } catch (error) {
        console.error(`\n${c('red', '❌ Error:')} ${error.message}`);
    } finally {
        rl.close();
    }
}

function showExample() {
    console.log(`${c('cyan', '📚 RGB20 Example with Test Vectors')}

${c('bright', '🧪 Test Contract Parameters:')}
  ${c('green', 'Ticker:')}      NIATCKR
  ${c('green', 'Name:')}        NIA asset name
  ${c('green', 'Precision:')}   0
  ${c('green', 'Contract Terms:')} NIA terms
  ${c('green', 'Total Supply:')} 666
  ${c('green', 'Genesis UTXO:')} 22f0538e189f32922e55daf6fa0b7120bc01de8520a9a4c80655fdaf70272ac0:1

${c('bright', '💻 Command to run:')}
${c('gray', 'rgb20 create \\\\')}
${c('gray', '  --ticker "NIATCKR" \\\\')}
${c('gray', '  --name "NIA asset name" \\\\')}
${c('gray', '  --precision 0 \\\\')}
${c('gray', '  --terms "NIA terms" \\\\')}
${c('gray', '  --supply 666 \\\\')}
${c('gray', '  --utxo "22f0538e189f32922e55daf6fa0b7120bc01de8520a9a4c80655fdaf70272ac0:1"')}

${c('bright', '🔧 Try it now:')}
  ${c('blue', 'rgb20 create --ticker "NIATCKR" --name "NIA asset name" --precision 0 --terms "NIA terms" --supply 666 --utxo "22f0538e189f32922e55daf6fa0b7120bc01de8520a9a4c80655fdaf70272ac0:1"')}

${c('bright', '🎮 Or use interactive mode:')}
  ${c('blue', 'rgb20 interactive')}`);
}

async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        printHelp();
        return;
    }

    const command = args[0];
    const options = parseArgs(args.slice(1));

    try {
        switch (command) {
            case 'create': {
                const required = ['ticker', 'name', 'precision', 'terms', 'supply', 'utxo'];
                validateRequiredOptions(options, required);

                const params = {
                    ticker: options.ticker,
                    name: options.name,
                    precision: parseInt(options.precision),
                    contractTerms: options.terms,
                    totalSupply: options.supply,
                    genesisUtxo: options.utxo
                };

                const contract = createRGB20Contract(params);
                console.log(formatContractOutput(contract, options));
                break;
            }

            case 'validate': {
                const required = ['ticker', 'name', 'precision', 'terms', 'supply', 'utxo'];
                validateRequiredOptions(options, required);

                const params = {
                    ticker: options.ticker,
                    name: options.name,
                    precision: parseInt(options.precision),
                    contractTerms: options.terms,
                    totalSupply: options.supply,
                    genesisUtxo: options.utxo
                };

                validateRGB20Params(params);
                console.log(`${c('green', '✅ Contract parameters are valid')}`);
                break;
            }

            case 'example':
                showExample();
                break;

            case 'interactive':
                await interactiveMode();
                break;

            case 'version':
            case '-v':
            case '--version':
                printVersion();
                break;

            case 'help':
            case '-h':
            case '--help':
            default:
                printHelp();
                break;
        }
    } catch (error) {
        console.error(`${c('red', '❌ Error:')} ${error.message}`);
        process.exit(1);
    }
}

main().catch(error => {
    console.error(`${c('red', '❌ Fatal Error:')} ${error.message}`);
    process.exit(1);
});