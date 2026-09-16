import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions, TypeOrmModuleOptions } from '@nestjs/typeorm';
import {
  Employee,
  City,
  Center,
  Exam,
  Role,
  Shift,
  Duty,
  AttendanceFile,
} from '../entities';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const host = configService.get<string>('DB_HOST', 'localhost');
  const instance = configService.get<string>('DB_INSTANCE');
  const database = configService.get<string>('DB_NAME', 'ExamDutyDB2');
  const username = configService.get<string>('DB_USER');
  const password = configService.get<string>('DB_PASSWORD');
  const encrypt = configService.get<string>('DB_ENCRYPT', 'false') === 'true';
  const trustServerCertificate =
    configService.get<string>('DB_TRUST_SERVER_CERTIFICATE', 'true') === 'true';
  const portStr = configService.get<string>('DB_PORT');
  const port = portStr ? parseInt(portStr, 10) : undefined;

  const options: Record<string, any> = {
    encrypt,
    trustServerCertificate,
  };

  if (port) {
    options.port = port;
  } else if (instance && instance.trim().length > 0) {
    options.instanceName = instance.trim();
  }

  return {
    type: 'mssql',
    host,
    port,
    username,
    password,
    database,
    options,
    extra: {
      trustServerCertificate,
    },
    entities: [Employee, City, Center, Exam, Role, Shift, Duty, AttendanceFile],
    autoLoadEntities: true,
    synchronize: true, // Auto-create/sync tables in development
    logging: ['error', 'warn'],
  };
};

export const databaseConfigAsync: TypeOrmModuleAsyncOptions = {
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => getDatabaseConfig(configService),
};
