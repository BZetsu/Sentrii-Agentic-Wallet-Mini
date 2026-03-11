import { Keypair, Connection, LAMPORTS_PER_SOL, SystemProgram, Transaction, VersionedTransaction, sendAndConfirmTransaction, PublicKey } from '@solana/web3.js';
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';
import { validateManifest } from '@sentrii/sentrii-standard';
import { SolanaAgentKit, getMintInfo, type BaseWallet } from 'solana-agent-kit';
import TokenPlugin from '@solana-agent-kit/plugin-token';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import * as readline from 'readline';

dotenv.config();

const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
  const balance = await connection.getBalance(agentWallet.publicKey);
  console.log(`💰 Balance: ${balance / LAMPORTS_PER_SOL} SOL\n`);

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

  console.log(`\n🧠 Thinking...`);

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are an AI wallet agent for Sentrii. Your current wallet address is ${agentWallet.publicKey.toBase58()} and your balance is ${balance / LAMPORTS_PER_SOL} SOL. You can execute transfers or interact with the SPL Token Protocol to mint/hold tokens based on the user's request.`
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
      },
      {
        type: 'function',
        function: {
          name: 'swap_with_kit',
          description: 'Use Solana Agent Kit to construct, sign, and send a Jupiter swap transaction on Devnet using the agent wallet.',
          parameters: {
            type: 'object',
            properties: {
              fromMint: {
                type: 'string',
                description: 'Input token mint address (e.g. wrapped SOL mint on devnet).'
              },
              toMint: {
                type: 'string',
                description: 'Output token mint address (e.g. devnet USDC mint).'
              },
              amount: {
                type: 'number',
                description: 'Amount of input token in the smallest unit (e.g. lamports for SOL).'
              },
              slippageBps: {
                type: 'number',
                description: 'Max slippage in basis points (defaults to 300 = 3%).'
              }
            },
            required: ['fromMint', 'toMint', 'amount']
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
      else if (toolCall.function.name === 'swap_with_kit') {
        const args = JSON.parse(toolCall.function.arguments) as {
          fromMint: string;
          toMint: string;
          amount: number;
          slippageBps?: number;
        };

        console.log('🤖 AI Decision: Swapping with Solana Agent Kit on Devnet (auto sign + send)...');

        try {
          const fromMintPk = new PublicKey(args.fromMint);
          const toMintPk = new PublicKey(args.toMint);

          const rpcUrl = connection.rpcEndpoint;

          const signingWallet: BaseWallet = {
            publicKey: agentWallet.publicKey,
            async signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T> {
              if (transaction instanceof VersionedTransaction) {
                transaction.sign([agentWallet]);
                return transaction;
              }
              transaction.partialSign(agentWallet);
              return transaction;
            },
            async signAllTransactions<T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]> {
              const signed: T[] = [];
              for (const tx of transactions) {
                if (tx instanceof VersionedTransaction) {
                  tx.sign([agentWallet]);
                  signed.push(tx);
                } else {
                  tx.partialSign(agentWallet);
                  signed.push(tx);
                }
              }
              return signed;
            },
            async signAndSendTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<string> {
              const signed = await this.signTransaction(transaction);
              const raw =
                signed instanceof VersionedTransaction
                  ? signed.serialize()
                  : (signed as Transaction).serialize();
              return connection.sendRawTransaction(raw);
            },
            async signMessage(): Promise<never> {
              throw new Error('CLI demo does not support arbitrary message signing.');
            }
          };

          const kit = new SolanaAgentKit(signingWallet, rpcUrl);
          kit.use(TokenPlugin);

          const fromMintInfo = await getMintInfo(kit.connection, fromMintPk.toBase58());
          const decimals = fromMintInfo.decimals;
          const uiAmount = decimals > 0 ? args.amount / Math.pow(10, decimals) : args.amount;

          const tradeMethod = (kit.methods as Record<string, unknown>).trade;
          if (typeof tradeMethod !== 'function') {
            throw new Error('Solana Agent Kit trade method is unavailable.');
          }

          const tradeResult = await (tradeMethod as (
            kitAgent: SolanaAgentKit,
            outputMint: PublicKey,
            inputAmount: number,
            inputMint: PublicKey,
            slippageBps?: number,
          ) => Promise<VersionedTransaction | Transaction | string | string[]>)(
            kit,
            toMintPk,
            uiAmount,
            fromMintPk,
            args.slippageBps ?? 300,
          );

          let txSignature: string | null = null;
          if (tradeResult instanceof VersionedTransaction || tradeResult instanceof Transaction) {
            console.log('💸 Broadcasting swap transaction to Devnet via Solana Agent Kit wallet adapter...');
            txSignature = await signingWallet.signAndSendTransaction(tradeResult);
          } else if (typeof tradeResult === 'string') {
            console.log('✅ Kit returned a transaction id/string result:');
            console.log(tradeResult);
            txSignature = tradeResult;
          } else if (Array.isArray(tradeResult) && tradeResult.length > 0) {
            console.log('✅ Kit returned an array result:');
            console.log(tradeResult);
            txSignature = typeof tradeResult[0] === 'string' ? tradeResult[0] : null;
          }

          if (txSignature) {
            console.log(`✅ Swap Successful!`);
            console.log(`🔗 View on Solscan: https://solscan.io/tx/${txSignature}?cluster=devnet\n`);
          } else {
            console.log('ℹ️ Swap completed via kit, but no explicit signature string was returned.');
          }
        } catch (err: any) {
          console.error(`❌ Kit swap failed: ${err.message}`);
        }
      }
    }
  } else {
    console.log(`🤖 AI Response: ${message.content}\n`);
    console.log('⚠️ No action was taken because the AI did not invoke a tool.');
  }

  rl.close();
}

main().catch((error) => {
  console.error(error);
  rl.close();
});
