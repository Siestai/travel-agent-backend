import { Module } from '@nestjs/common';
import { NatsService } from './nats.service';
import {
  NatsJetStreamClientAsyncOptions,
  NatsJetStreamTransport,
} from '@nestjs-plugins/nestjs-nats-jetstream-transport';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    NatsJetStreamTransport.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        return {
          connectionOptions: {
            servers: configService
              .getOrThrow<string>('NATS_SERVERS')
              .split(','),
            name: 'travel-parser-subscriber',
            user: 'anonymous',
            pass: 'anonymous_anonymous_anonymous', // we don't care about password since its not open in public
          },
        };
      },
      inject: [ConfigService],
    } as NatsJetStreamClientAsyncOptions),
  ],
  providers: [NatsService],
  exports: [NatsService],
})
export class NatsModule {}
