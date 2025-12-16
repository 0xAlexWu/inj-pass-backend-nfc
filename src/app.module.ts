import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PasskeyModule } from './passkey/passkey.module';

@Module({
  imports: [PasskeyModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
