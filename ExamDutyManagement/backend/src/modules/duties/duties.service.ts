import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Duty, Employee } from '../../entities';
import { CreateDutyDto, UpdateDutyDto } from './duties.dto';

@Injectable()
export class DutiesService {
  constructor(
    @InjectRepository(Duty)
    private readonly dutyRepo: Repository<Duty>,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
  ) {}

  private async resolveOrCreateEmployee(dto: CreateDutyDto): Promise<string> {
    if (dto.employeeId) {
      const existing = await this.employeeRepo.findOne({ where: { id: dto.employeeId } });
      if (existing) return existing.id;
    }

    const resId = (dto.resourceId || '').trim();
    if (!resId && !dto.employeeId) {
      throw new BadRequestException('Staff / Resource ID is required to assign or add duty.');
    }

    let emp = resId
      ? await this.employeeRepo.findOne({
          where: { resourceId: resId },
        })
      : null;

    if (emp) {
      let updated = false;
      if (dto.employeeName && dto.employeeName.trim().length > 0 && emp.name !== dto.employeeName.trim()) {
        emp.name = dto.employeeName.trim();
        updated = true;
      }
      if (dto.employeeMobile && dto.employeeMobile.trim().length > 0 && emp.mobile !== dto.employeeMobile.trim()) {
        emp.mobile = dto.employeeMobile.trim();
        updated = true;
      }
      if (dto.employeeEmail && dto.employeeEmail.trim().length > 0 && emp.email !== dto.employeeEmail.trim()) {
        emp.email = dto.employeeEmail.trim();
        updated = true;
      }
      if (updated) {
        await this.employeeRepo.save(emp);
      }
      return emp.id;
    }

    // Auto-create new employee in MSSQL dbo.employees
    const randomMobile = '+91-' + Math.floor(6000000000 + Math.random() * 3999999999).toString();
    const newEmp = this.employeeRepo.create({
      resourceId: resId,
      name: dto.employeeName?.trim() || `Staff Member (${resId})`,
      mobile: dto.employeeMobile?.trim() || randomMobile,
      email: dto.employeeEmail?.trim() || `${resId.toLowerCase()}@examduty.org`,
      status: 'Active',
    });

    const saved = await this.employeeRepo.save(newEmp);
    return saved.id;
  }

  async createDuty(dto: CreateDutyDto): Promise<Duty> {
    const employeeId = await this.resolveOrCreateEmployee(dto);

    // 1. Prevent duplicate using Employee + Duty Date + Center + Shift
    const existing = await this.dutyRepo.findOne({
      where: {
        employeeId,
        dutyDate: dto.dutyDate.trim(),
        centerId: dto.centerId,
        shiftId: dto.shiftId,
      },
    });

    if (existing) {
      throw new ConflictException(
        'A duty assignment already exists for this Employee on the selected Date, Center, and Shift.',
      );
    }

    // 2. Initial duty status is strictly 'Pending'
    const newDuty = this.dutyRepo.create({
      employeeId,
      dutyDate: dto.dutyDate.trim(),
      cityId: dto.cityId,
      centerId: dto.centerId,
      dutyType: dto.dutyType || 'Exam',
      examId: dto.examId,
      roleId: dto.roleId,
      shiftId: dto.shiftId,
      reportingTime: dto.reportingTime || '07:30 AM',
      shiftEndTime: dto.shiftEndTime || '01:30 PM',
      status: 'Pending',
      attendanceFileId: dto.attendanceFileId || null,
    });

    return this.dutyRepo.save(newDuty);
  }

