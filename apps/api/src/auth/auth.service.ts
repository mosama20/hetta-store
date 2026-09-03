import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { MailService } from './mail.service';

// Removed in-memory Map in favor of database persistent PasswordResetToken model

import { CacheService } from '../common/cache/cache.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly cache: CacheService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account has been deactivated');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Update lastLoginAt
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const roles: string[] = [];
    const permissionSet = new Set<string>();

    for (const ur of user.userRoles) {
      roles.push(ur.role.name);
      for (const rp of ur.role.rolePermissions) {
        permissionSet.add(rp.permission.name);
      }
    }

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>(
        'JWT_ACCESS_SECRET',
        'fashion_store_super_secret_jwt_access_key_2026',
      ),
      expiresIn: (this.configService.get<string>(
        'JWT_ACCESS_EXPIRATION',
        '15m',
      ) || '15m') as any,
    });

    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);
    const refreshExpiresInDays = 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshExpiresInDays);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        ipAddress,
        userAgent,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        roles,
        permissions: Array.from(permissionSet),
      },
    };
  }

  async refreshToken(dto: RefreshTokenDto, ipAddress?: string, userAgent?: string) {
    const tokenHash = this.hashToken(dto.refreshToken);

    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.revokedAt !== null || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (!tokenRecord.user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    // Token rotation: Revoke current refresh token
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revokedAt: new Date() },
    });

    // Create new token pair
    const payload = { sub: tokenRecord.user.id, email: tokenRecord.user.email };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>(
        'JWT_ACCESS_SECRET',
        'fashion_store_super_secret_jwt_access_key_2026',
      ),
      expiresIn: (this.configService.get<string>(
        'JWT_ACCESS_EXPIRATION',
        '15m',
      ) || '15m') as any,
    });

    const newRawRefreshToken = crypto.randomBytes(40).toString('hex');
    const newTokenHash = this.hashToken(newRawRefreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        userId: tokenRecord.user.id,
        tokenHash: newTokenHash,
        ipAddress,
        userAgent,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: newRawRefreshToken,
    };
  }

  async logout(dto: RefreshTokenDto) {
    const tokenHash = this.hashToken(dto.refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { message: 'Logged out successfully' };
  }

  async changePassword(user: AuthenticatedUser, dto: ChangePasswordDto) {
    const existing = await this.prisma.user.findUnique({ where: { id: user.id } });
    if (!existing) {
      throw new UnauthorizedException('User not found');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, existing.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Incorrect current password');
    }

    const newHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    // Revoke all active sessions for security on password change
    await this.prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    // Invalidate cached auth user permissions immediately
    this.cache.delete(`auth:user:${user.id}`);

    return { message: 'Password updated successfully' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Consistent security message to prevent email enumeration
    const genericResponse = {
      success: true,
      message: 'إذا كان البريد الإلكتروني مسجلاً، فقد تم إرسال كود الاستعادة إلى بريدك.',
    };

    if (!user || !user.isActive) {
      return genericResponse;
    }

    // Invalidate any previous unconsumed reset tokens for this user
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    // Generate secure 6-digit numeric OTP
    const resetCode = crypto.randomInt(100000, 999999).toString();
    const codeHash = this.hashToken(resetCode);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        codeHash,
        expiresAt,
      },
    });

    // Send real email via configured SMTP
    await this.mailService.sendPasswordResetEmail(email, resetCode, user.fullName || 'المدير');

    return genericResponse;
  }

  async resetPassword(dto: ResetPasswordDto) {
    const email = dto.email.toLowerCase().trim();
    const { resetCode, newPassword } = dto;

    if (!resetCode || resetCode.trim().length === 0) {
      throw new BadRequestException('يرجى إدخال كود استعادة كلمة المرور');
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      throw new BadRequestException('كود استعادة كلمة المرور غير صالح أو منتهي الصلاحية');
    }

    const codeHash = this.hashToken(resetCode.trim());

    const tokenRecord = await this.prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
        codeHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!tokenRecord) {
      throw new BadRequestException('كود استعادة كلمة المرور غير صالح أو منتهي الصلاحية');
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    // Mark token as used
    await this.prisma.passwordResetToken.update({
      where: { id: tokenRecord.id },
      data: { usedAt: new Date() },
    });

    // Revoke all active refresh sessions for security
    await this.prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    // Invalidate cached auth user permissions immediately
    this.cache.delete(`auth:user:${user.id}`);

    return {
      success: true,
      message: 'تم تعيين كلمة المرور الجديدة بنجاح، يمكنك الآن تسجيل الدخول.',
    };
  }

  async getProfile(user: AuthenticatedUser) {
    return user;
  }
}
