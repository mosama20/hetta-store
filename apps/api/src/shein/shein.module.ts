import { Module } from '@nestjs/common';
import { SheinController } from './shein.controller';
import { SheinService } from './shein.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [PrismaModule, SettingsModule],
  controllers: [SheinController],
  providers: [SheinService],
  exports: [SheinService],
})
export class SheinModule {}
