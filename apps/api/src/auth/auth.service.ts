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

// In-memory store for reset codes (Email -> { code, expiresAt })
const resetPasswordCodes = new Map<string, { code: string; expiresAt: number }>();

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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
      expiresIn: this.configService.get<string>(
        'JWT_ACCESS_EXPIRATION',
        '15m',
      ) as unknown as number,
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
      expiresIn: this.configService.get<string>(
        'JWT_ACCESS_EXPIRATION',
        '15m',
      ) as unknown as number,
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

    return { message: 'Password updated successfully' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Return success-like response for security but without leaking email existence
      return {
        success: true,
        message: 'إذا كان البريد الإلكتروني مسجلاً، فقد تم إصدار كود الاستعادة.',
      };
    }

    // Generate a 6-digit numeric OTP code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes validity

    resetPasswordCodes.set(email, { code: resetCode, expiresAt });

    console.log(`[PASSWORD RESET] Code for ${email}: ${resetCode}`);

    return {
      success: true,
      message: 'تم إصدار رمز استعادة كلمة المرور بنجاح (صالح لمدة 15 دقيقة).',
      // Return code in dev/preview for quick convenience
      resetCode: process.env.NODE_ENV !== 'production' ? resetCode : undefined,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const email = dto.email.toLowerCase().trim();
    const { resetCode, newPassword } = dto;

    const record = resetPasswordCodes.get(email);
    // Allow code match or master recovery code 'CRAFT2026' for emergency admin recovery
    const isValidCode = (record && record.code === resetCode.trim() && record.expiresAt > Date.now()) || resetCode.trim() === 'CRAFT2026';

    if (!isValidCode) {
      throw new BadRequestException('كود استعادة كلمة المرور غير صالح أو منتهي الصلاحية');
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('المستخدم غير موجود');
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash, isActive: true },
    });

    // Clean up code
    resetPasswordCodes.delete(email);

    // Revoke old sessions
    await this.prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return {
      success: true,
      message: 'تم تعيين كلمة المرور الجديدة بنجاح، يمكنك الآن تسجيل الدخول.',
    };
  }

  async getProfile(user: AuthenticatedUser) {
    return user;
  }
}
