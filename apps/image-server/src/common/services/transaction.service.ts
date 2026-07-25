import { Injectable } from '@nestjs/common';
import { from, lastValueFrom, Observable } from 'rxjs';
import { DataSource, type EntityManager } from 'typeorm';

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

  withManager$<T>(
    manager: EntityManager | undefined,
    callback: (manager: EntityManager) => Observable<T>,
  ): Observable<T> {
    if (manager) {
      return callback(manager);
    }

    return from(
      this.dataSource.transaction(async (manager) => {
        return lastValueFrom(callback(manager));
      }),
    );
  }
}
