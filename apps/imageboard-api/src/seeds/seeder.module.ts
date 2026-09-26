import { Logger, Module, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, TypeOrmModule } from '@nestjs/typeorm';
import path from 'path';
import type { DataSource } from 'typeorm';
import { runSeeders, type SeederOptions } from 'typeorm-extension';

const __dirname = import.meta.dirname;
const seederOptions = {
  seeds: [path.resolve(__dirname, './seeders/*{.ts,.js}')],
  factories: [path.resolve(__dirname, './factories/*{.ts,.js}')],
  // Records executed seeders, so a persistent database (staging) is seeded once.
  seedTracking: true,
} satisfies SeederOptions;

@Module({
  imports: [TypeOrmModule],
})
export class SeederModule implements OnModuleInit {
  private readonly logger = new Logger(SeederModule.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    if (this.dataSource.isInitialized && this.configService.getOrThrow<boolean>('database.seed')) {
      runSeeders(this.dataSource, { ...seederOptions }).catch((error: unknown) => {
        this.logger.error(
          'Database seeding failed',
          error instanceof Error ? error.stack : String(error),
        );
      });
    }
  }
}