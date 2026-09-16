import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('shifts')
export class Shift {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 50 })
  name!: string; // 'Shift 1', 'Shift 2'

  @Column({ length: 20, default: '07:30 AM' })
  defaultReportingTime!: string;

  @Column({ length: 20, default: '01:30 PM' })
  defaultEndTime!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
