import { Controller, Post, Body, Get } from '@nestjs/common';
import { PasskeyService } from './passkey.service';
import {
  ChallengeRequestDto,
  ChallengeResponseDto,
  VerifyRequestDto,
  VerifyResponseDto,
} from './dto/passkey.dto';

@Controller('passkey')
export class PasskeyController {
  constructor(private readonly passkeyService: PasskeyService) {}

  @Post('challenge')
  async generateChallenge(
    @Body() dto: ChallengeRequestDto,
  ): Promise<ChallengeResponseDto> {
    return this.passkeyService.generateChallenge(dto);
  }

  @Post('verify')
  async verifyPasskey(
    @Body() dto: VerifyRequestDto,
  ): Promise<VerifyResponseDto> {
    return this.passkeyService.verifyPasskey(dto);
  }

  @Get('stats')
  getStats() {
    return this.passkeyService.getStorageStats();
  }
}
