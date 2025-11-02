import { TravelController } from './travel.controller';
import { TravelService } from './travel.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TravelEntity } from './entity/travel.entity';
import { UserModule } from '../user/user.module';

import { Module } from '@nestjs/common';
@Module({
  controllers: [TravelController],
  providers: [TravelService],
  imports: [TypeOrmModule.forFeature([TravelEntity]), UserModule],
  exports: [TravelService],
})
export class TravelModule {}
