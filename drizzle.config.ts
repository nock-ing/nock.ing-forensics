import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import {getEnvVar} from "@/utils/environment";

const user = getEnvVar("PG_USER");
const password = getEnvVar("PG_PASSWORD");
const host = getEnvVar("PG_HOST");
const port:number = Number(getEnvVar("PG_PORT"));
const database = getEnvVar("PG_DB");

export default defineConfig({
    out: './drizzle',
    schema: './src/db/schema.ts',
    dialect: 'postgresql',
    dbCredentials: {
        host: host,
        port: Number(port),
        user: user,
        password: password,
        database: database,
        ssl: false,
    },
    schemaFilter: ['car_entries'],
});