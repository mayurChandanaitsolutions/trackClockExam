import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterDataController } from './master-data.controller';
import { MasterDataService } from './master-data.service';
import { City, Center, Exam, Role, Shift, Employee } from '../../entities';

@Module({
  imports: [TypeOrmModule.forFeature([City, Center, Exam, Role, Shift, Employee])],
  controllers: [MasterDataController],
  providers: [MasterDataService],
  exports: [MasterDataService],
})
export class MasterDataModule {}
