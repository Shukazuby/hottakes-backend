import { Controller } from '@nestjs/common';
import { TokenService } from './token.service';

@Controller('tokens')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}
}
