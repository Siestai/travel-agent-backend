import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentEntity } from './entity/document.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UserService } from '../user/user.service';
import { TravelService } from '../travel/travel.service';
import { AppError } from '../../utils/error/app-error';
import { AppErrorType, AppErrorCodes } from '../../common/error-codes';

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);
  constructor(
    @InjectRepository(DocumentEntity)
    private readonly documentRepository: Repository<DocumentEntity>,
    private readonly userService: UserService,
    private readonly travelService: TravelService,
  ) {}

  async create(createDocumentDto: CreateDocumentDto) {
    const document = this.documentRepository.create({
      user_id: createDocumentDto.user_id,
      travel_id: createDocumentDto.travel_id,
      file_id: createDocumentDto.file_id,
      name: createDocumentDto.name,
      url: createDocumentDto.url,
    });
    return this.documentRepository.save(document);
  }

  async delete(id: string) {
    try {
      // Find document first to get file_id and user_id
      const document = await this.documentRepository.findOne({
        where: { id },
      });

      if (!document) {
        throw new AppError({
          message: 'Document not found',
          ...AppErrorType[AppErrorCodes.NOT_FOUND],
        });
      }

      // Get user to access Drive credentials
      const user = await this.userService.findById(document.user_id);
      if (!user) {
        throw new AppError({
          message: 'User not found',
          ...AppErrorType[AppErrorCodes.NOT_FOUND],
        });
      }

      if (!user.drive_connected || !document.file_id) {
        // If Drive is not connected or no file_id, just delete from database
        this.logger.warn(
          `Document ${id} has no Drive connection or file_id, deleting from database only`,
        );
        await this.documentRepository.delete({ id });
        return { success: true };
      }

      // Delete from Google Drive
      const accessToken = user.drive_access_token;
      let driveDeleted = false;

      if (accessToken) {
        try {
          const deleteResponse = await fetch(
            `https://www.googleapis.com/drive/v3/files/${document.file_id}`,
            {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            },
          );

          // If unauthorized, try refreshing the token
          if (deleteResponse.status === 401 && user.drive_refresh_token) {
            this.logger.log(
              `Access token expired, refreshing token for document deletion`,
            );
            try {
              const { access_token: newAccessToken } =
                await this.userService.refreshAccessToken(
                  user.drive_refresh_token,
                );

              // Update user with new access token
              await this.userService.updateAccessToken(user.id, newAccessToken);

              // Retry deletion with new token
              const retryResponse = await fetch(
                `https://www.googleapis.com/drive/v3/files/${document.file_id}`,
                {
                  method: 'DELETE',
                  headers: {
                    Authorization: `Bearer ${newAccessToken}`,
                  },
                },
              );

              if (retryResponse.ok || retryResponse.status === 404) {
                driveDeleted = true;
                this.logger.log(
                  `File deleted from Drive after token refresh: ${document.file_id}`,
                );
              } else {
                const errorData = await retryResponse.json().catch(() => ({}));
                this.logger.error(
                  `Failed to delete file from Drive after refresh: ${JSON.stringify(errorData)}`,
                );
                throw new AppError({
                  message:
                    errorData.error?.message ||
                    'Failed to delete file from Google Drive',
                  ...AppErrorType[AppErrorCodes.INTERNAL_SERVER_ERROR],
                });
              }
            } catch (refreshError) {
              this.logger.error(
                `Failed to refresh token for deletion: ${refreshError}`,
              );
              throw new AppError({
                message: 'Failed to refresh access token for file deletion',
                ...AppErrorType[AppErrorCodes.UNAUTHORIZED],
              });
            }
          } else if (deleteResponse.ok || deleteResponse.status === 404) {
            driveDeleted = true;
            this.logger.log(`File deleted from Drive: ${document.file_id}`);
          } else {
            const errorData = await deleteResponse.json().catch(() => ({}));
            this.logger.error(
              `Failed to delete file from Drive: ${JSON.stringify(errorData)}`,
            );
            throw new AppError({
              message:
                errorData.error?.message ||
                'Failed to delete file from Google Drive',
              ...AppErrorType[AppErrorCodes.INTERNAL_SERVER_ERROR],
            });
          }
        } catch (error) {
          if (error instanceof AppError) {
            throw error;
          }
          this.logger.error(`Error deleting file from Drive: ${error}`);
          throw new AppError({
            message: 'Failed to delete file from Google Drive',
            ...AppErrorType[AppErrorCodes.INTERNAL_SERVER_ERROR],
          });
        }
      } else {
        throw new AppError({
          message: 'No access token available for Drive deletion',
          ...AppErrorType[AppErrorCodes.BAD_REQUEST],
        });
      }

      // Delete from database only after successful Drive deletion
      if (driveDeleted) {
        await this.documentRepository.delete({ id });
        this.logger.log(`Document deleted: ${id}`);
      } else {
        throw new AppError({
          message: 'Failed to delete file from Google Drive',
          ...AppErrorType[AppErrorCodes.INTERNAL_SERVER_ERROR],
        });
      }

      return { success: true };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      this.logger.error(`Failed to delete document ${id}:`, error);
      throw new AppError({
        message: 'Failed to delete document',
        ...AppErrorType[AppErrorCodes.INTERNAL_SERVER_ERROR],
      });
    }
  }

  async findAllByTravelId(travelId: string) {
    try {
      const documents = await this.documentRepository.find({
        where: { travel_id: travelId },
        order: { created: 'DESC' },
      });
      return documents;
    } catch (error) {
      this.logger.error(
        `Failed to find documents for travel ${travelId}:`,
        error,
      );
      throw new AppError({
        message: 'Failed to fetch documents',
        ...AppErrorType[AppErrorCodes.INTERNAL_SERVER_ERROR],
      });
    }
  }

  async findOne(id: string) {
    try {
      const document = await this.documentRepository.findOne({
        where: { id },
      });

      if (!document) {
        throw new AppError({
          message: 'Document not found',
          ...AppErrorType[AppErrorCodes.NOT_FOUND],
        });
      }

      return document;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      this.logger.error(`Failed to find document ${id}:`, error);
      throw new AppError({
        message: 'Failed to fetch document',
        ...AppErrorType[AppErrorCodes.INTERNAL_SERVER_ERROR],
      });
    }
  }

  async uploadFile(email: string, travelId: string, file: Express.Multer.File) {
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

      // Get travel to find folder ID
      const travel = await this.travelService.findOne(travelId);
      if (!travel.drive_folder_id) {
        throw new AppError({
          message: 'Travel folder not found. Please create travel folder first',
          ...AppErrorType[AppErrorCodes.BAD_REQUEST],
        });
      }

      const accessToken = user.drive_access_token;

      // Upload file to Google Drive
      const metadata = {
        name: file.originalname,
        parents: [travel.drive_folder_id],
      };

      // Use multipart upload for Google Drive
      const boundary = '----WebKitFormBoundary' + Date.now();
      const formDataParts: Buffer[] = [];

      // Add metadata part
      formDataParts.push(
        Buffer.from(`--${boundary}\r\n`),
        Buffer.from('Content-Type: application/json; charset=UTF-8\r\n\r\n'),
        Buffer.from(JSON.stringify(metadata) + '\r\n'),
      );

      // Add file part
      formDataParts.push(
        Buffer.from(`--${boundary}\r\n`),
        Buffer.from(`Content-Type: ${file.mimetype}\r\n\r\n`),
        file.buffer,
        Buffer.from('\r\n'),
      );

      // Add closing boundary
      formDataParts.push(Buffer.from(`--${boundary}--\r\n`));

      const multipartBody = Buffer.concat(formDataParts);

      const uploadResponse = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartBody,
        },
      );

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        this.logger.error('Failed to upload file to Drive:', errorData);
        throw new AppError({
          message:
            errorData.error?.message || 'Failed to upload file to Google Drive',
          ...AppErrorType[AppErrorCodes.INTERNAL_SERVER_ERROR],
        });
      }

      const fileData = await uploadResponse.json();
      const fileId = fileData.id;
      const webViewLink = fileData.webViewLink;
      const webContentLink = fileData.webContentLink;

      if (!fileId) {
        throw new AppError({
          message: 'File ID not received from Google Drive',
          ...AppErrorType[AppErrorCodes.INTERNAL_SERVER_ERROR],
        });
      }

      // Create document record
      const document = this.documentRepository.create({
        user_id: user.id,
        travel_id: travelId,
        file_id: fileId,
        name: file.originalname,
        url: webViewLink || webContentLink,
        drive_folder_id: travel.drive_folder_id,
      });

      const savedDocument = await this.documentRepository.save(document);
      this.logger.log(`Document uploaded: ${fileId} (${file.originalname})`);

      return savedDocument;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      this.logger.error('Failed to upload file:', error);
      throw new AppError({
        message: 'Failed to upload file',
        ...AppErrorType[AppErrorCodes.INTERNAL_SERVER_ERROR],
      });
    }
  }
}
