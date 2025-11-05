import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './features/user/user.module';
import { AuthModule } from './features/auth/auth.module';
import { UserEntity } from './features/user/entity/user.entity';
import { TravelModule } from './features/travel/travel.module';
import { DocumentModule } from './features/document/document.module';
import { DocumentEntity } from './features/document/entity/document.entity';
import { TravelEntity } from './features/travel/entity/travel.entity';
import { ParserModule } from './agents/parser/parser.module';
import { NatsModule } from './utils/nats/nats.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env.local',
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST'),
        port: configService.get<number>('DATABASE_PORT'),
        username: configService.get<string>('DATABASE_USER'),
        password: configService.get<string>('DATABASE_PASSWORD'),
        database: configService.get<string>('DATABASE_NAME'),
        entities: [UserEntity, DocumentEntity, TravelEntity],
        synchronize: false, // Set to false in production, use migrations instead
      }),
      inject: [ConfigService],
    }),
    NatsModule,
    UserModule,
    AuthModule,
    TravelModule,
    DocumentModule,
    ParserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
