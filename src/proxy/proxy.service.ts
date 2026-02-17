import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ProxyService {
  constructor(private readonly httpService: HttpService) {}

  /**
   * Fetch URL with custom headers
   */
  async fetchUrl(url: string): Promise<{
    data: string;
    headers: Record<string, string>;
    status: number;
  }> {
    const response = await firstValueFrom(
      this.httpService.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        responseType: 'text',
        maxRedirects: 5,
      }),
    );

    return {
      data: response.data,
      headers: response.headers as Record<string, string>,
      status: response.status,
    };
  }

  /**
   * Clean headers to allow iframe embedding
   */
  cleanHeaders(headers: Record<string, string>): Record<string, string> {
    const cleaned = { ...headers };

    // Remove headers that prevent iframe embedding
    delete cleaned['x-frame-options'];
    delete cleaned['X-Frame-Options'];
    delete cleaned['content-security-policy'];
    delete cleaned['Content-Security-Policy'];

    // Modify CSP if present
    if (cleaned['content-security-policy']) {
      cleaned['content-security-policy'] = this.modifyCSP(
        cleaned['content-security-policy'],
      );
    }

    return cleaned;
  }

  /**
   * Modify Content-Security-Policy to allow iframe embedding
   */
  private modifyCSP(csp: string): string {
    // Remove frame-ancestors directive
    return csp
      .split(';')
      .filter((directive) => !directive.trim().startsWith('frame-ancestors'))
      .join(';');
  }
}
