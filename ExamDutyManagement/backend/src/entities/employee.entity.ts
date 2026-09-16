import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 50 })
  resourceId!: string;

  @Column({ length: 150 })
  name!: string;

  @Column({ unique: true, length: 20 })
  mobile!: string;

  @Column({ type: 'nvarchar', length: 150, nullable: true })
  email?: string;

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  city?: string;

  @Column({ default: 'Active', length: 20 })
  status!: string;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  passwordHash?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
