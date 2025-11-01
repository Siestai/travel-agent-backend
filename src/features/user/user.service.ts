import { Injectable, Logger } from "@nestjs/common";
import { Repository } from "typeorm";
import { UserEntity } from "./entity/user.entity";
import { CreateUserDto } from "./dto/create-user.dto";

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(private readonly userRepository: Repository<UserEntity>) {}

  async create(createUserDto: CreateUserDto) {
    this.logger.debug(`Creating user ${createUserDto.email}`);
    return this.userRepository.save(createUserDto);
  }
}