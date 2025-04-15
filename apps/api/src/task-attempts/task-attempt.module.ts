// src/task-attempt/task-attempt.module.ts
import { Module } from '@nestjs/common';
import { TaskAttemptController } from './task-attempt.controller';
import { TaskAttemptService } from './task-attempt.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TaskAttemptController],
  providers: [TaskAttemptService],
  exports: [TaskAttemptService],
})
export class TaskAttemptModule {}
