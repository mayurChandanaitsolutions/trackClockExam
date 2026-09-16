import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { City, Center, Exam, Role, Shift, Employee } from '../../entities';

@Injectable()
export class MasterDataService {
  constructor(
    @InjectRepository(City)
    private readonly cityRepo: Repository<City>,
    @InjectRepository(Center)
    private readonly centerRepo: Repository<Center>,
    @InjectRepository(Exam)
    private readonly examRepo: Repository<Exam>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(Shift)
    private readonly shiftRepo: Repository<Shift>,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
  ) {}

  async getCities(): Promise<City[]> {
    return this.cityRepo.find({ order: { name: 'ASC' } });
  }

  async getCenters(cityId?: string): Promise<Center[]> {
    const where = cityId ? { cityId } : {};
    return this.centerRepo.find({
      where,
      relations: ['city'],
      order: { centerName: 'ASC' },
    });
  }

  async getExams(): Promise<Exam[]> {
    return this.examRepo.find({ order: { name: 'ASC' } });
  }

  async getRoles(): Promise<Role[]> {
    return this.roleRepo.find({ order: { name: 'ASC' } });
  }

  async getShifts(): Promise<Shift[]> {
    return this.shiftRepo.find({ order: { name: 'ASC' } });
  }

  async getEmployees(): Promise<Employee[]> {
    return this.employeeRepo.find({
      select: ['id', 'resourceId', 'name', 'mobile', 'email', 'city', 'status'],
      order: { name: 'ASC' },
    });
  }
}
