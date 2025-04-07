import { Test, TestingModule } from '@nestjs/testing';
import { ChatInsightsController } from './chat-insights.controller';

describe('ChatInsightsController', () => {
  let controller: ChatInsightsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatInsightsController],
    }).compile();

    controller = module.get<ChatInsightsController>(ChatInsightsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
