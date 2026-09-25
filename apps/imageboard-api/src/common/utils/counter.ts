import type { EntityManager, EntityTarget, ObjectLiteral } from 'typeorm';

/**
 * Atomically adds `delta` to a counter column of the row with the given id.
 *
 * Counter columns are declared with `update: false` so that saving a stale
 * entity can't overwrite them, and TypeORM's query builders (including
 * `increment`) skip such columns too, hence the raw query.
 */
export async function adjustCounter<Entity extends ObjectLiteral>(
  manager: EntityManager,
  target: EntityTarget<Entity>,
  id: number,
  property: keyof Entity & string,
  delta: number,
) {
  const metadata = manager.dataSource.getMetadata(target);
  const column = metadata.findColumnWithPropertyName(property);

  if (!column) {
    throw new Error(`${metadata.name} has no column "${property}"`);
  }

  const { driver } = manager.dataSource;
  const escape = (name: string) => driver.escape(name);
  const table = metadata.schema
    ? `${escape(metadata.schema)}.${escape(metadata.tableName)}`
    : escape(metadata.tableName);
  const name = escape(column.databaseName);

  await manager.query(
    `UPDATE ${table} SET ${name} = ${name} + $1 WHERE ${escape('id')} = $2`,
    [delta, id],
  );
}
