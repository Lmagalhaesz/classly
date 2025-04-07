import { Test, TestingModule } from '@nestjs/testing';
import { AutomatedMessagesService } from './automated-messages.service';

describe('AutomatedMessagesService', () => {
  let service: AutomatedMessagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AutomatedMessagesService],
    }).compile();

    service = module.get<AutomatedMessagesService>(AutomatedMessagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
