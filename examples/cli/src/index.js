"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const web3_js_1 = require("@solana/web3.js");
const sentrii_standard_1 = require("@sentrii/sentrii-standard");
const openai_1 = __importDefault(require("openai"));
const dotenv = __importStar(require("dotenv"));
const readline = __importStar(require("readline"));
dotenv.config();
const connection = new web3_js_1.Connection('https://api.devnet.solana.com', 'confirmed');
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
function askQuestion(query) {
    return new Promise(resolve => rl.question(query, resolve));
}
async function main() {
    console.log('🚀 Starting Sentrii AI CLI Demo...\n');
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
        console.error('❌ Missing OPENAI_API_KEY in .env. Please add it to continue.');
        process.exit(1);
    }
    // 1. Wallet Creation
    console.log('1️⃣ Creating Agent Wallet & Destination Wallet...');
    const agentWallet = web3_js_1.Keypair.generate();
    const destinationWallet = web3_js_1.Keypair.generate();
    console.log(`✅ Agent Wallet Pubkey: ${agentWallet.publicKey.toBase58()}`);
    console.log(`✅ Example Destination Pubkey: ${destinationWallet.publicKey.toBase58()}\n`);
    // 2. Devnet Funding
    console.log('2️⃣ Requesting Devnet SOL for Agent Wallet...');
    try {
        const signature = await connection.requestAirdrop(agentWallet.publicKey, 1 * web3_js_1.LAMPORTS_PER_SOL);
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        await connection.confirmTransaction({
            signature,
            blockhash,
            lastValidBlockHeight
        }, 'confirmed');
        console.log(`✅ Airdrop successful! Signature: ${signature}\n`);
    }
    catch (error) {
        console.warn(`⚠️ Airdrop failed (possibly rate-limited on Devnet). Error: ${error.message}\n`);
        console.log(`If airdrop fails, you may need to fund ${agentWallet.publicKey.toBase58()} manually on Devnet to run the rest of the demo.\n`);
    }
    // 3. Balance Check
    console.log('3️⃣ Checking Agent Wallet Balance...');
    const balance = await connection.getBalance(agentWallet.publicKey);
    console.log(`💰 Balance: ${balance / web3_js_1.LAMPORTS_PER_SOL} SOL\n`);
    // 4. Manifest Validation
    console.log('4️⃣ Validating Sample Sentrii Manifest...');
    const sampleManifest = {
        version: '1.0',
        name: 'Sample DeFi App',
        baseUrl: 'https://example.com',
        workflows: [
            {
                id: 'transfer',
                description: 'Transfer SOL to another wallet',
                inputs: [
                    { name: 'amount', description: 'Amount to send in SOL', required: true },
                    { name: 'destination', description: 'Destination address', required: true }
                ],
                labels: ['send', 'transfer', 'pay'],
                verificationCues: ['Transfer Successful'],
                confirmationRequired: true
            }
        ]
    };
    const validationResult = (0, sentrii_standard_1.validateManifest)(sampleManifest);
    if (validationResult.success) {
        console.log('✅ Manifest validated successfully!\n');
    }
    else {
        console.error(`❌ Manifest validation failed: ${validationResult.error}\n`);
    }
    // 5. Autonomous Action Execution via OpenAI
    console.log('5️⃣ Starting AI Autonomous Flow...');
    const defaultPrompt = `Send 0.1 SOL to ${destinationWallet.publicKey.toBase58()}`;
    const userPrompt = await askQuestion(`🤖 What would you like me to do? (press enter for default: "${defaultPrompt}")\n> `);
    const prompt = userPrompt.trim() || defaultPrompt;
    console.log(`\n🧠 Thinking...`);
    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            {
                role: 'system',
                content: `You are an AI wallet agent for Sentrii. Your current wallet address is ${agentWallet.publicKey.toBase58()} and your balance is ${balance / web3_js_1.LAMPORTS_PER_SOL} SOL. Use the provided tools to execute the user's intent.`
            },
            {
                role: 'user',
                content: prompt
            }
        ],
        tools: [
            {
                type: 'function',
                function: {
                    name: 'transfer_sol',
                    description: 'Transfer SOL to a specified destination address.',
                    parameters: {
                        type: 'object',
                        properties: {
                            amount: {
                                type: 'number',
                                description: 'The amount of SOL to transfer'
                            },
                            destination: {
                                type: 'string',
                                description: 'The Solana public key address to send the SOL to'
                            }
                        },
                        required: ['amount', 'destination']
                    }
                }
            }
        ],
        tool_choice: 'auto'
    });
    const message = response.choices[0].message;
    if (message.tool_calls && message.tool_calls.length > 0) {
        for (const toolCall of message.tool_calls) {
            if (toolCall.function.name === 'transfer_sol') {
                const args = JSON.parse(toolCall.function.arguments);
                const { amount, destination } = args;
                console.log(`🤖 AI Decision: Transferring ${amount} SOL to ${destination}...`);
                try {
                    const toPubkey = new web3_js_1.PublicKey(destination);
                    const lamports = amount * web3_js_1.LAMPORTS_PER_SOL;
                    const tx = new web3_js_1.Transaction().add(web3_js_1.SystemProgram.transfer({
                        fromPubkey: agentWallet.publicKey,
                        toPubkey: toPubkey,
                        lamports: lamports,
                    }));
                    console.log(`💸 Broadcasting transaction to Devnet...`);
                    const txSignature = await (0, web3_js_1.sendAndConfirmTransaction)(connection, tx, [agentWallet]);
                    console.log(`✅ Transfer Successful!`);
                    console.log(`🔗 View on Solscan: https://solscan.io/tx/${txSignature}?cluster=devnet\n`);
                }
                catch (err) {
                    console.error(`❌ Transfer failed: ${err.message}`);
                }
            }
        }
    }
    else {
        console.log(`🤖 AI Response: ${message.content}\n`);
        console.log('⚠️ No action was taken because the AI did not invoke the transfer tool.');
    }
    rl.close();
}
main().catch((error) => {
    console.error(error);
    rl.close();
});
