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
      await this.ensureTargetCities();
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
        { name: 'HOT(IT Manager)', code: 'HOT' },
        { name: 'CCTV', code: 'CCTV' },
        { name: 'Equity Lab Supervisior_ ssc', code: 'ELS_SSC' },
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

  private async ensureTargetCities() {
    try {
      this.logger.log('Aligning cities with requested list: Mysore, Bengaluru, Mangalore, Shivmogga, Mandya, Davanagere, Dharwad');

      // 1. Rename Mysuru -> Mysore, Mangaluru -> Mangalore if present
      const mysuru = await this.cityRepo.findOne({ where: { name: 'Mysuru' } });
      if (mysuru) {
        mysuru.name = 'Mysore';
        await this.cityRepo.save(mysuru);
      }

      const mangaluru = await this.cityRepo.findOne({ where: { name: 'Mangaluru' } });
      if (mangaluru) {
        mangaluru.name = 'Mangalore';
        await this.cityRepo.save(mangaluru);
      }

      // 2. Point any centers attached to legacy "Bangalore" to "Bengaluru"
      const bengaluru = await this.cityRepo.findOne({ where: { name: 'Bengaluru' } });
      const bangalore = await this.cityRepo.findOne({ where: { name: 'Bangalore' } });
      if (bengaluru && bangalore) {
        const centersInBangalore = await this.centerRepo.find({ where: { cityId: bangalore.id } });
        for (const c of centersInBangalore) {
          c.cityId = bengaluru.id;
          await this.centerRepo.save(c);
        }
        await this.cityRepo.remove(bangalore);
      }

      // 3. Remove unneeded cities with 0 duties and 0 centers
      const unusedNames = ['Belagavi', 'Hassan', 'Hubballi', 'Hyderabad', 'Mumbai', 'Tumkur'];
      for (const name of unusedNames) {
        const found = await this.cityRepo.findOne({ where: { name } });
        if (found) {
          const dutyCount = await this.dutyRepo.count({ where: { cityId: found.id } });
          const centerCount = await this.centerRepo.count({ where: { cityId: found.id } });
          if (dutyCount === 0 && centerCount === 0) {
            await this.cityRepo.remove(found);
          }
        }
      }

      // 4. Ensure target cities exist: Mysore, Bengaluru, Mangalore, Shivmogga, Mandya, Davanagere, Dharwad
      const targetCities = [
        'Mysore',
        'Bengaluru',
        'Mangalore',
        'Shivmogga',
        'Mandya',
        'Davanagere',
        'Dharwad',
      ];

      for (const cityName of targetCities) {
        const exists = await this.cityRepo.findOne({ where: { name: cityName } });
        if (!exists) {
          await this.cityRepo.save({ name: cityName, state: 'Karnataka' });
        }
      }

      // 5. Ensure centers exist for Mangalore, Shivmogga, Davanagere, Dharwad
      const cityMangalore = await this.cityRepo.findOne({ where: { name: 'Mangalore' } });
      if (cityMangalore) {
        const centerExists = await this.centerRepo.findOne({ where: { centerCode: '8413' } });
        if (!centerExists) {
          await this.centerRepo.save({
            centerCode: '8413',
            centerName: 'iDZ Mangalore Center',
            cityId: cityMangalore.id,
            address: 'Kottara Chowki, Mangalore',
          });
        }
      }

      const cityShivmogga = await this.cityRepo.findOne({ where: { name: 'Shivmogga' } });
      if (cityShivmogga) {
        const centerExists = await this.centerRepo.findOne({ where: { centerCode: '8414' } });
        if (!centerExists) {
          await this.centerRepo.save({
            centerCode: '8414',
            centerName: 'iDZ Shivamogga Center',
            cityId: cityShivmogga.id,
            address: 'Savalanga Road, Shivamogga',
          });
        }
      }

      const cityDavanagere = await this.cityRepo.findOne({ where: { name: 'Davanagere' } });
      if (cityDavanagere) {
        const centerExists = await this.centerRepo.findOne({ where: { centerCode: '8415' } });
        if (!centerExists) {
          await this.centerRepo.save({
            centerCode: '8415',
            centerName: 'iDZ Davanagere Center',
            cityId: cityDavanagere.id,
            address: 'Hadadi Road, Davanagere',
          });
        }
      }

      const cityDharwad = await this.cityRepo.findOne({ where: { name: 'Dharwad' } });
      if (cityDharwad) {
        const centerExists = await this.centerRepo.findOne({ where: { centerCode: '8416' } });
        if (!centerExists) {
          await this.centerRepo.save({
            centerCode: '8416',
            centerName: 'iDZ Dharwad Center',
            cityId: cityDharwad.id,
            address: 'PB Road, Dharwad',
          });
        }
      }
    } catch (err) {
      this.logger.error('Error during ensureTargetCities:', err);
    }
  }
}
