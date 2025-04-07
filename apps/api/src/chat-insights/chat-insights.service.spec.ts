import { Test, TestingModule } from '@nestjs/testing';
import { ChatInsightsService } from './chat-insights.service';

describe('ChatInsightsService', () => {
  let service: ChatInsightsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatInsightsService],
    }).compile();

    service = module.get<ChatInsightsService>(ChatInsightsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
