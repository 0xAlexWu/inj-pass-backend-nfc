import { Controller, Get, Query, Res, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ProxyService } from './proxy.service';

/**
 * Proxy Controller
 * Provides a proxy service to bypass X-Frame-Options restrictions
 */
@Controller('proxy')
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  /**
   * Proxy a URL and remove X-Frame-Options headers
   * This allows us to embed DApps that normally block iframe embedding
   */
  @Get()
  async proxy(
    @Query('url') url: string,
    @Res() res: Response,
  ) {
    if (!url) {
      throw new HttpException('URL parameter is required', HttpStatus.BAD_REQUEST);
    }

    try {
      // Validate URL
      new URL(url);
    } catch (error) {
      throw new HttpException('Invalid URL', HttpStatus.BAD_REQUEST);
    }

    try {
      const { data, headers, status } = await this.proxyService.fetchUrl(url);

      // Remove headers that prevent iframe embedding
      const cleanHeaders = this.proxyService.cleanHeaders(headers);

      // Set response headers
      Object.entries(cleanHeaders).forEach(([key, value]) => {
        res.setHeader(key, value as string);
      });

      // Add CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      // Send response
      res.status(status).send(data);
    } catch (error) {
      console.error('[Proxy] Error fetching URL:', error);
      throw new HttpException(
        `Failed to fetch URL: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Get iframe-safe URL for a DApp
   */
  @Get('iframe-url')
  getIframeUrl(@Query('url') url: string): { proxyUrl: string } {
    if (!url) {
      throw new HttpException('URL parameter is required', HttpStatus.BAD_REQUEST);
    }

    const baseUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const proxyUrl = `${baseUrl}/api/proxy?url=${encodeURIComponent(url)}`;

    return { proxyUrl };
  }

  /**
   * Proxy CoinGecko API to avoid CORS issues
   */
  @Get('coingecko')
  async coingecko(
    @Query('ids') ids: string,
    @Query('vs_currencies') vsCurrencies: string,
  ) {
    if (!ids || !vsCurrencies) {
      throw new HttpException('ids and vs_currencies parameters are required', HttpStatus.BAD_REQUEST);
    }

    try {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=${vsCurrencies}`;
      const { data } = await this.proxyService.fetchUrl(url);
      
      // Parse the response (it's already a string)
      const jsonData = typeof data === 'string' ? JSON.parse(data) : data;
      
      return jsonData;
    } catch (error) {
      console.error('[Proxy] Error fetching CoinGecko data:', error);
      throw new HttpException(
        `Failed to fetch CoinGecko data: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
