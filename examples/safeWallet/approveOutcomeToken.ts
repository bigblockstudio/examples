import { ethers } from "ethers";
import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";
import { safeAbi } from "../../src/abis";
import { CONDITIONAL_TOKENS_FRAMEWORK_ADDRESS } from "../../src/constants";
import { encodeErc1155Approve } from "../../src/encode";
import { signAndExecuteSafeTransaction } from "../../src/safe-helpers";
import { OperationType, SafeTransaction } from "../../src/types";

dotenvConfig({ path: resolve(__dirname, "../../.env") });

/**
 * Validates if a string is a valid Ethereum address
 */
function isValidAddress(address: string): boolean {
    try {
        return ethers.utils.isAddress(address);
    } catch (error) {
        return false;
    }
}

/**
 * Validates required environment variables
 */
function validateEnvVariables(): void {
    if (!process.env.RPC_URL) {
        throw new Error("RPC_URL environment variable is required");
    }
    if (!process.env.PK) {
        throw new Error("PK (Private Key) environment variable is required");
    }
}

async function main() {
    try {
        console.log(`Starting...`);
        
        // Validate environment variables
        validateEnvVariables();
        
        const provider = new ethers.providers.JsonRpcProvider(`${process.env.RPC_URL}`);
        const pk = new ethers.Wallet(`${process.env.PK}`);
        const wallet = pk.connect(provider);
        
        console.log(`Address: ${wallet.address}`);
        
        // =============== Replace the values below with your values ==========================
        
        // Safe
        const safeAddress = ""; // Replace with your safe address
        const spender = ""; // Replace with your destination address
        
        // Validate input addresses
        if (!safeAddress || !isValidAddress(safeAddress)) {
            throw new Error(`Invalid safe address: ${safeAddress}. Please provide a valid Ethereum address.`);
        }
        
        if (!spender || !isValidAddress(spender)) {
            throw new Error(`Invalid spender address: ${spender}. Please provide a valid Ethereum address.`);
        }
        
        console.log(`Validated addresses - Safe: ${safeAddress}, Spender: ${spender}`);
        
        const safe = new ethers.Contract(safeAddress, safeAbi, wallet);
        
        // Approves a spender for an ERC1155 token on the Safe
        const safeTxn: SafeTransaction = {
            to: CONDITIONAL_TOKENS_FRAMEWORK_ADDRESS,
            operation: OperationType.Call,
            data: encodeErc1155Approve(spender, true),
            value: "0",
        };
        
        console.log(`Executing approval transaction...`);
        const result = await signAndExecuteSafeTransaction(safe, safeTxn, wallet);
        
        console.log(`✅ Successfully approved spender ${spender} for ERC1155 tokens`);
        console.log(`Transaction result:`, result);
        
    } catch (error) {
        console.error(`❌ Error in approveOutcomeToken:`, error);
        if (error instanceof Error) {
            console.error(`Error message: ${error.message}`);
            console.error(`Stack trace:`, error.stack);
        }
        throw error; // Re-throw to ensure process exits with error code
    }
}

main();
