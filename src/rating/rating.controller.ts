import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { RatingService } from './rating.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';
import { RatingFilterDto } from './dto/Filter-rating.dto';
import { Rating } from './entities/rating.entity';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtGuard } from 'src/auth/guards/jwt.guard';

@Controller('rating')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @ApiBearerAuth()
  @Post()
  @UseGuards(JwtGuard)
  create(@Req() req: any, @Body() createRatingDto: CreateRatingDto) {
    const userId = req.user.sub;
    return this.ratingService.create(userId, createRatingDto);
  }

  @Get()
  findAll() {
    return this.ratingService.findAll();
  }

  @Get('search')
  async Search(@Query() query: RatingFilterDto) {
    return this.ratingService.filterRating(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ratingService.findOne(+id);
  }

  @Get('/by-product/:id')
  getAllRatingsByProductId(@Param('id') id: number): Promise<Rating[]> {
    return this.ratingService.getAllRatingsByProductId(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRatingDto: UpdateRatingDto) {
    return this.ratingService.update(+id, updateRatingDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ratingService.remove(+id);
  }

  @Delete('/by-product/:id')
  deletedRatingByProductId(@Param('id') id: string) {
    return this.ratingService.deletedRatingByProductId(+id);
  }
}
