import { Keypair, Connection, LAMPORTS_PER_SOL, SystemProgram, Transaction, sendAndConfirmTransaction, PublicKey } from '@solana/web3.js';
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';
import { validateManifest } from '@sentrii/sentrii-standard';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import * as readline from 'readline';

dotenv.config();

const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('🚀 Starting Sentrii AI CLI Demo...\n');

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
    console.error('❌ Missing OPENAI_API_KEY in .env. Please add it to continue.');
    process.exit(1);
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // 1. Wallet Creation
  console.log('1️⃣ Creating Agent Wallet & Destination Wallet...');
  const agentWallet = Keypair.generate();
  const destinationWallet = Keypair.generate();
  console.log(`✅ Agent Wallet Pubkey: ${agentWallet.publicKey.toBase58()}`);
  console.log(`✅ Example Destination Pubkey: ${destinationWallet.publicKey.toBase58()}\n`);

  // 2. Devnet Funding
  console.log('2️⃣ Requesting Devnet SOL for Agent Wallet...');
  try {
    const signature = await connection.requestAirdrop(agentWallet.publicKey, 2 * LAMPORTS_PER_SOL);
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight
    }, 'confirmed');
    console.log(`✅ Airdrop successful! Signature: ${signature}\n`);
  } catch (error: any) {
    console.warn(`⚠️ Airdrop failed (possibly rate-limited on Devnet). Error: ${error.message}\n`);
    console.log(`If airdrop fails, you may need to fund ${agentWallet.publicKey.toBase58()} manually on Devnet to run the rest of the demo.\n`);
  }

  // 3. Balance Check
  console.log('3️⃣ Checking Agent Wallet Balance...');
  const initialBalance = await connection.getBalance(agentWallet.publicKey);
  console.log(`💰 Balance: ${initialBalance / LAMPORTS_PER_SOL} SOL\n`);

  // 4. Manifest Validation
  console.log('4️⃣ Validating Sample Sentrii Manifest...');
  const sampleManifest = {
    version: '1.0',
    name: 'Sample DeFi App',
    baseUrl: 'https://example.com',
    workflows: [
      {
        id: 'interact_protocol',
        description: 'Interact with the SPL Token Protocol to mint and hold SPL tokens',
        inputs: [
          { name: 'amount', description: 'Amount of SPL tokens to mint', required: true }
        ],
        labels: ['mint', 'spl', 'protocol'],
        verificationCues: ['Minting Successful'],
        confirmationRequired: true
      }
    ]
  };

  const validationResult = validateManifest(sampleManifest);
  if (validationResult.success) {
    console.log('✅ Manifest validated successfully!\n');
  } else {
    console.error(`❌ Manifest validation failed: ${validationResult.error}\n`);
  }

  // 5. Autonomous Action Execution via OpenAI
  console.log('5️⃣ Starting AI Autonomous Flow...');
  
  const defaultPrompt = `Interact with the SPL Token protocol to mint 100 test tokens and hold them in my wallet.`;
  const userPrompt = await askQuestion(`🤖 What would you like me to do?\n(Options: "Send 0.1 SOL to ${destinationWallet.publicKey.toBase58()}" OR "${defaultPrompt}")\n> `);
  const prompt = userPrompt.trim() || defaultPrompt;

  await handleAILoop(agentWallet, destinationWallet, prompt, openai);
}

async function handleAILoop(agentWallet: Keypair, destinationWallet: Keypair, prompt: string, openai: OpenAI) {
  // Always fetch the latest on-chain balance for accurate state
  const currentBalanceLamports = await connection.getBalance(agentWallet.publicKey);
  const currentBalanceSol = currentBalanceLamports / LAMPORTS_PER_SOL;

  console.log(`\n🧠 Thinking...`);

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are an AI wallet agent for Sentrii. Your current wallet address is ${agentWallet.publicKey.toBase58()} and your balance is ${currentBalanceSol} SOL. You can execute transfers or interact with the SPL Token Protocol to mint/hold tokens based on the user's request.`
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
      },
      {
        type: 'function',
        function: {
          name: 'interact_with_spl_protocol',
          description: 'Interact with the SPL Token Protocol. Creates a new token mint and mints SPL tokens to the agent wallet, proving the wallet can interact with a protocol and hold SPL tokens.',
          parameters: {
            type: 'object',
            properties: {
              amount: {
                type: 'number',
                description: 'The amount of SPL tokens to mint'
              }
            },
            required: ['amount']
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
          const toPubkey = new PublicKey(destination);
          const lamports = amount * LAMPORTS_PER_SOL;

          const tx = new Transaction().add(
            SystemProgram.transfer({
              fromPubkey: agentWallet.publicKey,
              toPubkey: toPubkey,
              lamports: lamports,
            })
          );

          console.log(`💸 Broadcasting transaction to Devnet...`);
          const txSignature = await sendAndConfirmTransaction(connection, tx, [agentWallet]);
          
          console.log(`✅ Transfer Successful!`);
          console.log(`🔗 View on Solscan: https://solscan.io/tx/${txSignature}?cluster=devnet\n`);
        } catch (err: any) {
          console.error(`❌ Transfer failed: ${err.message}`);
        }
      } 
      else if (toolCall.function.name === 'interact_with_spl_protocol') {
        const args = JSON.parse(toolCall.function.arguments);
        const { amount } = args;

        console.log(`🤖 AI Decision: Interacting with SPL Token Protocol to mint ${amount} tokens...`);
        
        try {
          console.log(`🔨 1/3 Creating new Token Mint on Devnet...`);
          const mint = await createMint(
            connection,
            agentWallet,           // payer
            agentWallet.publicKey, // mintAuthority
            null,                  // freezeAuthority
            9                      // decimals
          );
          console.log(`   ✅ Mint Created: ${mint.toBase58()}`);

          console.log(`🔨 2/3 Creating Associated Token Account for Agent...`);
          const tokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            agentWallet,
            mint,
            agentWallet.publicKey
          );
          console.log(`   ✅ ATA Created: ${tokenAccount.address.toBase58()}`);
          
          console.log(`💸 3/3 Minting ${amount} SPL tokens to Agent Wallet...`);
          const txSignature = await mintTo(
            connection,
            agentWallet,
            mint,
            tokenAccount.address,
            agentWallet,
            amount * (10 ** 9) // 9 decimals
          );
          
          console.log(`✅ SPL Protocol Interaction Successful! The agent is now holding ${amount} SPL tokens.`);
          console.log(`🔗 View Transaction on Solscan: https://solscan.io/tx/${txSignature}?cluster=devnet`);
          console.log(`🔗 View Token Holding: https://solscan.io/account/${tokenAccount.address.toBase58()}?cluster=devnet\n`);
        } catch (err: any) {
          console.error(`❌ SPL Token interaction failed: ${err.message}`);
        }
      }
    }
  } else {
    console.log(`🤖 AI Response: ${message.content}\n`);
    console.log('⚠️ No action was taken because the AI did not invoke a tool.');
  }

  const nextPrompt = await askQuestion(`\n🤖 What else would you like me to do? (Type 'exit' to quit)\n> `);
  if (nextPrompt.toLowerCase() !== 'exit') {
    await handleAILoop(agentWallet, destinationWallet, nextPrompt, openai);
  } else {
    rl.close();
  }
}

main().catch((error) => {
  console.error(error);
  rl.close();
});
