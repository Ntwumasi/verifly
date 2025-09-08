import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/database';
import { config } from '../config';
import { User, ConsentRecord, AppError } from '../types';
import { AuditService } from './audit.service';

export class AuthService {
  private auditService = new AuditService();

  async createUser(
    email: string, 
    phone?: string, 
    password?: string, 
    role: User['role'] = 'applicant'
  ): Promise<User> {
    const existingUser = await this.getUserByEmail(email);
    if (existingUser) {
      throw new AppError('User already exists with this email', 409);
    }

    if (phone) {
      const existingPhoneUser = await this.getUserByPhone(phone);
      if (existingPhoneUser) {
        throw new AppError('User already exists with this phone number', 409);
      }
    }

    const userData: any = {
      email,
      role,
      email_verified: false,
      phone_verified: false,
      is_active: true,
      preferences: {},
    };

    if (phone) userData.phone = phone;
    if (password) userData.password_hash = await this.hashPassword(password);

    const [user] = await db('users').insert(userData).returning('*');
    
    await this.auditService.log({
      user_id: user.id,
      action: 'user_created',
      entity_type: 'user',
      entity_id: user.id,
      ip_address: 'system',
      result: 'success',
      details: { email, role },
    });

    return user;
  }

  async authenticateUser(email: string, password: string, ipAddress: string): Promise<string> {
    const user = await this.getUserByEmail(email);
    if (!user || !user.password_hash) {
      await this.auditService.log({
        action: 'login_attempt',
        entity_type: 'user',
        ip_address: ipAddress,
        result: 'failure',
        error_message: 'Invalid credentials',
        details: { email },
      });
      throw new AppError('Invalid credentials', 401);
    }

    if (!user.is_active) {
      await this.auditService.log({
        user_id: user.id,
        action: 'login_attempt',
        entity_type: 'user',
        entity_id: user.id,
        ip_address: ipAddress,
        result: 'failure',
        error_message: 'Account deactivated',
      });
      throw new AppError('Account is deactivated', 401);
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      await this.auditService.log({
        user_id: user.id,
        action: 'login_attempt',
        entity_type: 'user',
        entity_id: user.id,
        ip_address: ipAddress,
        result: 'failure',
        error_message: 'Invalid password',
      });
      throw new AppError('Invalid credentials', 401);
    }

    const token = this.generateToken(user);
    
    await this.auditService.log({
      user_id: user.id,
      action: 'login_success',
      entity_type: 'user',
      entity_id: user.id,
      ip_address: ipAddress,
      result: 'success',
    });

    return token;
  }

  async getUserById(id: string): Promise<User | null> {
    const user = await db('users').where({ id }).first();
    return user || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const user = await db('users').where({ email }).first();
    return user || null;
  }

  async getUserByPhone(phone: string): Promise<User | null> {
    const user = await db('users').where({ phone }).first();
    return user || null;
  }

  async verifyEmail(userId: string): Promise<void> {
    await db('users')
      .where({ id: userId })
      .update({
        email_verified: true,
        email_verified_at: new Date(),
        updated_at: new Date(),
      });

    await this.auditService.log({
      user_id: userId,
      action: 'email_verified',
      entity_type: 'user',
      entity_id: userId,
      ip_address: 'system',
      result: 'success',
    });
  }

  async verifyPhone(userId: string): Promise<void> {
    await db('users')
      .where({ id: userId })
      .update({
        phone_verified: true,
        phone_verified_at: new Date(),
        updated_at: new Date(),
      });

    await this.auditService.log({
      user_id: userId,
      action: 'phone_verified',
      entity_type: 'user',
      entity_id: userId,
      ip_address: 'system',
      result: 'success',
    });
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const hashedPassword = await this.hashPassword(newPassword);
    
    await db('users')
      .where({ id: userId })
      .update({
        password_hash: hashedPassword,
        updated_at: new Date(),
      });

    await this.auditService.log({
      user_id: userId,
      action: 'password_updated',
      entity_type: 'user',
      entity_id: userId,
      ip_address: 'system',
      result: 'success',
    });
  }

  async deactivateUser(userId: string, adminUserId?: string): Promise<void> {
    await db('users')
      .where({ id: userId })
      .update({
        is_active: false,
        updated_at: new Date(),
      });

    await this.auditService.log({
      user_id: adminUserId || userId,
      action: 'user_deactivated',
      entity_type: 'user',
      entity_id: userId,
      ip_address: 'system',
      result: 'success',
    });
  }

  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, config.bcrypt.rounds);
  }

  private generateToken(user: User): string {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });
  }

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      throw new AppError('Invalid or expired token', 401);
    }
  }
}