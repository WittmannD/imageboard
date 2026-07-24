import { Injectable } from '@nestjs/common';
import type { DataSource, EntityManager } from 'typeorm';

@Injectable()
export class TransactionService {
  constructor(private readonly dataSource: DataSource) {}

  async withManager<T>(
    manager: EntityManager | undefined,
    callback: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    if (manager) {
      return callback(manager);
    }

    return this.dataSource.transaction(callback);
  }
}
