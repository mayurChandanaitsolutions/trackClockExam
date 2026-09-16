import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfigAsync } from './config/database.config';
import { HealthModule } from './health/health.module';
import { SeedModule } from './modules/seed/seed.module';
import { AuthModule } from './modules/auth/auth.module';
import { MasterDataModule } from './modules/master-data/master-data.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { DutiesModule } from './modules/duties/duties.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync(databaseConfigAsync),
    HealthModule,
    SeedModule,
    AuthModule,
    MasterDataModule,
    AttendanceModule,
    DutiesModule,
    DashboardModule,
  ],
})
export class AppModule {}
