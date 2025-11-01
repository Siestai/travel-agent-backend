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
    try {
      this.logger.debug(`Creating user ${createUserDto.email}`);
      const user = new UserEntity();
      user.email = createUserDto.email;
      const savedUser = await this.userRepository.save(user);
      this.logger.log(`User created ${user.email}`);
      return savedUser;
    } catch (error: any) {
      // Handle duplicate email constraint violation
      if (error.code === '23505') {
        // Unique constraint violation - user might have been created in parallel
        // Try to find the existing user
        this.logger.warn(
          `User creation failed due to duplicate email: ${createUserDto.email}, attempting to find existing user`,
        );
        const existingUser = await this.findByEmail(createUserDto.email);
        if (existingUser) {
          return existingUser;
        }
      }
      // Re-throw other errors
      this.logger.error(`Failed to create user ${createUserDto.email}:`, error);
      throw new AppError({
        message: 'Failed to create user',
        ...AppErrorType[AppErrorCodes.INTERNAL_SERVER_ERROR],
      });
    }
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
