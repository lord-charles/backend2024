import {
  Injectable,
  NotFoundException,
  Inject,
  CACHE_MANAGER,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cache } from 'cache-manager';
import { Product } from './schemas/product.schema';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { CreateReviewDto, UpdateReviewDto } from './dto/review.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  // Method to get all products
  async getAllProducts(
    page: number,
    limit: number,
    sort: string,
    order: string,
    filters: any,
  ): Promise<{ data: Product[]; total: number; page: number; limit: number }> {
    const sortOrder = order === 'desc' ? -1 : 1;
    const query = this.productModel.find();

    if (filters.category) {
      query.where('categories').in([filters.category]);
    }
    if (filters.brand) {
      query.where('brand').equals(filters.brand);
    }
    if (filters.minPrice !== undefined) {
      query.where('price').gte(filters.minPrice);
    }
    if (filters.maxPrice !== undefined) {
      query.where('price').lte(filters.maxPrice);
    }
    if (filters.attributes) {
      const attributes = filters.attributes.split(',').map((attr) => {
        const [key, value] = attr.split(':');
        return { 'attributes.key': key, 'attributes.value': value };
      });
      attributes.forEach((attr) => query.where(attr));
    }

    const total = await query.clone().countDocuments().exec();
    const data = await query
      .sort({ [sort]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      // .populate('categories')
      .exec();

    return { data, total, page, limit };
  }

  // Method to get a product by ID
  async getProductById(id: string): Promise<Product> {
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  // Method to create a new product
  async createProduct(createProductDto: CreateProductDto): Promise<Product> {
    const newProduct = new this.productModel(createProductDto);
    const product = await newProduct.save();

    // Invalidate relevant caches
    await this.cacheManager.del('/products');

    return product;
  }

  // Method to update an existing product
  async updateProduct(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const updatedProduct = await this.productModel
      .findByIdAndUpdate(id, updateProductDto, { new: true })
      .exec();
    if (!updatedProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    // Invalidate relevant caches
    await this.cacheManager.del('/products');
    await this.cacheManager.del(`products${id}`);
    return updatedProduct;
  }

  // Method to delete a product
  async deleteProduct(id: string): Promise<void> {
    const result = await this.productModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    // Invalidate relevant caches
    await this.cacheManager.del('/products');
    await this.cacheManager.del(`/products${id}`);
  }

  // Method to add a review to a product
  async addReview(
    productId: string,
    createReviewDto: CreateReviewDto,
  ): Promise<Product> {
    const product = await this.productModel.findById(productId).exec();
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }
    product.reviews.push(createReviewDto);
    const updatedProduct = await product.save();
    // Invalidate relevant caches
    await this.cacheManager.del('/products');
    await this.cacheManager.del(`/products${productId}`);
    return updatedProduct;
  }

  // Method to update an existing review
  async updateReview(
    productId: string,
    reviewId: string,
    updateReviewDto: UpdateReviewDto,
  ): Promise<Product> {
    const product = await this.productModel.findById(productId).exec();
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }
    const review = product.reviews.find(
      (review) => review._id.toString() === reviewId,
    );
    if (!review) {
      throw new NotFoundException(`Review with ID ${reviewId} not found`);
    }
    Object.assign(review, updateReviewDto);
    const updatedProduct = await product.save();
    await this.cacheManager.del('all_products');
    await this.cacheManager.del(`product_${productId}`);
    return updatedProduct;
  }

  // Method to delete a review
  async deleteReview(productId: string, reviewId: string): Promise<Product> {
    const product = await this.productModel.findById(productId).exec();
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }
    const reviewIndex = product.reviews.findIndex(
      (review) => review._id.toString() === reviewId,
    );
    if (reviewIndex === -1) {
      throw new NotFoundException(`Review with ID ${reviewId} not found`);
    }
    product.reviews.splice(reviewIndex, 1);
    const updatedProduct = await product.save();
    await this.cacheManager.del('all_products');
    await this.cacheManager.del(`product_${productId}`);
    return updatedProduct;
  }

  // Method to get all reviews for a specific product
  async getProductReviews(productId: string): Promise<CreateReviewDto[]> {
    const product = await this.productModel.findById(productId).exec();
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }
    return product.reviews;
  }

  // Method to search products based on a query
  async searchProducts(query: string): Promise<Product[]> {
    const products = await this.productModel
      .find({ $text: { $search: query } })
      .exec();
    return products;
  }

  // Method to filter products based on given criteria
  async filterProducts(filterCriteria: any): Promise<Product[]> {
    const products = await this.productModel.find(filterCriteria).exec();
    return products;
  }
}
