import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('exams')
export class Exam {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 100 })
  name!: string;

  @Column({ length: 50, nullable: true })
  code?: string;

  @Column({ default: 'Exam', length: 20 })
  type!: string; // 'Exam' | 'Mock'

  @CreateDateColumn()
  createdAt!: Date;
}
