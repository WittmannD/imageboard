import {
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export class PhotoEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  file!: string;

  @Column()
  mimetype!: string;

  @Column()
  width!: number;

  @Column()
  height!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
