import { Test, TestingModule } from '@nestjs/testing';
import { HottakesService } from './hottakes.service';

describe('HottakesService', () => {
  let service: HottakesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HottakesService],
    }).compile();

    service = module.get<HottakesService>(HottakesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
