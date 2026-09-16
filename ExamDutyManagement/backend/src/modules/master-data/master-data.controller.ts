import { Controller, Get, Query } from '@nestjs/common';
import { MasterDataService } from './master-data.service';

@Controller()
export class MasterDataController {
  constructor(private readonly masterDataService: MasterDataService) {}

  @Get('cities')
  async getCities() {
    return this.masterDataService.getCities();
  }

  @Get('centers')
  async getCenters(@Query('cityId') cityId?: string) {
    return this.masterDataService.getCenters(cityId);
  }

  @Get('exams')
  async getExams() {
    return this.masterDataService.getExams();
  }

  @Get('roles')
  async getRoles() {
    return this.masterDataService.getRoles();
  }

  @Get('shifts')
  async getShifts() {
    return this.masterDataService.getShifts();
  }

  @Get('employees')
  async getEmployees() {
    return this.masterDataService.getEmployees();
  }
}
