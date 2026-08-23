import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List public active categories' })
  async findAll(@Query('all') all?: string) {
    return this.categoriesService.findAll(all === 'true');
  }

  @Public()
  @Get('tree')
  @ApiOperation({ summary: 'Get nested hierarchical category tree' })
  async findTree() {
    return this.categoriesService.findTree();
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get category details by URL slug' })
  async findBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('categories.create')
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Create a new category (Admin)' })
  async create(@Body() dto: CreateCategoryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.categoriesService.create(dto, user.id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('categories.update')
  @ApiBearerAuth()
  @Put(':id')
  @ApiOperation({ summary: 'Update an existing category (Admin)' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.categoriesService.update(id, dto, user.id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('categories.delete')
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a category (Admin)' })
  async delete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.categoriesService.delete(id, user.id);
  }
}
