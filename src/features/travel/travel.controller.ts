import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { TravelService } from './travel.service';
import { CreateTravelDto } from './dto/create-travel.dto';
import { TravelDto } from './dto/travel.dto';

@Controller('travel')
export class TravelController {
  constructor(private readonly travelService: TravelService) {}

  @Post()
  create(@Body() createTravelDto: CreateTravelDto) {
    return this.travelService.create(createTravelDto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateData: { drive_folder_id?: string },
  ) {
    return this.travelService.update(id, updateData);
  }

  @Get('check-name-unique')
  checkNameUnique(
    @Query('user_id') userId: string,
    @Query('name') name: string,
  ) {
    return this.travelService.checkNameUnique(userId, name);
  }

  @Get('user/:userId')
  async findAllByUserId(@Param('userId') userId: string): Promise<TravelDto[]> {
    const travels = await this.travelService.findAllByUserId(userId);
    return travels.map((travel) => TravelDto.fromEntity(travel));
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<TravelDto> {
    const travel = await this.travelService.findOne(id);
    return TravelDto.fromEntity(travel);
  }

  @Post('create-folder')
  async createTravelFolder(
    @Body() body: { email: string; travel_name: string },
  ) {
    const folderId = await this.travelService.createTravelFolder(
      body.email,
      body.travel_name,
    );
    return { folder_id: folderId };
  }
}
