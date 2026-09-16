import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { City } from './city.entity';

@Entity('centers')
export class Center {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 50 })
  centerCode!: string;

  @Column({ length: 200 })
  centerName!: string;

  @Column()
  cityId!: string;

  @ManyToOne(() => City, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cityId' })
  city!: City;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  address?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
