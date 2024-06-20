import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseInterceptors,
  Req,
  UseGuards,
  CacheTTL,
} from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/common';
import { CreateOrderRequest } from './dto/create-order.request';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '@app/common';

@Controller('orders')
@UseInterceptors(CacheInterceptor)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createOrder(@Body() request: CreateOrderRequest, @Req() req: any) {
    return this.ordersService.createOrder(request, req.cookies?.Authentication);
  }

  @Get()
  @CacheTTL(3600)
  async getOrders() {
    return this.ordersService.getOrders();
  }

  @Get(':id')
  @CacheTTL(3600)
  async getOrderById(@Param('id') id: string) {
    return this.ordersService.getOrderById(id);
  }

  @Put(':id')
  async updateOrder(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateOrderRequest>,
  ) {
    return this.ordersService.updateOrder(id, updateData);
  }

  @Delete(':id')
  async deleteOrder(@Param('id') id: string) {
    return this.ordersService.deleteOrder(id);
  }
}
