// src/utils/db.ts

import { Pool, PoolConfig } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const config: PoolConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // max: 20, // можно добавить позже
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

const pool = new Pool(config);

pool.on('error', (err) => {
  console.error('❌ Неожиданная ошибка пула подключений:', err);
  process.exit(-1);
});

export default pool;