import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppErrorFilter } from './utils/error/app-error.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new AppErrorFilter());
  await app.listen(process.env.PORT || 4000);
}
bootstrap();
