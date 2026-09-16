import { Controller, Get, Query, Headers } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('employee')
  async getEmployeeDashboard(
    @Query('resourceId') queryResourceId?: string,
    @Headers('x-resource-id') headerResourceId?: string,
  ) {
    const resourceId = headerResourceId || queryResourceId || 'ALL';
    return this.dashboardService.getEmployeeDashboard(resourceId);
  }
}
