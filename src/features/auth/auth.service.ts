import { Injectable, Logger } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(private readonly userService: UserService) {}

  async login(loginDto: LoginDto) {
    const foundUser = await this.userService.findByEmail(loginDto.email);
    if (foundUser) return foundUser;
    
    this.logger.warn(`User not found for email: ${loginDto.email}, creating new user...`);
    return this.userService.create({
      email: loginDto.email,
    });
  }
}
