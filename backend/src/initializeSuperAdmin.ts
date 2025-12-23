// src/initializeSuperAdmin.ts
// Script to create initial superadmin user if not exists

import { findUserByLogin, createUser } from './models/user.model';
import { hashPassword } from './services/password.service';
import { logUserAction } from './utils/logger.utils';

export const initializeSuperAdmin = async () => {
  try {
    // Check if superadmin user already exists
    const existingSuperAdmin = await findUserByLogin('admin');
    
    if (existingSuperAdmin) {
      console.log('✅ Superadmin user already exists, skipping initialization');
      return;
    }
    
    // Create default superadmin user with secure password
    const defaultPassword = 'admin123!';
    const hashedPassword = await hashPassword(defaultPassword);
    
    const superAdmin = await createUser(
      'admin',
      hashedPassword,
      'superadmin'
    );
    
    console.log('✅ Superadmin user created successfully');
    console.log('👤 Login: admin');
    console.log('🔐 Password: admin123!');
    console.log('⚠️  IMPORTANT: Change this password after first login!');
    
    // Log the creation
    const mockReq = {
      ip: 'system',
      headers: { 'user-agent': 'system-initialization' }
    } as any;
    logUserAction('CREATE_USER', mockReq, { 
      userId: superAdmin.id, 
      login: superAdmin.login, 
      role: superAdmin.role,
      createdBy: 'system'
    }, superAdmin.id, 'user');
    
  } catch (error) {
    console.error('❌ Error initializing superadmin:', error);
    throw error;
  }
};