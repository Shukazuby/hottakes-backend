import { PartialType } from '@nestjs/swagger';
import { CreateHottakeDto } from './create-hottake.dto';

export class UpdateHottakeDto extends PartialType(CreateHottakeDto) {}
