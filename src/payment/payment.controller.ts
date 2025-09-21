import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CreatePaymentDto } from './dto/payment.dto';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create-payment')
  async createPayment(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentService.createPayment(createPaymentDto);
  }

  @Post('create-payment-cash')
  async createPaymentWithCash(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentService.createPaymentWithCash(createPaymentDto);
  }

  @Get('vnpay-callback')
  async handleCallback(@Query() query: any) {
    return this.paymentService.handleVNPayCallback(query);
  }
}
