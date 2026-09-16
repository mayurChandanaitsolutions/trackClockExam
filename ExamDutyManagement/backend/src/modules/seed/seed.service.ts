import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Employee,
  City,
  Center,
  Exam,
  Role,
  Shift,
  Duty,
} from '../../entities';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
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
    @InjectRepository(Duty)
    private readonly dutyRepo: Repository<Duty>,
  ) {}

  async onModuleInit() {
    try {
      this.logger.log('Checking database seed data...');
      await this.seedMasterData();
      await this.seedEmployeeAndDuties();
      this.logger.log('Database verification and seed completed.');
    } catch (error) {
      this.logger.error('Error during database seed:', error);
    }
  }

  private async seedMasterData() {
    // 1. Cities
    const cityCount = await this.cityRepo.count();
    if (cityCount === 0) {
      this.logger.log('Seeding cities...');
      await this.cityRepo.save([
        { name: 'Mysuru', state: 'Karnataka' },
        { name: 'Mandya', state: 'Karnataka' },
        { name: 'Bangalore', state: 'Karnataka' },
        { name: 'Hassan', state: 'Karnataka' },
        { name: 'Tumkur', state: 'Karnataka' },
      ]);
    }

    const cities = await this.cityRepo.find();
    const cityMap = new Map(cities.map((c) => [c.name, c.id]));

    // 2. Centers
    const centerCount = await this.centerRepo.count();
    if (centerCount === 0) {
      this.logger.log('Seeding centers...');
      await this.centerRepo.save([
        {
          centerCode: 'IDZ-01',
          centerName: 'IDZ Hebbal',
          cityId: cityMap.get('Mysuru') || cities[0].id,
          address: 'Hebbal Industrial Area, Mysuru',
        },
        {
          centerCode: 'PES-02',
          centerName: 'PES College of Engg.',
          cityId: cityMap.get('Mandya') || cities[0].id,
          address: 'PESCE Campus, Mandya',
        },
        {
          centerCode: 'VVCE-03',
          centerName: 'Vidyavardhaka CE',
          cityId: cityMap.get('Mysuru') || cities[0].id,
          address: 'Gokulam III Stage, Mysuru',
        },
        {
          centerCode: 'RRMCH-04',
          centerName: 'RRMCH',
          cityId: cityMap.get('Bangalore') || cities[0].id,
          address: 'Kambipura, Mysore Road, Bangalore',
        },
        {
          centerCode: 'SJB-05',
          centerName: 'SJB Institute',
          cityId: cityMap.get('Mysuru') || cities[0].id,
          address: 'Bannur Road, Mysuru',
        },
      ]);
    }

    // 3. Exams
    const examCount = await this.examRepo.count();
    if (examCount === 0) {
      this.logger.log('Seeding exams...');
      await this.examRepo.save([
        { name: 'NEET', code: 'NEET', type: 'Exam' },
        { name: 'JEE Main', code: 'JEE', type: 'Exam' },
        { name: 'UGC NET', code: 'NET', type: 'Exam' },
        { name: 'TCS', code: 'TCS', type: 'Exam' },
        { name: 'AIIMS Mock', code: 'AIIMS', type: 'Mock' },
        { name: 'GATE Mock', code: 'GATE', type: 'Mock' },
      ]);
    }

    // 4. Roles
    const roleCount = await this.roleRepo.count();
    if (roleCount === 0) {
      this.logger.log('Seeding roles...');
      await this.roleRepo.save([
        { name: 'Superintending Officer', code: 'SO' },
        { name: 'Room Invigilator', code: 'Invigilator' },
        { name: 'Center Observer', code: 'Center Observer' },
        { name: 'Mobile Observer Team', code: 'MOT' },
        { name: 'Local Observer Team', code: 'LOT' },
      ]);
    }

    // 5. Shifts
    const shiftCount = await this.shiftRepo.count();
    if (shiftCount === 0) {
      this.logger.log('Seeding shifts...');
      await this.shiftRepo.save([
        {
          name: 'Shift 1',
          defaultReportingTime: '07:30 AM',
          defaultEndTime: '01:30 PM',
        },
        {
          name: 'Shift 2',
          defaultReportingTime: '12:30 PM',
          defaultEndTime: '06:30 PM',
        },
      ]);
    }
  }

  private async seedEmployeeAndDuties() {
    let employee = await this.employeeRepo.findOne({
      where: { resourceId: '17655' },
    });

    if (!employee) {
      this.logger.log('Seeding temporary Admin user Sanjeev Kumar N (17655)...');
      employee = await this.employeeRepo.save({
        resourceId: '17655',
        name: 'Sanjeev Kumar N',
        mobile: '9876543210',
        email: 'sanjeev.kumar@examduty.gov.in',
        city: 'Mysuru',
        status: 'Active',
      });
    }

    // Sanjeev Kumar is strictly the temporary Admin account. Do NOT seed dummy duties for him.
    // Clean up any remaining legacy dummy duties for Sanjeev Kumar:
    const adminDuties = await this.dutyRepo.find({
      where: { employeeId: employee.id },
    });
    if (adminDuties.length > 0) {
      this.logger.log(`Cleaning up ${adminDuties.length} dummy duties for admin Sanjeev Kumar N...`);
      await this.dutyRepo.remove(adminDuties);
    }
  }
}
