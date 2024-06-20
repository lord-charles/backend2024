import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { CacheModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import * as Joi from 'joi';
import { DatabaseModule } from '@app/common';
import { Product, ProductSchema } from './schemas/product.schema';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    // Load and validate environment variables globally
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        MONGODB_URI: Joi.string().required(),
        PORT: Joi.number().required(),
      }),
      envFilePath: './apps/products/.env',
    }),
    //establish database connection
    DatabaseModule,
    // Register the Order schema with Mongoose
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),

    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const environment = configService.get<string>('ENVIRONMENT');
        const redisConfig =
          environment === 'production'
            ? {
                store: redisStore,
                host: 'redis',
                port: 6379,
              }
            : {
                store: redisStore,
                socket: { host: 'redis', port: 6379 },
              };
        return {
          ...redisConfig,
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
