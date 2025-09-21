import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards, Query } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { UpdateWishlistDto } from './dto/update-wishlist.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { FilterWishListDto } from './dto/filter-wishlist.dto';

@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @ApiBearerAuth()
  @Post()
  @UseGuards(JwtGuard)
  create(@Req() req: any, @Body() createWishlistDto: CreateWishlistDto) {
    const userId = req.user.sub;
    return this.wishlistService.create(userId, createWishlistDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtGuard)
  @Get()
  filterWishList(@Req() req: any, @Query() query: FilterWishListDto) {
    const userId = req.user.sub;
    return this.wishlistService.filterWishList(userId, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.wishlistService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWishlistDto: UpdateWishlistDto) {
    return this.wishlistService.update(+id, updateWishlistDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.wishlistService.remove(+id);
  }
}
