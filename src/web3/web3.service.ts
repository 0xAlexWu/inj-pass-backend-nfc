import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { privateKeyToAccount, signMessage, signTypedData } from 'viem/accounts';
import { createWalletClient, http, parseEther } from 'viem';
import { injective } from 'viem/chains';

@Injectable()
export class Web3Service {
  private readonly rpcUrl: string;

  constructor(private readonly httpService: HttpService) {
    // Injective EVM RPC URL
    this.rpcUrl =
      process.env.INJECTIVE_RPC_URL || 'https://evm-rpc.injective.network';
  }

  /**
   * Sign a transaction using viem
   */
  async signTransaction(privateKey: string, transaction: any): Promise<string> {
    try {
      // Ensure privateKey has 0x prefix
      const pk = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;

      // Create account from private key
      const account = privateKeyToAccount(pk as `0x${string}`);

      // Create wallet client
      const walletClient = createWalletClient({
        account,
        chain: injective,
        transport: http(this.rpcUrl),
      });

      // Send transaction
      const hash = await walletClient.sendTransaction({
        to: transaction.to as `0x${string}`,
        value: transaction.value ? parseEther(transaction.value) : 0n,
        data: transaction.data as `0x${string}` | undefined,
        gas: transaction.gas ? BigInt(transaction.gas) : undefined,
        gasPrice: transaction.gasPrice
          ? BigInt(transaction.gasPrice)
          : undefined,
      });

      return hash;
    } catch (error) {
      console.error('[Web3Service] Sign transaction error:', error);
      throw new Error(`Failed to sign transaction: ${error.message}`);
    }
  }

  /**
   * Sign a message
   */
  async signMessage(privateKey: string, message: string): Promise<string> {
    try {
      // Ensure privateKey has 0x prefix
      const pk = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;

      // Create account from private key
      const account = privateKeyToAccount(pk as `0x${string}`);

      // Sign message
      const signature = await signMessage({
        message,
        privateKey: pk as `0x${string}`,
      });

      return signature;
    } catch (error) {
      console.error('[Web3Service] Sign message error:', error);
      throw new Error(`Failed to sign message: ${error.message}`);
    }
  }

  /**
   * Sign typed data (EIP-712)
   */
  async signTypedData(privateKey: string, typedData: any): Promise<string> {
    try {
      // Ensure privateKey has 0x prefix
      const pk = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;

      // Parse typed data
      const { domain, types, primaryType, message } =
        typeof typedData === 'string' ? JSON.parse(typedData) : typedData;

      // Sign typed data
      const signature = await signTypedData({
        domain,
        types,
        primaryType,
        message,
        privateKey: pk as `0x${string}`,
      });

      return signature;
    } catch (error) {
      console.error('[Web3Service] Sign typed data error:', error);
      throw new Error(`Failed to sign typed data: ${error.message}`);
    }
  }

  /**
   * Forward RPC request to Injective node
   */
  async forwardRPCRequest(method: string, params: any[]): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(this.rpcUrl, {
          jsonrpc: '2.0',
          id: Date.now(),
          method,
          params,
        }),
      );

      if (response.data.error) {
        throw new Error(response.data.error.message);
      }

      return response.data.result;
    } catch (error) {
      console.error('[Web3Service] RPC request error:', error);
      throw new Error(`RPC request failed: ${error.message}`);
    }
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(transaction: any): Promise<string> {
    try {
      const gasEstimate = await this.forwardRPCRequest('eth_estimateGas', [
        {
          from: transaction.from,
          to: transaction.to,
          value: transaction.value || '0x0',
          data: transaction.data || '0x',
        },
      ]);

      return gasEstimate;
    } catch (error) {
      console.error('[Web3Service] Estimate gas error:', error);
      throw new Error(`Failed to estimate gas: ${error.message}`);
    }
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash: string): Promise<any> {
    try {
      const receipt = await this.forwardRPCRequest(
        'eth_getTransactionReceipt',
        [txHash],
      );

      return receipt;
    } catch (error) {
      console.error('[Web3Service] Get receipt error:', error);
      throw new Error(`Failed to get transaction receipt: ${error.message}`);
    }
  }

  /**
   * Get account balance
   */
  async getBalance(address: string): Promise<string> {
    try {
      const balance = await this.forwardRPCRequest('eth_getBalance', [
        address,
        'latest',
      ]);

      return balance;
    } catch (error) {
      console.error('[Web3Service] Get balance error:', error);
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  /**
   * Get transaction count (nonce)
   */
  async getTransactionCount(address: string): Promise<string> {
    try {
      const count = await this.forwardRPCRequest('eth_getTransactionCount', [
        address,
        'latest',
      ]);

      return count;
    } catch (error) {
      console.error('[Web3Service] Get transaction count error:', error);
      throw new Error(`Failed to get transaction count: ${error.message}`);
    }
  }

  /**
   * Call contract method (read-only)
   */
  async call(transaction: any): Promise<any> {
    try {
      const result = await this.forwardRPCRequest('eth_call', [
        {
          from: transaction.from,
          to: transaction.to,
          data: transaction.data,
        },
        'latest',
      ]);

      return result;
    } catch (error) {
      console.error('[Web3Service] Call error:', error);
      throw new Error(`Contract call failed: ${error.message}`);
    }
  }
}
