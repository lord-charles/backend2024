import { CacheModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import * as Joi from 'joi';
import { DatabaseModule, RmqModule, AuthModule } from '@app/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order, OrderSchema } from './schemas/order.schema';
import { BILLING_SERVICE } from './constants/services';
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
      envFilePath: './apps/orders/.env',
    }),
    //establish database connection
    DatabaseModule,
    // Register the Order schema with Mongoose
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),

    // Register the billing service for RabbitMQ messaging
    RmqModule.register({
      name: BILLING_SERVICE,
    }),

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
    AuthModule,
  ],
  // Declare the OrdersController to handle incoming requests
  controllers: [OrdersController],
  // Provide the OrdersService to handle business logic
  providers: [OrdersService],
})
export class OrdersModule {}
