import {
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import type { Sortable } from '../types/brands.js';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @CreateDateColumn()
  createdAt!: Sortable<Date>;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
