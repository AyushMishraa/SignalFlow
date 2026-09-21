import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { DeliveryWorkerModule } from './delivery-worker.module';

async function bootstrap() {
  const logger = new Logger('DeliveryWorker');
  const app = await NestFactory.createApplicationContext(DeliveryWorkerModule);

  logger.log('Delivery Worker microservice started and listening for notification delivery messages...');

  // Graceful shutdown handling
  process.on('SIGINT', async () => {
    logger.log('Shutting down Delivery Worker...');
    await app.close();
    process.exit(0);
  });
  process.on('SIGTERM', async () => {
    logger.log('Terminating Delivery Worker...');
    await app.close();
    process.exit(0);
  });
}

bootstrap();

