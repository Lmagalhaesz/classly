import { Module } from '@nestjs/common';
import { ActivityController } from './activities.controller';
import { ActivityService } from './activities.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ActivityController],
  providers: [ActivityService],
  exports: [ActivityService],
})
export class ActivityModule {}
