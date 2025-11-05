import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './utils/error/all-exceptions.filter';
import { ConfigService } from '@nestjs/config';
import { NatsService } from './utils/nats/nats.service';
import { RetentionPolicy } from 'nats';
import { NatsJetStreamServer } from '@nestjs-plugins/nestjs-nats-jetstream-transport';
import { CustomStrategy } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new AllExceptionsFilter());

  const configService = app.get(ConfigService);

  // Initialize NATS stream
  const natsService = app.get(NatsService);
  const numReplicas = parseInt(
    configService.get<string>('BASE_STREAM_REPLICA') || '3',
  );
  const parserStream =
    configService.get<string>('PARSER_STREAM') || 'TRAVEL_PARSER';
  const parserSubject =
    configService.get<string>('PARSER_SUBJECT') || 'travel.v1.parser.*';

  await natsService.createOrUpdateStream({
    name: parserStream,
    subjects: [parserSubject],
    retention: RetentionPolicy.Workqueue,
    num_replicas: numReplicas,
  });

  // Initialize NATS microservice for event handling
  const options: CustomStrategy = {
    strategy: new NatsJetStreamServer({
      connectionOptions: {
        servers: configService.getOrThrow<string>('NATS_SERVERS').split(','),
        name: 'travel-parser-connection',
        user: 'anonymous',
        pass: 'anonymous_anonymous_anonymous', // we don't care about password since its not open in public
      },
      consumerOptions: {
        deliverGroup: 'travel-parser-group',
        durable: 'travel-parser',
        deliverTo: 'travel-parser-box',
        manualAck: true,
        ackPolicy: 'Explicit',
        maxAckPending: 10,
      },
    }),
  };
  const microService = app.connectMicroservice(options);
  await microService.listen();

  await app.listen(process.env.PORT || 4000);
}
bootstrap();
