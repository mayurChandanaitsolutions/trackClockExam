import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Global prefix: /api
  app.setGlobalPrefix('api');

  // Configure CORS: Support all localhost ports (3000, 3001, 5173, etc.) dynamically
  const corsOriginsEnv = configService.get<string>(
    'CORS_ORIGINS',
    'http://localhost:3000,http://localhost:3001,http://localhost:5173,http://localhost:8081,http://localhost:19006',
  );
  const allowedOrigins = corsOriginsEnv
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) {
        return callback(null, true);
      }
      // Allow any localhost or 127.0.0.1 on any port (3000, 3001, 5173, etc.)
      const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
      if (isLocalhost || allowedOrigins.includes(origin)) {
        return callback(null, origin);
      }
      return callback(null, origin);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-resource-id', 'x-employee-id'],
  });

  // Global ValidationPipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = configService.get<number>('PORT', 5000);
  await app.listen(port);

  // Check database connection and log status
  try {
    const dataSource = app.get(DataSource);
    if (dataSource && dataSource.isInitialized) {
      await dataSource.query('SELECT 1');
      console.log('\x1b[32m====================================================\x1b[0m');
      console.log('\x1b[32m✔ DATABASE CONNECTED SUCCESSFULLY\x1b[0m');
      console.log(`✔ Database Name : ${configService.get<string>('DB_NAME', 'ExamDutyDB2')}`);
      console.log('\x1b[32m====================================================\x1b[0m');
    } else {
      console.log('\x1b[31m====================================================\x1b[0m');
      console.log('\x1b[31m✖ DATABASE CONNECTION FAILED: DataSource not initialized\x1b[0m');
      console.log('\x1b[31m====================================================\x1b[0m');
    }
  } catch (dbErr: any) {
    console.log('\x1b[31m====================================================\x1b[0m');
    console.log('\x1b[31m✖ DATABASE CONNECTION FAILED\x1b[0m');
    console.log(`Error: ${dbErr?.message || dbErr}`);
    console.log('\x1b[31m====================================================\x1b[0m');
  }

  logger.log(`Server is running on: http://localhost:${port}/api`);
  logger.log(`Health endpoint: http://localhost:${port}/api/health`);
}

bootstrap();
