#!/usr/bin/env ts-node
import { db } from './server/utils/db'
import { sql } from 'drizzle-orm'

async function reset() {
  console.log('Dropping drizzle_migrations table…')
  await db.execute(sql`DROP TABLE IF EXISTS drizzle_migrations;`)
  console.log('Done.')
  process.exit(0)
}

reset().catch(err => {
  console.error(err)
  process.exit(1)
})
