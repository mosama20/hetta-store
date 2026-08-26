import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryUsersDto) {
    const { page = 1, limit = 20, search, role, isActive } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (isActive !== undefined) {
      where['isActive'] = isActive;
    }

    if (search) {
      where['OR'] = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where['userRoles'] = {
        some: {
          role: {
            name: role,
          },
        },
      };
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          userRoles: {
            select: {
              role: {
                select: {
                  id: true,
                  name: true,
                  displayNameAr: true,
                  displayNameEn: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items: users.map((u) => ({
        ...u,
        roles: u.userRoles.map((ur) => ur.role),
        userRoles: undefined,
      })),
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        userRoles: {
          select: {
            role: {
              select: {
                id: true,
                name: true,
                displayNameAr: true,
                displayNameEn: true,
                rolePermissions: {
                  select: {
                    permission: {
                      select: {
                        id: true,
                        name: true,
                        module: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const permissions = new Set<string>();
    const roles = user.userRoles.map((ur) => {
      ur.role.rolePermissions.forEach((rp) => permissions.add(rp.permission.name));
      return {
        id: ur.role.id,
        name: ur.role.name,
        displayNameAr: ur.role.displayNameAr,
        displayNameEn: ur.role.displayNameEn,
      };
    });

    return {
      ...user,
      roles,
      permissions: Array.from(permissions),
      userRoles: undefined,
    };
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new BadRequestException('A user with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email.toLowerCase().trim(),
          passwordHash: hashedPassword,
          fullName: dto.fullName,
          phone: dto.phone,
          isActive: true,
        },
      });

      if (dto.roleIds && dto.roleIds.length > 0) {
        await tx.userRole.createMany({
          data: dto.roleIds.map((roleId) => ({
            userId: user.id,
            roleId,
          })),
        });
      }

      return this.findOne(user.id);
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { userRoles: { include: { role: true } } },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Safety rule: Prevent deactivating the last active SUPER_ADMIN
    const isSuperAdmin = user.userRoles.some((ur) => ur.role.name === 'SUPER_ADMIN');
    if (isSuperAdmin && dto.isActive === false) {
      const superAdminCount = await this.prisma.userRole.count({
        where: {
          role: { name: 'SUPER_ADMIN' },
          user: { isActive: true },
        },
      });
      if (superAdminCount <= 1) {
        throw new ForbiddenException('Cannot deactivate the last active Super Administrator');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          fullName: dto.fullName,
          phone: dto.phone,
          isActive: dto.isActive,
        },
      });

      if (dto.roleIds !== undefined) {
        await tx.userRole.deleteMany({ where: { userId: id } });
        if (dto.roleIds.length > 0) {
          await tx.userRole.createMany({
            data: dto.roleIds.map((roleId) => ({
              userId: id,
              roleId,
            })),
          });
        }
      }

      return this.findOne(id);
    });
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { userRoles: { include: { role: true } } },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const isSuperAdmin = user.userRoles.some((ur) => ur.role.name === 'SUPER_ADMIN');
    if (isSuperAdmin) {
      const superAdminCount = await this.prisma.userRole.count({
        where: {
          role: { name: 'SUPER_ADMIN' },
          user: { isActive: true },
        },
      });
      if (superAdminCount <= 1) {
        throw new ForbiddenException('Cannot delete the last remaining Super Administrator');
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({ where: { userId: id } });
      await tx.user.delete({ where: { id } });
    });

    return { message: 'User deleted successfully' };
  }

  async listRoles() {
    return this.prisma.role.findMany({
      select: {
        id: true,
        name: true,
        displayNameAr: true,
        displayNameEn: true,
        description: true,
        isSystem: true,
      },
    });
  }
}
