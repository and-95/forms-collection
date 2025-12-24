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
    UPDATE ${DB_SCHEMA}.users
    SET password_hash = $1, must_change_password = $2, updated_at = NOW()
    WHERE id = $3
  `;
  await db.query(query, [newPasswordHash, mustChangePassword, userId]);
};

export const findUserById = async (id: string): Promise<User | null> => {
  const query = `
    SELECT id, login, password_hash, role, must_change_password, created_at, updated_at
    FROM ${DB_SCHEMA}.users
    WHERE id = $1
  `;
  const res = await db.query(query, [id]);
  if (res.rows.length === 0) return null;
  return res.rows[0] as User;
};

// Создание нового пользователя (для суперадмина)
export const createUser = async (
  login: string,
  passwordHash: string,
  role: 'admin' | 'superadmin'
): Promise<User> => {
  const query = `
    INSERT INTO ${DB_SCHEMA}.users (login, password_hash, role)
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  const result = await db.query(query, [login, passwordHash, role]);
  return result.rows[0] as User;
};

// Получение всех пользователей (доступно только суперадмину)
export const getAllUsers = async (): Promise<User[]> => {
  const query = `SELECT id, login, role, created_at, updated_at FROM ${DB_SCHEMA}.users ORDER BY created_at DESC`;
  const result = await db.query(query);
  return result.rows as User[];
};

// Получение пользователя по ID
export const getUserById = async (id: string): Promise<User | null> => {
  const query = `SELECT id, login, role, created_at, updated_at FROM ${DB_SCHEMA}.users WHERE id = $1`;
  const result = await db.query(query, [id]);
  if (result.rows.length === 0) return null;
  return result.rows[0] as User;
};

// Обновление пользователя
export const updateUser = async (
  id: string,
  updates: Partial<User>
): Promise<User | null> => {
  if (Object.keys(updates).length === 0) {
    const user = await getUserById(id);
    return user;
  }

  const setClause = Object.keys(updates)
    .map((key, index) => `"${key}" = $${index + 1}`)
    .join(', ');

  const values = Object.values(updates);
  values.push(id);

  const query = `
    UPDATE ${DB_SCHEMA}.users
    SET ${setClause}, updated_at = NOW()
    WHERE id = $${values.length}
    RETURNING id, login, role, created_at, updated_at
  `;

  const result = await db.query(query, values);
  return result.rows.length > 0 ? result.rows[0] as User : null;
};

// Удаление пользователя
export const deleteUser = async (id: string): Promise<boolean> => {
  const query = `DELETE FROM ${DB_SCHEMA}.users WHERE id = $1`;
  const result = await db.query(query, [id]);
  return result.rowCount !== null && result.rowCount > 0;
};