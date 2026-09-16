import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class HealthService {
  constructor(private readonly dataSource: DataSource) {}

  async checkHealth(): Promise<{
    status: string;
    service: string;
    database: string;
  }> {
    try {
      if (!this.dataSource.isInitialized) {
        throw new Error('DataSource is not initialized');
      }

      await this.dataSource.query('SELECT 1 AS result');

      return {
        status: 'ok',
        service: 'exam-duty-management-api',
        database: 'connected',
      };
    } catch (error) {
      throw new ServiceUnavailableException({
        status: 'error',
        service: 'exam-duty-management-api',
        database: 'disconnected',
        details: error instanceof Error ? error.message : 'Database error',
      });
    }
  }
}
