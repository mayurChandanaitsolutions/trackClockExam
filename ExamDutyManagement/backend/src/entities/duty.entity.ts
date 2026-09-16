import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Relation,
} from 'typeorm';
import { Employee } from './employee.entity';
import { City } from './city.entity';
import { Center } from './center.entity';
import { Exam } from './exam.entity';
import { Role } from './role.entity';
import { Shift } from './shift.entity';
import { AttendanceFile } from './attendance-file.entity';

@Entity('duties')
export class Duty {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  employeeId!: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employeeId' })
  employee!: Relation<Employee>;

  @Column({ length: 30 })
  dutyDate!: string; // e.g. '30 Aug 2026' or '2026-08-30'

  @Column()
  cityId!: string;

  @ManyToOne(() => City)
  @JoinColumn({ name: 'cityId' })
  city!: Relation<City>;

  @Column()
  centerId!: string;

  @ManyToOne(() => Center)
  @JoinColumn({ name: 'centerId' })
  center!: Relation<Center>;

  @Column({ length: 20, default: 'Exam' })
  dutyType!: string; // 'Exam' | 'Mock'

  @Column()
  examId!: string;

  @ManyToOne(() => Exam)
  @JoinColumn({ name: 'examId' })
  exam!: Relation<Exam>;

  @Column()
  roleId!: string;

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'roleId' })
  role!: Relation<Role>;

  @Column()
  shiftId!: string;

  @ManyToOne(() => Shift)
  @JoinColumn({ name: 'shiftId' })
  shift!: Relation<Shift>;

  @Column({ length: 30, nullable: true })
  reportingTime?: string;

  @Column({ length: 30, nullable: true })
  shiftEndTime?: string;

  @Column({ length: 20, default: 'Pending' })
  status!: string; // 'Pending' | 'Approved' | 'Rejected'

  @Column({ nullable: true })
  attendanceFileId?: string;

  @ManyToOne(() => AttendanceFile, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'attendanceFileId' })
  attendanceFile?: Relation<AttendanceFile>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