  async getMyDuties(
    resourceId?: string,
    statusFilter?: string,
    searchQuery?: string,
    dutyTypeFilter?: string,
  ): Promise<Duty[]> {
    const query = this.dutyRepo
      .createQueryBuilder('duty')
      .leftJoinAndSelect('duty.employee', 'employee')
      .leftJoinAndSelect('duty.exam', 'exam')
      .leftJoinAndSelect('duty.center', 'center')
      .leftJoinAndSelect('duty.city', 'city')
      .leftJoinAndSelect('duty.role', 'role')
      .leftJoinAndSelect('duty.shift', 'shift')
      .leftJoinAndSelect('duty.attendanceFile', 'attendanceFile');

    const resId = (resourceId || '').trim();
    if (resId && resId.toUpperCase() !== 'ALL') {
      const emp = await this.employeeRepo.findOne({ where: { resourceId: resId } });
      if (emp) {
        query.where('duty.employeeId = :employeeId', { employeeId: emp.id });
      }
    }

    // Status filter: All / Pending / Approved / Rejected
    if (statusFilter && statusFilter !== 'All') {
      query.andWhere('duty.status = :status', { status: statusFilter });
    }

    // Duty Type filter: All / Exam / Mock
    if (dutyTypeFilter && dutyTypeFilter !== 'All') {
      query.andWhere('duty.dutyType = :dutyType', { dutyType: dutyTypeFilter });
    }

    // Search filter: Exam Name, Center Name, Center Code, Member Name, Resource ID
    if (searchQuery && searchQuery.trim().length > 0) {
      const term = `%${searchQuery.trim()}%`;
      query.andWhere(
        '(exam.name LIKE :term OR center.centerName LIKE :term OR center.centerCode LIKE :term OR employee.name LIKE :term OR employee.resourceId LIKE :term)',
        { term },
      );
    }

    query.orderBy('duty.createdAt', 'DESC');

    return query.getMany();
  }

  async getAllDuties(
    statusFilter?: string,
    searchQuery?: string,
    dutyTypeFilter?: string,
  ): Promise<Duty[]> {
    const query = this.dutyRepo
      .createQueryBuilder('duty')
      .leftJoinAndSelect('duty.employee', 'employee')
      .leftJoinAndSelect('duty.exam', 'exam')
      .leftJoinAndSelect('duty.center', 'center')
      .leftJoinAndSelect('duty.city', 'city')
      .leftJoinAndSelect('duty.role', 'role')
      .leftJoinAndSelect('duty.shift', 'shift')
      .leftJoinAndSelect('duty.attendanceFile', 'attendanceFile')
      .orderBy('duty.createdAt', 'DESC');

    if (statusFilter && statusFilter !== 'All') {
      query.andWhere('duty.status = :status', { status: statusFilter });
    }

    if (dutyTypeFilter && dutyTypeFilter !== 'All') {
      query.andWhere('duty.dutyType = :dutyType', { dutyType: dutyTypeFilter });
    }

    if (searchQuery && searchQuery.trim().length > 0) {
      const term = `%${searchQuery.trim()}%`;
      query.andWhere(
        '(exam.name LIKE :term OR center.centerName LIKE :term OR center.centerCode LIKE :term OR employee.name LIKE :term OR employee.resourceId LIKE :term)',
        { term },
      );
    }

    return query.getMany();
  }

  async getDutyById(id: string): Promise<Duty> {
    const duty = await this.dutyRepo.findOne({
      where: { id },
      relations: ['exam', 'center', 'city', 'role', 'shift', 'attendanceFile', 'employee'],
    });

    if (!duty) {
      throw new NotFoundException(`Duty with ID ${id} not found.`);
    }

    return duty;
  }

  async updateDuty(id: string, dto: UpdateDutyDto): Promise<Duty> {
    const duty = await this.getDutyById(id);

    // Business rule: Approved duties cannot be edited
    if (duty.status === 'Approved') {
      throw new BadRequestException('Approved duties cannot be edited or modified.');
    }

    // Business rule: If rejected duty is updated, status becomes 'Pending'
    if (duty.status === 'Rejected') {
      duty.status = 'Pending';
    }

    // Update mutable fields
    if (dto.dutyDate) duty.dutyDate = dto.dutyDate.trim();
    if (dto.cityId) duty.cityId = dto.cityId;
    if (dto.centerId) duty.centerId = dto.centerId;
    if (dto.dutyType) duty.dutyType = dto.dutyType;
    if (dto.examId) duty.examId = dto.examId;
    if (dto.roleId) duty.roleId = dto.roleId;
    if (dto.shiftId) duty.shiftId = dto.shiftId;
    if (dto.reportingTime) duty.reportingTime = dto.reportingTime;
    if (dto.shiftEndTime) duty.shiftEndTime = dto.shiftEndTime;
    if (dto.attendanceFileId) duty.attendanceFileId = dto.attendanceFileId;

    return this.dutyRepo.save(duty);
  }

  async deleteDuty(id: string): Promise<{ message: string }> {
    const duty = await this.getDutyById(id);

    // Business rule: Approved duties cannot be deleted
    if (duty.status === 'Approved') {
      throw new BadRequestException('Approved duties cannot be deleted.');
    }

    await this.dutyRepo.remove(duty);
    return { message: 'Duty deleted successfully from MSSQL database.' };
  }
}
