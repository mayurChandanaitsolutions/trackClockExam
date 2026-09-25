import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from '../../entities';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
  ) {}

  async login(
    resourceId: string,
    mobile: string,
    loginType: 'admin' | 'employee' = 'employee',
  ): Promise<Employee & { role: 'admin' | 'employee'; isAdmin: boolean }> {
    const employee = await this.employeeRepo.findOne({
      where: {
        resourceId: resourceId.trim(),
        mobile: mobile.trim(),
      },
    });

    if (!employee) {
      throw new UnauthorizedException(
        'Invalid workforce credentials. Please check your Resource ID and Mobile Number.',
      );
    }

    if (employee.status !== 'Active') {
      throw new UnauthorizedException('This employee account is currently inactive.');
    }

    const resUpper = employee.resourceId.trim().toUpperCase();
    const isAdmin =
      resUpper === '17655' ||
      resUpper.includes('ADMIN') ||
      resUpper.includes('CHANDANA');

    if (loginType === 'admin' && !isAdmin) {
      throw new UnauthorizedException(
        `Access Denied: Resource ID ${employee.resourceId} (${employee.name}) does not have Administrator privileges. Please switch to Employee login.`,
      );
    }

    const isVerified = Boolean(
      employee.isIdentityVerified ||
      (employee.aadhaarNumber && employee.aadhaarNumber.trim().length >= 10 &&
       employee.panNumber && employee.panNumber.trim().length >= 8)
    );

    return Object.assign(employee, {
      role: (isAdmin && loginType === 'admin' ? 'admin' : (isAdmin ? 'admin' : 'employee')) as 'admin' | 'employee',
      isAdmin,
      isIdentityVerified: isVerified,
    });
  }

  async getProfile(resourceId?: string, employeeId?: string): Promise<Employee> {
    let employee: Employee | null = null;

    if (employeeId) {
      employee = await this.employeeRepo.findOne({ where: { id: employeeId } });
    } else if (resourceId) {
      employee = await this.employeeRepo.findOne({ where: { resourceId: resourceId.trim() } });
    } else {
      // Default to the primary active employee
      employee = await this.employeeRepo.findOne({ where: { resourceId: '17655' } });
    }

    if (!employee) {
      throw new NotFoundException('Employee profile not found.');
    }

    return employee;
  }
}
