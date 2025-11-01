import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TravelEntity } from './entity/travel.entity';
import { CreateTravelDto } from './dto/create-travel.dto';

@Injectable()
export class TravelService {
  private readonly logger = new Logger(TravelService.name);
  constructor(
    @InjectRepository(TravelEntity)
    private readonly travelRepository: Repository<TravelEntity>,
  ) {}

  async create(createTravelDto: CreateTravelDto) {
    return this.travelRepository.save(createTravelDto);
  }
}
