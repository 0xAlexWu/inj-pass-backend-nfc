import { Module } from '@nestjs/common';
import { PasskeyController } from './passkey.controller';
import { PasskeyService } from './passkey.service';
import { ChallengeStorageService } from './challenge-storage.service';

@Module({
  controllers: [PasskeyController],
  providers: [PasskeyService, ChallengeStorageService],
  exports: [PasskeyService],
})
export class PasskeyModule {}
