import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CreateOrderFromCartDto } from './dto/create-order-from-cart.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { FilterOrderDto } from './dto/filter-order.dto';
import { PaginatedOrdersDto } from './dto/paginated-orders.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { ReorderDto } from './dto/reorder.dto';
import { OrderService } from './order.service';
import { IsAdminGuard } from '../auth/guards/IsAdmin.guard';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Post()
  create(@Body() createOrderDto: CreateOrderDto, @Req() req: any) {
    const userId = req.user.sub;
    return this.orderService.create(createOrderDto, userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Post('from-cart')
  createFromCart(@Body() createOrderDto: CreateOrderFromCartDto, @Req() req: any) {
    const userId = req.user.sub;
    return this.orderService.createOrderFromCart(createOrderDto, userId);
  }
  @Get()
  findAll() {
    return this.orderService.findAll();
  }
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Get('owned')
  findAllOwned(@Req() req: any) {
    const userId = req.user.sub;
    return this.orderService.findAllOwned(userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Get('owned-paginated')
  findOwnedOrdersPaginated(@Req() req: any, @Query() query: PaginatedOrdersDto) {
    const userId = req.user.sub;
    return this.orderService.findOwnedOrdersPaginated(userId, query);
  }

  @UseGuards(JwtGuard, IsAdminGuard)
  @Get('/revenue')
  getTotalRevenueSuccess(@Query('year') year?: string, @Query('month') month?: string) {
    const y = Number(year) || new Date().getFullYear();
    const m = month ? parseInt(month, 10) : undefined;
    return this.orderService.getTotalRevenueSuccess(y, m);
  }

  @UseGuards(JwtGuard, IsAdminGuard)
  @Get('/view-detail/:orderCode')
  getOrderDetailByCode(@Param('orderCode') orderCode: string) {
    return this.orderService.getOrderDetailByCode(orderCode);
  }

  @UseGuards(JwtGuard, IsAdminGuard)
  @Get('/revenue-month')
  getMonthlyRevenueSuccess(@Query('year') year?: string) {
    const y = Number(year) || new Date().getFullYear();
    return this.orderService.getMonthlyRevenueSuccess(y);
  }

  @ApiBearerAuth()
  @UseGuards(JwtGuard, IsAdminGuard)
  @Get('/search')
  filterAllOrder(@Query() filter: FilterOrderDto) {
    return this.orderService.filterAllOrder(filter);
  }

  @UseGuards(JwtGuard, IsAdminGuard)
  @Get('/count')
  countNumberOfOrder(@Query('year') year?: string, @Query('month') month?: string) {
    const y = Number(year) || new Date().getFullYear();
    const m = month ? parseInt(month, 10) : undefined;
    return this.orderService.countNumberOfOrder(y, m);
  }

  @ApiOperation({ summary: 'Xem doanh thu theo ngày' })
  @UseGuards(JwtGuard, IsAdminGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'start_date', required: false, description: 'Ngày bắt đầu (YYYY-MM-DD)' })
  @ApiQuery({ name: 'end_date', required: false, description: 'Ngày kết thúc (YYYY-MM-DD)' })
  @Get('daily-revenue')
  async getDailyRevenue(@Query('start_date') start_date?: string, @Query('end_date') end_date?: string) {
    return this.orderService.getDailyRevenue(start_date, end_date);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orderService.findOne(+id);
  }

  @Get(':id/address')
  getOrderAddress(@Param('id') id: string) {
    return this.orderService.getOrderAddress(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.orderService.update(+id, updateOrderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.orderService.remove(+id);
  }

  // Admin endpoints
  @ApiBearerAuth()
  @UseGuards(JwtGuard, IsAdminGuard)
  @Patch(':id/status')
  updateOrderStatus(@Param('id') id: string, @Body() updateStatusDto: UpdateOrderStatusDto) {
    return this.orderService.updateOrderStatus(+id, updateStatusDto);
  }

  // User endpoints
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Patch(':id/cancel')
  cancelOrder(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.sub;
    return this.orderService.cancelOrder(+id, userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Post(':id/reorder')
  reorderOrder(@Param('id') id: string, @Body() reorderDto: ReorderDto, @Req() req: any) {
    const userId = req.user.sub;
    return this.orderService.reorderOrder(+id, reorderDto, userId);
  }
}
