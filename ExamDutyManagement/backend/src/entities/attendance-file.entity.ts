import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('attendance_files')
export class AttendanceFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  originalName: string;

  @Column({ length: 255 })
  fileName: string;

  @Column({ length: 100 })
  mimeType: string;

  @Column('bigint')
  size: number;

  @Column({ length: 500 })
  filePath: string;

  @CreateDateColumn()
  uploadedAt: Date;
}
