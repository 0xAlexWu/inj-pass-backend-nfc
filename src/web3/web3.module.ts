import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { Web3Controller } from './web3.controller';
import { Web3Service } from './web3.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
  ],
  controllers: [Web3Controller],
  providers: [Web3Service],
  exports: [Web3Service],
})
export class Web3Module {}
