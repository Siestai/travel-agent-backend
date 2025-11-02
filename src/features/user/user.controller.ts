import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ConnectDriveDto } from './dto/connect-drive.dto';
import { ExchangeDriveTokenDto } from './dto/exchange-drive-token.dto';
import { DisconnectDriveDto } from './dto/disconnect-drive.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get(':email')
  findByEmail(@Param('email') email: string) {
    return this.userService.findByEmail(email);
  }

  @Post('connect-drive')
  connectDrive(@Body() connectDriveDto: ConnectDriveDto) {
    return this.userService.connectDrive(
      connectDriveDto.email,
      connectDriveDto.access_token,
      connectDriveDto.refresh_token,
    );
  }

  @Post('exchange-drive-token')
  async exchangeDriveToken(
    @Body() exchangeDriveTokenDto: ExchangeDriveTokenDto,
    @Query('redirect_uri') redirectUri: string,
  ) {
    const tokens = await this.userService.exchangeDriveToken(
      exchangeDriveTokenDto.code,
      redirectUri ||
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/oauth/drive/callback`,
    );
    return tokens;
  }

  @Post('disconnect-drive')
  disconnectDrive(@Body() disconnectDriveDto: DisconnectDriveDto) {
    return this.userService.disconnectDrive(disconnectDriveDto.email);
  }
}
