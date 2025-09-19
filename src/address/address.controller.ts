import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AddressService } from './implements/address.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('address')
@UseGuards(JwtGuard)
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Post('create')
  create(@Body() createAddressDto: CreateAddressDto, @Request() req: any) {
    const userId = req.user.sub;
    return this.addressService.create(createAddressDto, userId);
  }
  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Get('all')
  findAll(@Request() req: any) {
    const userId = req.user.sub;
    return this.addressService.findByUserId(userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Get('default')
  findDefaultAddress(@Request() req: any) {
    const userId = req.user.sub;
    return this.addressService.findDefaultByUserId(userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Get(':id')
  findOne(@Param('id') id: number, @Request() req: any) {
    const userId = req.user.sub;
    return this.addressService.findOne(+id, userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Patch('update/:id')
  update(@Param('id') id: number, @Body() updateAddressDto: UpdateAddressDto, @Request() req: any) {
    const userId = req.user.sub;
    return this.addressService.update(+id, updateAddressDto, userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: number, @Request() req: any) {
    const userId = req.user.sub;
    return this.addressService.remove(+id, userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Patch(':id/set-default')
  setDefaultAddress(@Param('id') id: number, @Request() req: any) {
    const userId = req.user.sub;
    return this.addressService.setDefaultAddress(+id, userId);
  }
}
