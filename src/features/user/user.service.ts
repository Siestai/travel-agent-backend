import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entity/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { AppError } from 'src/utils/error/app-error';
import { AppErrorCodes, AppErrorType } from 'src/common/error-codes';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    this.logger.debug(`Creating user ${createUserDto.email}`);
    const user = new UserEntity();
    user.email = createUserDto.email;
    const savedUser = await this.userRepository.save(user);
    this.logger.log(`User created ${user.email}`);
    return savedUser;
  }

  async findByEmail(email: string) {
    try {
      const foundUser = await this.userRepository.findOne({ where: { email } });

      if (!foundUser) return null;

      return foundUser;
    } catch (error) {
      throw new AppError({
        message: 'Failed to find user by email',
        ...AppErrorType[AppErrorCodes.INTERNAL_SERVER_ERROR],
      });
    }
  }
}
