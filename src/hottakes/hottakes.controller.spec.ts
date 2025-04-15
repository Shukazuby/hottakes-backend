import { Test, TestingModule } from '@nestjs/testing';
import { HottakesController } from './hottakes.controller';
import { HottakesService } from './hottakes.service';

describe('HottakesController', () => {
  let controller: HottakesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HottakesController],
      providers: [HottakesService],
    }).compile();

    controller = module.get<HottakesController>(HottakesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
