import {
  Controller,
  BadRequestException,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Public } from '../common/decorators/public.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';

@ApiTags('Products')
@Controller('products')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all active products with pagination and filters' })
  async findAll(@Query() query: QueryProductsDto) {
    return this.productsService.findAll(query);
  }

  @Post('bulk-import')
  @RequirePermissions('products.create')
  @ApiOperation({ summary: 'Bulk import products from Excel or JSON' })
  async bulkImport(@Body('items') items: any[]) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestException('Items array is required');
    }
    return this.productsService.bulkImport(items);
  }

  @Post()
  @RequirePermissions('products.create')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Create a new product with variants and images' })
  async create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get a product by slug with full details' })
  async findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Put(':id')
  @RequirePermissions('products.update')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update a product master record' })
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('products.delete')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Soft delete / archive a product' })
  async remove(@Param('id') id: string) {
    return this.productsService.delete(id);
  }

  @Patch('variants/:variantId/stock')
  @RequirePermissions('products.update')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Adjust stock quantity for a variant' })
  async adjustStock(
    @Param('variantId') variantId: string,
    @Body('quantityChange') quantityChange: number,
  ) {
    return this.productsService.adjustStock(variantId, Number(quantityChange));
  }
}
