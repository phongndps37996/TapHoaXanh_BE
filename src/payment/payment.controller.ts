import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CreatePaymentDto } from './dto/payment.dto';
import { RetryPaymentDto } from './dto/retry-payment.dto';
import { PaymentService } from './payment.service';
import { ApiOperation } from '@nestjs/swagger';

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

  @ApiOperation({ summary: 'Retry payment cho order đã failed' })
  @Post('retry-payment')
  async retryPayment(@Body() retryPaymentDto: RetryPaymentDto) {
    return this.paymentService.retryPayment(retryPaymentDto);
  }
}
