import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Duty, Employee } from '../../entities';

function parseDutyMonth(dutyDateStr?: string, createdAt?: Date): { monthIndex: number; year: number } {
  if (dutyDateStr) {
    const str = dutyDateStr.trim().toLowerCase();

    // 1. Textual month names: jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    for (let i = 0; i < monthNames.length; i++) {
      if (str.includes(monthNames[i])) {
        const yearMatch = str.match(/\b(20\d\d)\b/);
        const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();
        return { monthIndex: i, year };
      }
    }

    // 2. YYYY-MM-DD or YYYY/MM/DD (e.g., 2026-09-16)
    const ymdMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (ymdMatch) {
      const year = parseInt(ymdMatch[1], 10);
      const monthIndex = parseInt(ymdMatch[2], 10) - 1; // 0-indexed (8 = Sep)
      return { monthIndex, year };
    }

    // 3. DD-MM-YYYY or DD/MM/YYYY (e.g., 16-09-2026)
    const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (dmyMatch) {
      const year = parseInt(dmyMatch[3], 10);
      const monthIndex = parseInt(dmyMatch[2], 10) - 1;
      return { monthIndex, year };
    }

    // 4. Standard Date parsing
    const parsed = new Date(dutyDateStr);
    if (!isNaN(parsed.getTime())) {
      return { monthIndex: parsed.getMonth(), year: parsed.getFullYear() };
    }
  }

  // Fallback to createdAt or current date
  const fallback = createdAt ? new Date(createdAt) : new Date();
  return { monthIndex: fallback.getMonth(), year: fallback.getFullYear() };
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Duty)
    private readonly dutyRepo: Repository<Duty>,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
  ) {}

  async getEmployeeDashboard(resourceId: string = 'ALL') {
    const isAll = !resourceId || resourceId.toUpperCase() === 'ALL' || resourceId === '17655';
    let employee: Employee | null = null;

    if (resourceId && resourceId.toUpperCase() !== 'ALL') {
      employee = await this.employeeRepo.findOne({
        where: { resourceId: resourceId.trim() },
      });
    }

    // 1. Fetch duties from MSSQL (either filtered by employee or all system duties)
    const whereClause = employee && !isAll ? { employeeId: employee.id } : {};
    const duties = await this.dutyRepo.find({
      where: whereClause,
      relations: ['exam', 'center', 'city', 'role', 'shift', 'attendanceFile', 'employee'],
      order: { createdAt: 'DESC' },
    });

    const totalDuties = duties.length;
    const systemTotalDuties = await this.dutyRepo.count();
    const systemEmployeesCount = await this.employeeRepo.count();

    const now = new Date();
    const currentMonthIndex = now.getMonth(); // 8 for September in 2026

    // 2. Compute "This Month" (duties matching current month)
    const thisMonthDuties = duties.filter((d) => {
      const info = parseDutyMonth(d.dutyDate, d.createdAt);
      return info.monthIndex === currentMonthIndex;
    }).length;

    // 3. Compute Exams vs Mocks from real MSSQL records
    const isMock = (d: Duty) => {
      const type = (d.dutyType || d.exam?.type || '').trim().toLowerCase();
      return type === 'mock' || type.includes('mock');
    };
    const mocksCount = duties.filter(isMock).length;
    const examsCount = duties.length - mocksCount;

    // 4. Recent Duties (Top 5) with employee names
    const recentDuties = duties.slice(0, 5).map((d, index) => ({
      num: index + 1,
      id: d.id,
      exam: d.exam?.name || d.dutyType,
      date: d.dutyDate,
      center: d.center?.centerName || 'Center',
      city: d.city?.name || 'City',
      role: d.role?.code || 'Invigilator',
      shift: d.shift?.name || 'Shift 1',
      status: d.status,
      reportingTime: d.reportingTime,
      shiftEndTime: d.shiftEndTime,
      employeeName: d.employee?.name || employee?.name || 'Staff Member',
      resourceId: d.employee?.resourceId || employee?.resourceId || '',
    }));

    // 5. Monthly Duty Overview calculated from database records
    const months = [
      { name: 'Apr', index: 3 },
      { name: 'May', index: 4 },
      { name: 'Jun', index: 5 },
      { name: 'Jul', index: 6 },
      { name: 'Aug', index: 7 },
      { name: 'Sep', index: 8 },
      { name: 'Oct', index: 9 },
    ];
    const monthlyOverview = months.map((m) => {
      const monthDuties = duties.filter((d) => {
        const info = parseDutyMonth(d.dutyDate, d.createdAt);
        return info.monthIndex === m.index;
      });
      const mocks = monthDuties.filter(isMock).length;
      const exams = monthDuties.length - mocks;
      return {
        month: m.name,
        exams,
        mocks,
        total: exams + mocks,
        isCurrent: m.index === currentMonthIndex,
      };
    });

    return {
      status: 'ok',
      employee: employee
        ? {
            id: employee.id,
            resourceId: employee.resourceId,
            name: employee.name,
            email: employee.email,
            city: employee.city,
            status: employee.status,
          }
        : {
            id: 'system',
            resourceId: 'ALL',
            name: 'All Staff Members',
            status: 'Active',
          },
      stats: {
        totalDuties,
        systemTotalDuties,
        systemEmployeesCount,
        thisMonth: thisMonthDuties,
        exams: examsCount,
        mocks: mocksCount,
      },
      monthlyOverview,
      recentDuties,
    };
  }
}
