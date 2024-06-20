import { Controller, UseGuards, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { RmqService, JwtAuthGuard } from '@app/common';
import { BillingService } from './billing.service';

@Controller()
export class BillingController {
  private readonly logger = new Logger(BillingController.name);

  constructor(
    private readonly billingService: BillingService,
    private readonly rmqService: RmqService,
  ) {}

  @EventPattern('ORDER_CREATED')
  @UseGuards(JwtAuthGuard)
  async handleOrderCreated(@Payload() data: any, @Ctx() context: RmqContext) {
    try {
      this.logger.log(
        `Received ORDER_CREATED event with data: ${JSON.stringify(data)}`,
      );

      this.billingService.bill(data);

      // Acknowledge the message after successful processing
      this.rmqService.ack(context);
      this.logger.log('ORDER_CREATED event processed successfully');
    } catch (error) {
      this.logger.error('Error processing ORDER_CREATED event', error.stack);

      // Handle failure and decide on requeue based on error type or other logic
      this.rmqService.nack(context, true); // Requeue the message by default
    }
  }
}
