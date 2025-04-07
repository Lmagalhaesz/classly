import { Module } from '@nestjs/common';
import { ChatInsightsController } from './chat-insights.controller';
import { ChatInsightsService } from './chat-insights.service';

@Module({
  controllers: [ChatInsightsController],
  providers: [ChatInsightsService]
})
export class ChatInsightsModule {}
