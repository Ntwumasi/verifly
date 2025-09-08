import knex from 'knex';
import { DatabaseConfig } from '../types';

const knexConfig = require('../../knexfile');

const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];

export const db = knex(config);

export const testConnection = async (): Promise<void> => {
  try {
    await db.raw('SELECT 1+1 as result');
    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

export const closeConnection = async (): Promise<void> => {
  await db.destroy();
};