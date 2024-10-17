import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { getEnvVar } from '@/utils/environment';

const user = getEnvVar('PG_USER');
const password = getEnvVar('PG_PASSWORD');
const host = getEnvVar('PG_HOST');
const port = Number(getEnvVar('PG_PORT'));
const database = getEnvVar('PG_DB');

const connectionString = `postgres://${user}:${password}@${host}:${port}/${database}`;

// Create a postgres client
const sql = postgres(connectionString, { max: 10 });

// Create a drizzle database instance
export const db = drizzle(sql);