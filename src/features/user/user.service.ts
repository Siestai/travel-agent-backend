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

  /**
   * Searches for "Siestai Travel" folder in user's Google Drive
   * Returns folder ID if found, null otherwise
   */
  async findSiestaiTravelFolder(accessToken: string): Promise<string | null> {
    try {
      this.logger.debug('Searching for Siestai Travel folder');

      // Search for folder with name "Siestai Travel" and folder mime type
      const searchUrl =
        'https://www.googleapis.com/drive/v3/files?' +
        new URLSearchParams({
          q: "name='Siestai Travel' and mimeType='application/vnd.google-apps.folder' and trashed=false",
          fields: 'files(id, name)',
        });

      this.logger.debug(`Search URL: ${searchUrl}`);

      const searchResponse = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const responseText = await searchResponse.text();
      this.logger.debug(`Search response status: ${searchResponse.status}`);
      this.logger.debug(`Search response: ${responseText}`);

      if (!searchResponse.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { message: responseText };
        }

        this.logger.error(
          'Failed to search for Siestai Travel folder:',
          JSON.stringify(errorData, null, 2),
        );
        throw new AppError({
          message:
            errorData.error?.message ||
            errorData.message ||
            'Failed to search Drive folder',
          ...AppErrorType[AppErrorCodes.INTERNAL_SERVER_ERROR],
        });
      }

      const searchData = JSON.parse(responseText);
      const folders = searchData.files || [];

      this.logger.debug(`Found ${folders.length} matching folders`);

      // Return the first matching folder ID, or null if not found
      if (folders.length > 0) {
        this.logger.log(
          `Found existing Siestai Travel folder: ${folders[0].id}`,
        );
        return folders[0].id;
      }

      this.logger.debug('Siestai Travel folder not found');
      return null;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      this.logger.error('Failed to find Siestai Travel folder:', error);
      throw new AppError({
        message: 'Failed to search for Drive folder',
        ...AppErrorType[AppErrorCodes.INTERNAL_SERVER_ERROR],
      });
    }
  }

  /**
   * Creates "Siestai Travel" folder in user's Google Drive
   * Returns the folder ID
   */
  async createSiestaiTravelFolder(accessToken: string): Promise<string> {
    try {
      this.logger.debug('Creating Siestai Travel folder with access token');

      const folderResponse = await fetch(
        'https://www.googleapis.com/drive/v3/files',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'Siestai Travel',
            mimeType: 'application/vnd.google-apps.folder',
          }),
        },
      );

      const responseText = await folderResponse.text();
      this.logger.debug(
        `Folder creation response status: ${folderResponse.status}`,
      );
      this.logger.debug(`Folder creation response: ${responseText}`);

      if (!folderResponse.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { message: responseText };
        }

        this.logger.error(
          'Failed to create Siestai Travel folder:',
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

      // Verify the folder was actually created by fetching it
      const verifyResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,mimeType`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!verifyResponse.ok) {
        const verifyError = await verifyResponse.json();
        this.logger.error('Failed to verify created folder:', verifyError);
        throw new AppError({
          message: 'Folder created but verification failed',
          ...AppErrorType[AppErrorCodes.INTERNAL_SERVER_ERROR],
        });
      }

      const verifiedFolder = await verifyResponse.json();
      this.logger.log(
        `Siestai Travel folder created and verified: ${folderId} (${verifiedFolder.name})`,
      );

      return folderId;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      this.logger.error('Failed to create Siestai Travel folder:', error);
      throw new AppError({
        message: 'Failed to create Drive folder',
        ...AppErrorType[AppErrorCodes.INTERNAL_SERVER_ERROR],
      });
    }
  }

  /**
   * Ensures "Siestai Travel" folder exists in user's Drive
   * Checks first, creates if not found, returns folder ID
   */
  async ensureSiestaiTravelFolderExists(
    accessToken: string,
    email: string,
  ): Promise<string> {
    try {
      // First, try to find existing folder
      let folderId = await this.findSiestaiTravelFolder(accessToken);

      if (folderId) {
        this.logger.log(
          `Siestai Travel folder found for user ${email}: ${folderId}`,
        );
        return folderId;
      }

      // Folder doesn't exist, create it
      this.logger.log(`Creating Siestai Travel folder for user ${email}`);
      folderId = await this.createSiestaiTravelFolder(accessToken);
      this.logger.log(
        `Siestai Travel folder created for user ${email}: ${folderId}`,
      );

      return folderId;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      this.logger.error(
        `Failed to ensure Siestai Travel folder exists for ${email}:`,
        error,
      );
      throw new AppError({
        message: 'Failed to ensure Drive folder exists',
        ...AppErrorType[AppErrorCodes.INTERNAL_SERVER_ERROR],
      });
    }
  }

  async connectDrive(email: string, accessToken: string, refreshToken: string) {
    try {
      this.logger.log(`Starting Google Drive connection for user ${email}`);

      const user = await this.findByEmail(email);
      if (!user) {
        throw new AppError({
          message: 'User not found',
          ...AppErrorType[AppErrorCodes.NOT_FOUND],
        });
      }

      // Ensure "Siestai Travel" folder exists in user's Drive
      this.logger.log(
        `Ensuring Siestai Travel folder exists for user ${email}`,
      );
      const folderId = await this.ensureSiestaiTravelFolderExists(
        accessToken,
        email,
      );

      if (!folderId) {
        throw new AppError({
          message: 'Failed to get folder ID after ensuring folder exists',
          ...AppErrorType[AppErrorCodes.INTERNAL_SERVER_ERROR],
        });
      }

      this.logger.log(`Folder ID obtained: ${folderId}`);

      user.drive_connected = true;
      user.drive_access_token = accessToken;
      user.drive_refresh_token = refreshToken;
      user.drive_root_folder_id = folderId;

      const updatedUser = await this.userRepository.save(user);
      this.logger.log(
        `Google Drive connected for user ${email} with folder ${folderId}`,
      );

      // Double-check the folder exists
      const verifyFolder = await this.findSiestaiTravelFolder(accessToken);
      if (verifyFolder !== folderId) {
        this.logger.warn(
          `Warning: Folder ID mismatch. Stored: ${folderId}, Found: ${verifyFolder}`,
        );
      }

      return updatedUser;
    } catch (error) {
      if (error instanceof AppError) {
        this.logger.error(
          `Failed to connect Google Drive for ${email}: ${error.message}`,
        );
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

  async disconnectDrive(email: string) {
    try {
      const user = await this.findByEmail(email);
      if (!user) {
        throw new AppError({
          message: 'User not found',
          ...AppErrorType[AppErrorCodes.NOT_FOUND],
        });
      }

      user.drive_connected = false;
      user.drive_access_token = null;
      user.drive_refresh_token = null;
      user.drive_root_folder_id = null;

      const updatedUser = await this.userRepository.save(user);
      this.logger.log(`Google Drive disconnected for user ${email}`);
      return updatedUser;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      this.logger.error(
        `Failed to disconnect Google Drive for ${email}:`,
        error,
      );
      throw new AppError({
        message: 'Failed to disconnect Google Drive',
        ...AppErrorType[AppErrorCodes.INTERNAL_SERVER_ERROR],
      });
    }
  }
}
