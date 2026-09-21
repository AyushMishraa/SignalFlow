import { Module } from '@nestjs/common';
import { MessagingModule } from '@app/messaging';
import { OutboxService } from './outbox.service';

@Module({
  imports: [MessagingModule],
  providers: [OutboxService],
  exports: [OutboxService],
})
export class OutboxModule {}

