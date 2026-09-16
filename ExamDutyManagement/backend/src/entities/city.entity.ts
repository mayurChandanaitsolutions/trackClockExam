import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('cities')
export class City {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 100 })
  name!: string;

  @Column({ length: 100, default: 'Karnataka' })
  state!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
