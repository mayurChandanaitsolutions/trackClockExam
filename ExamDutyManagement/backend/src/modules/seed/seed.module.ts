import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import {
  Employee,
  City,
  Center,
  Exam,
  Role,
  Shift,
  Duty,
} from '../../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Employee,
      City,
      Center,
      Exam,
      Role,
      Shift,
      Duty,
    ]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
