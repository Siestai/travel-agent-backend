import { Injectable, Logger } from '@nestjs/common';
import {
  NatsJetStreamClientProxy,
  NatsStreamConfig,
} from '@nestjs-plugins/nestjs-nats-jetstream-transport';

@Injectable()
export class NatsService {
  private readonly logger = new Logger(NatsService.name);
  constructor(private natsClient: NatsJetStreamClientProxy) {}

  async createOrUpdateStream(options: NatsStreamConfig) {
    const nats = await this.natsClient.connect();
    const jsm = await nats.jetstreamManager();
    const stream = await this.getStream(options);
    if (stream) {
      await jsm.streams.update(options.name, options);
    } else {
      await jsm.streams.add(options);
    }
    this.logger.debug(`Stream ${options.name} created or updated`);
  }

  private async getStream(options: NatsStreamConfig) {
    try {
      const nats = await this.natsClient.connect();
      const jsm = await nats.jetstreamManager();
      return await jsm.streams.get(options.name);
    } catch {
      return null;
    }
  }

  public publishEvent<T>(subject: string, data: T) {
    this.natsClient.emit(subject, data);
    this.logger.debug(`Event published to ${subject}`);
  }
}
