import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseInterceptors,
  CacheInterceptor,
  CacheTTL,
  Patch,
  Query,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { CreateReviewDto, UpdateReviewDto } from './dto/review.dto';

@Controller('products')
@UseInterceptors(CacheInterceptor)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @CacheTTL(0)
  async getAllProducts(
    @Query('page') page: 1,
    @Query('limit') limit: 10,
    @Query('sort') sort: 'name',
    @Query('order') order: 'asc',
    @Query('category') category?: string,
    @Query('brand') brand?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('attributes') attributes?: string,
  ) {
    const filters = { category, brand, minPrice, maxPrice, attributes };
    return this.productsService.getAllProducts(
      page,
      limit,
      sort,
      order,
      filters,
    );
  }

  @Get(':id')
  @CacheTTL(0)
  async getProductById(@Param('id') id: string) {
    return this.productsService.getProductById(id);
  }

  @Post()
  async createProduct(@Body() createProductDto: CreateProductDto) {
    return this.productsService.createProduct(createProductDto);
  }

  @Patch(':id')
  async updateProduct(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.updateProduct(id, updateProductDto);
  }

  @Delete(':id')
  async deleteProduct(@Param('id') id: string) {
    return this.productsService.deleteProduct(id);
  }

  @Post(':id/reviews')
  async addReview(
    @Param('id') id: string,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    return this.productsService.addReview(id, createReviewDto);
  }

  @Put(':id/reviews/:reviewId')
  async updateReview(
    @Param('id') id: string,
    @Param('reviewId') reviewId: string,
    @Body() updateReviewDto: UpdateReviewDto,
  ) {
    return this.productsService.updateReview(id, reviewId, updateReviewDto);
  }

  @Delete(':id/reviews/:reviewId')
  async deleteReview(
    @Param('id') id: string,
    @Param('reviewId') reviewId: string,
  ) {
    return this.productsService.deleteReview(id, reviewId);
  }

  @Get(':id/reviews')
  @CacheTTL(3600)
  async getProductReviews(@Param('id') id: string) {
    return this.productsService.getProductReviews(id);
  }

  // Additional routes for advanced features such as search and filtering
  @Get('/search/:query')
  @CacheTTL(3600)
  async searchProducts(@Param('query') query: string) {
    return this.productsService.searchProducts(query);
  }

  @Post('/filter')
  async filterProducts(@Body() filterCriteria: any) {
    return this.productsService.filterProducts(filterCriteria);
  }
}
