import { Module } from '@nestjs/common';
import { AutomatedMessagesController } from './automated-messages.controller';
import { AutomatedMessagesService } from './automated-messages.service';

@Module({
  controllers: [AutomatedMessagesController],
  providers: [AutomatedMessagesService]
})
export class AutomatedMessagesModule {}
