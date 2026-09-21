import { Module } from '@nestjs/common';
import { DatabaseModule } from '@app/database';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}

