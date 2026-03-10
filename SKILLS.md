---
name: sentrii-autonomous-execution
description: Teaches an AI agent how to execute autonomous Solana transactions using the Sentrii Agentic Wallet standard.
---

# Skill: Sentrii Autonomous Execution

## 🎯 Objective
This skill equips an AI agent with the knowledge to autonomously interpret a Sentrii Standard Manifest (`/.well-known/sentrii-agent.json`), formulate transaction parameters, and execute an on-chain action using the Sentrii Agentic Wallet architecture.

## 🧠 Core Concepts for the Agent

1. **You Are The Brain:** Your job is to parse user intent, read the target site's manifest, and output structured tool calls.
2. **The Vault is Separate:** You do not hold the private keys directly in your prompt context. You output the *intent* (e.g., `transfer_sol(amount, destination)`), and the underlying Wallet Engine will build, sign, and broadcast the transaction.
3. **Policy Lives Outside You:** In this CLI demo, any well-formed tool call that passes basic checks is executed on Devnet. In production, a separate policy engine (in the extension/background) enforces per-wallet limits, verdict checks, and per-site rules before the vault is allowed to sign.
4. **The Sandbox:** You are operating in a sandboxed Devnet environment. All actions are subject to risk limits (e.g., max 0.5 SOL per transaction).

## 🛠️ Tools Available

### 1. Tool: `transfer_sol`
When the user asks you to send funds, you must invoke the `transfer_sol` tool.

**Required Parameters:**
- `amount` (number): The amount of SOL to transfer (e.g., `0.1`). Do NOT pass lamports; pass the whole SOL amount.
- `destination` (string): The standard base58 encoded Solana public key.

### 2. Tool: `interact_with_spl_protocol`
When the user asks you to interact with a protocol, hold tokens, or mint test SPL tokens, invoke this tool. It programmatically interacts with the SPL Token Protocol to create a Mint, an Associated Token Account, and mint tokens to the Agent's wallet.

**Required Parameters:**
- `amount` (number): The amount of SPL tokens to mint (e.g., `100`).

### Execution Workflow:
1. **Analyze Intent:** Determine if the user wants to send SOL.
2. **Extract Parameters:** Identify the amount and the destination address from the user's prompt.
3. **Verify Constraints:** Ensure the amount is reasonable (typically <= 1 SOL for devnet demos).
4. **Invoke Tool:** Call the function `transfer_sol` with the exact parameters.
5. **Report Success:** Once the runtime returns the Solscan link, present it clearly to the user.

## 📄 How to Read a Sentrii Manifest

If you are on a dApp, look for the manifest at `https://[dapp-domain]/.well-known/sentrii-agent.json`. 

Example Manifest:
```json
{
  "version": "1.0",
  "workflows": [
    {
      "id": "swap",
      "labels": ["swap", "trade"],
      "inputs": [
        { "name": "amount", "required": true }
      ]
    }
  ]
}
```

**Agent Instructions for Manifests:**
- Map the user's natural language to one of the `labels` in the manifest.
- Extract the required `inputs` from the user's prompt.
- Formulate the transaction proposal based strictly on the required inputs.

## 🚀 Practice Scenario (Self-Test)
**User Prompt:** "Send 0.05 SOL to E5m4j..."
**Your Action:** 
1. Recognize the intent maps to a transfer.
2. Extract `amount: 0.05` and `destination: "E5m4j..."`.
3. Output the tool call JSON.
4. Wait for the vault to sign and return the transaction signature.
