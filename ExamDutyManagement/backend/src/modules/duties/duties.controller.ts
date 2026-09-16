import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Headers,
} from '@nestjs/common';
import { DutiesService } from './duties.service';
import { CreateDutyDto, UpdateDutyDto } from './duties.dto';

@Controller('duties')
export class DutiesController {
  constructor(private readonly dutiesService: DutiesService) {}

  @Post()
  async createDuty(
    @Body() dto: CreateDutyDto,
    @Headers('x-resource-id') headerResourceId?: string,
  ) {
    if (!dto.resourceId && headerResourceId) {
      dto.resourceId = headerResourceId;
    }
    const duty = await this.dutiesService.createDuty(dto);
    return {
      status: 'ok',
      message: 'Duty assignment created successfully in MSSQL',
      duty,
    };
  }

  @Get()
  async getAllDuties(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('resourceId') resourceId?: string,
    @Query('dutyType') dutyType?: string,
  ) {
    if (resourceId && resourceId.toUpperCase() !== 'ALL') {
      const duties = await this.dutiesService.getMyDuties(resourceId, status, search, dutyType);
      return {
        status: 'ok',
        count: duties.length,
        duties,
      };
    }
    const duties = await this.dutiesService.getAllDuties(status, search, dutyType);
    return {
      status: 'ok',
      count: duties.length,
      duties,
    };
  }

  @Get('my')
  async getMyDuties(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('resourceId') queryResourceId?: string,
    @Query('dutyType') dutyType?: string,
    @Headers('x-resource-id') headerResourceId?: string,
  ) {
    const resourceId = queryResourceId || headerResourceId || 'ALL';
    const duties = await this.dutiesService.getMyDuties(resourceId, status, search, dutyType);
    return {
      status: 'ok',
      count: duties.length,
      duties,
    };
  }

  @Get(':id')
  async getDutyById(@Param('id') id: string) {
    const duty = await this.dutiesService.getDutyById(id);
    return {
      status: 'ok',
      duty,
    };
  }

  @Put(':id')
  async updateDuty(@Param('id') id: string, @Body() dto: UpdateDutyDto) {
    const updatedDuty = await this.dutiesService.updateDuty(id, dto);
    return {
      status: 'ok',
      message: 'Duty updated successfully in MSSQL',
      duty: updatedDuty,
    };
  }

  @Delete(':id')
  async deleteDuty(@Param('id') id: string) {
    return this.dutiesService.deleteDuty(id);
  }
}
