import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 100 })
  name!: string;

  @Column({ length: 50 })
  code!: string; // 'SO', 'Invigilator', 'Center Observer', 'MOT', 'LOT'

  @CreateDateColumn()
  createdAt!: Date;
}
