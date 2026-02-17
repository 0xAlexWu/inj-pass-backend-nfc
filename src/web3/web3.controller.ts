import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { Web3Service } from './web3.service';
import {
  SignTransactionDto,
  SignMessageDto,
  RPCRequestDto,
} from './dto/web3.dto';

/**
 * Web3 Controller
 * Handles Web3 RPC requests and transaction signing
 */
@Controller('web3')
export class Web3Controller {
  constructor(private readonly web3Service: Web3Service) {}

  /**
   * Sign a transaction
   */
  @Post('sign-transaction')
  async signTransaction(@Body() dto: SignTransactionDto) {
    try {
      const signature = await this.web3Service.signTransaction(
        dto.privateKey,
        dto.transaction,
      );

      return {
        success: true,
        signature,
        txHash: signature, // For compatibility
      };
    } catch (error) {
      console.error('[Web3] Sign transaction error:', error);
      throw new HttpException(
        `Failed to sign transaction: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Sign a message
   */
  @Post('sign-message')
  async signMessage(@Body() dto: SignMessageDto) {
    try {
      const signature = await this.web3Service.signMessage(
        dto.privateKey,
        dto.message,
      );

      return {
        success: true,
        signature,
      };
    } catch (error) {
      console.error('[Web3] Sign message error:', error);
      throw new HttpException(
        `Failed to sign message: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Sign typed data (EIP-712)
   */
  @Post('sign-typed-data')
  async signTypedData(@Body() dto: SignMessageDto) {
    try {
      const signature = await this.web3Service.signTypedData(
        dto.privateKey,
        dto.message,
      );

      return {
        success: true,
        signature,
      };
    } catch (error) {
      console.error('[Web3] Sign typed data error:', error);
      throw new HttpException(
        `Failed to sign typed data: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * RPC proxy - forward RPC requests to Injective node
   */
  @Post('rpc')
  async rpcProxy(@Body() dto: RPCRequestDto) {
    try {
      const result = await this.web3Service.forwardRPCRequest(
        dto.method,
        dto.params || [],
      );

      return {
        success: true,
        result,
      };
    } catch (error) {
      console.error('[Web3] RPC proxy error:', error);
      throw new HttpException(
        `RPC request failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Estimate gas for a transaction
   */
  @Post('estimate-gas')
  async estimateGas(@Body() dto: { transaction: any }) {
    try {
      const gasEstimate = await this.web3Service.estimateGas(dto.transaction);

      return {
        success: true,
        gasEstimate,
      };
    } catch (error) {
      console.error('[Web3] Estimate gas error:', error);
      throw new HttpException(
        `Failed to estimate gas: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get transaction receipt
   */
  @Post('get-receipt')
  async getReceipt(@Body() dto: { txHash: string }) {
    try {
      const receipt = await this.web3Service.getTransactionReceipt(dto.txHash);

      return {
        success: true,
        receipt,
      };
    } catch (error) {
      console.error('[Web3] Get receipt error:', error);
      throw new HttpException(
        `Failed to get transaction receipt: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
