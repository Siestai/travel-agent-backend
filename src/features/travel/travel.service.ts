import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TravelEntity } from './entity/travel.entity';
import { CreateTravelDto } from './dto/create-travel.dto';
import { UserService } from '../user/user.service';
import { AppError } from '../../utils/error/app-error';
import { AppErrorType, AppErrorCodes } from '../../common/error-codes';

@Injectable()
export class TravelService {
  private readonly logger = new Logger(TravelService.name);
  constructor(
    @InjectRepository(TravelEntity)
    private readonly travelRepository: Repository<TravelEntity>,
    private readonly userService: UserService,
  ) {}

  async create(createTravelDto: CreateTravelDto) {
    // Check if travel name is unique for this user
    const existingTravel = await this.travelRepository.findOne({
      where: {
        user_id: createTravelDto.user_id,
        name: createTravelDto.name,
      },
    });

    if (existingTravel) {
      throw new AppError({
        message: 'Travel name must be unique',
        ...AppErrorType[AppErrorCodes.BAD_REQUEST],
      });
    }

    const travel = await this.travelRepository.save(createTravelDto);
    return travel;
  }

  async update(id: string, updateData: Partial<TravelEntity>) {
    await this.travelRepository.update(id, updateData);
    return this.travelRepository.findOne({ where: { id } });
  }

  async checkNameUnique(userId: string, name: string): Promise<boolean> {
    const existingTravel = await this.travelRepository.findOne({
      where: {
        user_id: userId,
        name: name,
      },
    });

    return !existingTravel;
  }

  async createTravelFolder(
    email: string,
    travelName: string,
  ): Promise<string> {
    try {
      // Get user with Drive credentials
      const user = await this.userService.findByEmail(email);

      if (!user) {
        throw new AppError({
          message: 'User not found',
          ...AppErrorType[AppErrorCodes.NOT_FOUND],
        });
      }

      if (!user.drive_connected || !user.drive_access_token) {
        throw new AppError({
          message: 'Google Drive not connected',
          ...AppErrorType[AppErrorCodes.BAD_REQUEST],
        });
      }

      if (!user.drive_root_folder_id) {
        throw new AppError({
          message: 'Root folder not found. Please reconnect Google Drive',
          ...AppErrorType[AppErrorCodes.BAD_REQUEST],
        });
      }

      // Refresh access token if needed (using refresh token)
      let accessToken = user.drive_access_token;
      if (!accessToken && user.drive_refresh_token) {
        // Token refresh logic would go here
        // For now, we'll use the stored token
        this.logger.warn('Access token may be expired, but proceeding');
      }

      // Create folder inside the root folder
      const folderResponse = await fetch(
        'https://www.googleapis.com/drive/v3/files',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: travelName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [user.drive_root_folder_id],
          }),
        },
      );

      const responseText = await folderResponse.text();
      this.logger.debug(
        `Travel folder creation response status: ${folderResponse.status}`,
      );
      this.logger.debug(`Travel folder creation response: ${responseText}`);

      if (!folderResponse.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { message: responseText };
        }

        // Handle token expiration
        if (errorData.error?.code === 401 || folderResponse.status === 401) {
          throw new AppError({
            message: 'Drive access token expired. Please reconnect Google Drive',
            ...AppErrorType[AppErrorCodes.UNAUTHORIZED],
          });
        }

        this.logger.error(
          'Failed to create travel folder:',
          JSON.stringify(errorData, null, 2),
        );
        throw new AppError({
          message:
            errorData.error?.message ||
            errorData.message ||
            'Failed to create Drive folder',
          ...AppErrorType[AppErrorCodes.INTERNAL_SERVER_ERROR],
        });
      }

      const folderData = JSON.parse(responseText);
      const folderId = folderData.id;

      if (!folderId) {
        this.logger.error('Folder ID not found in response:', folderData);
        throw new AppError({
          message: 'Folder ID not received from Google Drive',
          ...AppErrorType[AppErrorCodes.INTERNAL_SERVER_ERROR],
        });
      }

      this.logger.log(
        `Travel folder created: ${folderId} (${travelName})`,
      );

      return folderId;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      this.logger.error('Failed to create travel folder:', error);
      throw new AppError({
        message: 'Failed to create Drive folder',
        ...AppErrorType[AppErrorCodes.INTERNAL_SERVER_ERROR],
      });
    }
  }
}
