import { CACHE_MANAGER, Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, lastValueFrom } from 'rxjs';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BILLING_SERVICE } from './constants/services';
import { CreateOrderRequest } from './dto/create-order.request';
import { Order } from './schemas/order.schema';
import { Cache } from 'cache-manager';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @Inject(BILLING_SERVICE) private billingClient: ClientProxy,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async createOrder(request: CreateOrderRequest, authentication: string) {
    const session = await this.orderModel.startSession();
    session.startTransaction();

    try {
      // Create and save the order within the transaction
      const order = new this.orderModel(request);
      await order.save({ session });

      // Emit order created event to the billing service
      await lastValueFrom(
        this.billingClient.emit('ORDER_CREATED', {
          request,
          Authentication: authentication,
        }),
      );

      this.logger.log('Order created event');

      // Commit the transaction
      await session.commitTransaction();

      // Invalidate cache
      await this.cacheManager.del('/orders');

      return order;
    } catch (err) {
      // Abort the transaction in case of error
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  async getOrders() {
    return this.orderModel.find().exec();
  }

  async getOrderById(id: string) {
    return this.orderModel.findById(id).exec();
  }

  async updateOrder(id: string, updateData: Partial<CreateOrderRequest>) {
    const order = await this.orderModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (order) {
      // Invalidate cache
      const cacheKey = `order_${id}`;
      await this.cacheManager.del(cacheKey);
      await this.cacheManager.del('orders_all');
    }

    return order;
  }

  async deleteOrder(id: string) {
    const result = await this.orderModel.findByIdAndDelete(id).exec();

    if (result) {
      // Invalidate cache
      const cacheKey = `/orders/${id}`;
      await this.cacheManager.del(cacheKey);
      this.logger.log(cacheKey);
      await this.cacheManager.del('/orders');
    }

    return result;
  }
}
