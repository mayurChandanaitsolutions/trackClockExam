import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
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
    const allCities = await this.cityRepo.find();
    const orderMap: Record<string, number> = {
      'Mysore': 1,
      'Bengaluru': 2,
      'Mangalore': 3,
      'Shivmogga': 4,
      'Mandya': 5,
      'Davanagere': 6,
      'Dharwad': 7,
    };
    return allCities
      .filter((c) => orderMap[c.name] !== undefined)
      .sort((a, b) => (orderMap[a.name] || 99) - (orderMap[b.name] || 99));
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
    let roles = await this.roleRepo.find({ order: { name: 'ASC' } });
    const hasELS = roles.some(
      (r) =>
        r.name?.toLowerCase() === 'equity lab supervisior_ ssc'.toLowerCase() ||
        r.code?.toUpperCase() === 'ELS_SSC',
    );
    if (!hasELS) {
      try {
        const newRole = await this.roleRepo.save({
          name: 'Equity Lab Supervisior_ ssc',
          code: 'ELS_SSC',
        });
        roles.push(newRole);
        roles.sort((a, b) => a.name.localeCompare(b.name));
      } catch {
        // If inserted concurrently, reload
        roles = await this.roleRepo.find({ order: { name: 'ASC' } });
      }
    }
    return roles;
  }

  async getShifts(): Promise<Shift[]> {
    const allShifts = await this.shiftRepo.find({ order: { name: 'ASC' } });
    const allowed = ['Shift 1', 'Shift 2', 'Shift 3'];
    const filtered = allShifts.filter((s) => allowed.includes(s.name));
    return filtered.length > 0 ? filtered : allShifts;
  }

  async getEmployees(): Promise<Employee[]> {
    return this.employeeRepo.find({
      select: ['id', 'resourceId', 'name', 'mobile', 'email', 'aadhaarNumber', 'panNumber', 'city', 'status', 'isIdentityVerified'],
      order: { name: 'ASC' },
    });
  }

  async createEmployee(dto: {
    resourceId: string;
    name: string;
    mobile: string;
    email?: string;
    aadhaarNumber?: string;
    panNumber?: string;
    city?: string;
    isIdentityVerified?: boolean;
  }): Promise<Employee> {
    if (!dto.resourceId || !dto.name || !dto.mobile) {
      throw new BadRequestException('Resource ID, Full Name, and Contact / Mobile Number are required.');
    }
    const resId = dto.resourceId.trim();
    const existing = await this.employeeRepo.findOne({
      where: [{ resourceId: resId }, { mobile: dto.mobile.trim() }],
    });
    if (existing) {
      throw new ConflictException(
        `An employee with Resource ID "${resId}" or Contact Number "${dto.mobile.trim()}" already exists.`,
      );
    }

    const hasIdDetails = Boolean(
      dto.aadhaarNumber?.trim() && dto.panNumber?.trim()
    );

    const emp = this.employeeRepo.create({
      resourceId: resId,
      name: dto.name.trim(),
      mobile: dto.mobile.trim(),
      email: dto.email?.trim() || undefined,
      aadhaarNumber: dto.aadhaarNumber?.trim() || undefined,
      panNumber: dto.panNumber?.trim()?.toUpperCase() || undefined,
      city: dto.city?.trim() || undefined,
      isIdentityVerified: dto.isIdentityVerified ?? hasIdDetails,
      status: 'Active',
    });
    const savedEmp = await this.employeeRepo.save(emp);

    console.log('\x1b[32m====================================================\x1b[0m');
    console.log('\x1b[32m✔ DATABASE CONNECTED SUCCESSFULLY\x1b[0m');
    console.log(`✔ [Employee Added] Name: ${savedEmp.name} (Resource ID: ${savedEmp.resourceId})`);
    console.log('\x1b[32m====================================================\x1b[0m');

    return savedEmp;
  }

  async getEmployeeByResourceId(resourceId: string): Promise<Employee & { isIdentityVerified: boolean }> {
    const emp = await this.employeeRepo.findOne({
      where: { resourceId: resourceId.trim() },
      select: ['id', 'resourceId', 'name', 'mobile', 'email', 'aadhaarNumber', 'panNumber', 'city', 'status', 'isIdentityVerified'],
    });
    if (!emp) {
      throw new NotFoundException(`Employee with Resource ID "${resourceId}" not found.`);
    }
    const isVerified = Boolean(
      emp.isIdentityVerified ||
      (emp.aadhaarNumber && emp.aadhaarNumber.trim().length >= 10 &&
       emp.panNumber && emp.panNumber.trim().length >= 8)
    );
    return Object.assign(emp, { isIdentityVerified: isVerified });
  }

  async updateEmployee(
    resourceId: string,
    dto: {
      name?: string;
      mobile?: string;
      email?: string;
      aadhaarNumber?: string;
      panNumber?: string;
      city?: string;
      isIdentityVerified?: boolean;
    },
  ): Promise<Employee> {
    const emp = await this.employeeRepo.findOne({
      where: { resourceId: resourceId.trim() },
    });
    if (!emp) {
      throw new NotFoundException(`Employee with Resource ID "${resourceId}" not found.`);
    }
    if (dto.name) emp.name = dto.name.trim();
    if (dto.mobile) emp.mobile = dto.mobile.trim();
    if (dto.email !== undefined) emp.email = dto.email ? dto.email.trim() : undefined;
    if (dto.aadhaarNumber !== undefined) emp.aadhaarNumber = dto.aadhaarNumber ? dto.aadhaarNumber.trim() : undefined;
    if (dto.panNumber !== undefined) emp.panNumber = dto.panNumber ? dto.panNumber.trim().toUpperCase() : undefined;
    if (dto.city !== undefined) emp.city = dto.city ? dto.city.trim() : undefined;
    if (dto.isIdentityVerified !== undefined) {
      emp.isIdentityVerified = dto.isIdentityVerified;
    } else if (emp.aadhaarNumber && emp.panNumber) {
      emp.isIdentityVerified = true;
    }
    return this.employeeRepo.save(emp);
  }

  async deleteEmployee(resourceId: string): Promise<{ message: string }> {
    const emp = await this.employeeRepo.findOne({
      where: { resourceId: resourceId.trim() },
    });
    if (!emp) {
      throw new NotFoundException(`Employee with Resource ID "${resourceId}" not found.`);
    }
    if (emp.resourceId === '17655') {
      throw new BadRequestException('Primary system administrator cannot be deleted.');
    }
    await this.employeeRepo.remove(emp);
    return { message: `Employee "${emp.name}" (ID: ${emp.resourceId}) was deleted successfully.` };
  }
}
