import { Controller, Get, Post, Put, Delete, Body, Query, Param } from '@nestjs/common';
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

  @Get('employees/:resourceId')
  async getEmployeeByResourceId(@Param('resourceId') resourceId: string) {
    return this.masterDataService.getEmployeeByResourceId(resourceId);
  }

  @Post('employees')
  async createEmployee(
    @Body()
    body: {
      resourceId: string;
      name: string;
      mobile: string;
      email?: string;
      aadhaarNumber?: string;
      panNumber?: string;
      city?: string;
      isIdentityVerified?: boolean;
    },
  ) {
    return this.masterDataService.createEmployee(body);
  }

  @Put('employees/:resourceId')
  async updateEmployee(
    @Param('resourceId') resourceId: string,
    @Body()
    body: {
      name?: string;
      mobile?: string;
      email?: string;
      aadhaarNumber?: string;
      panNumber?: string;
      city?: string;
      isIdentityVerified?: boolean;
    },
  ) {
    return this.masterDataService.updateEmployee(resourceId, body);
  }

  @Delete('employees/:resourceId')
  async deleteEmployee(@Param('resourceId') resourceId: string) {
    return this.masterDataService.deleteEmployee(resourceId);
  }
}
