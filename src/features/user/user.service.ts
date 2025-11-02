import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
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
    private readonly configService: ConfigService,
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

  async connectDrive(email: string, accessToken: string, refreshToken: string) {
    try {
      const user = await this.findByEmail(email);
      if (!user) {
        throw new AppError({
          message: 'User not found',
          ...AppErrorType[AppErrorCodes.NOT_FOUND],
        });
      }

      user.drive_connected = true;
      user.drive_access_token = accessToken;
      user.drive_refresh_token = refreshToken;

      const updatedUser = await this.userRepository.save(user);
      this.logger.log(`Google Drive connected for user ${email}`);
      return updatedUser;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      this.logger.error(`Failed to connect Google Drive for ${email}:`, error);
      throw new AppError({
        message: 'Failed to connect Google Drive',
        ...AppErrorType[AppErrorCodes.INTERNAL_SERVER_ERROR],
      });
    }
  }

  async exchangeDriveToken(
    code: string,
    redirectUri: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    try {
      const googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
      const googleClientSecret = this.configService.get<string>(
        'GOOGLE_CLIENT_SECRET',
      );

      if (!googleClientId || !googleClientSecret) {
        throw new AppError({
          message: 'Google OAuth credentials not configured',
          ...AppErrorType[AppErrorCodes.INTERNAL_SERVER_ERROR],
        });
      }

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: googleClientId,
          client_secret: googleClientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        this.logger.error('Failed to exchange Google Drive token:', errorData);
        throw new AppError({
          message:
            errorData.error_description ||
            'Failed to exchange authorization code',
          ...AppErrorType[AppErrorCodes.BAD_REQUEST],
        });
      }

      const tokenData = await tokenResponse.json();
      const { access_token, refresh_token } = tokenData;

      if (!access_token || !refresh_token) {
        throw new AppError({
          message: 'Tokens not received from Google',
          ...AppErrorType[AppErrorCodes.BAD_REQUEST],
        });
      }

      return { access_token, refresh_token };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      this.logger.error('Failed to exchange Google Drive token:', error);
      throw new AppError({
        message: 'Failed to exchange Google Drive token',
        ...AppErrorType[AppErrorCodes.INTERNAL_SERVER_ERROR],
      });
    }
  }
}
