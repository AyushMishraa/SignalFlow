import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { SchedulerModule } from './scheduler.module';

async function bootstrap() {
  const logger = new Logger('Scheduler');
  const app = await NestFactory.createApplicationContext(SchedulerModule);

  logger.log('Scheduler microservice started and running distributed polling jobs...');

  process.on('SIGINT', async () => {
    logger.log('Shutting down Scheduler...');
    await app.close();
    process.exit(0);
  });
  process.on('SIGTERM', async () => {
    logger.log('Terminating Scheduler...');
    await app.close();
    process.exit(0);
  });
}

bootstrap();

