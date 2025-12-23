// src/models/user.model.ts

import { Pool } from 'pg';
import db from '../utils/db';
import { User } from '../types';
import { DB_SCHEMA } from '../config/db.config';

export const findUserByLogin = async (login: string): Promise<User | null> => {
const query = `SELECT * FROM ${DB_SCHEMA}.users WHERE login = $1`;
  const res = await db.query(query, [login]);
  if (res.rows.length === 0) return null;
  return res.rows[0] as User;
};

export const updateUserPassword = async (
  userId: string,
  newPasswordHash: string,
  mustChangePassword: boolean = false
): Promise<void> => {
  const query = `
    UPDATE ${DB_SCHEMA}
    SET password_hash = $1, must_change_password = $2, updated_at = NOW()
    WHERE id = $3
  `;
  await db.query(query, [newPasswordHash, mustChangePassword, userId]);
};

export const findUserById = async (id: string): Promise<User | null> => {
  const query = `
    SELECT id, login, password_hash, role, must_change_password, created_at, updated_at
    FROM ${DB_SCHEMA}
    WHERE id = $1
  `;
  const res = await db.query(query, [id]);
  if (res.rows.length === 0) return null;
  return res.rows[0] as User;
};