import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { HottakesService } from './hottakes.service';
import { CreateHottakeDto, PostHottakeDto } from './dto/create-hottake.dto';
import { BaseResponseTypeDTO } from 'src/utils';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FILTERS, REACTIONS } from './entities/hottake.entity';

@ApiTags('Hottakes')
@Controller('hottakes')
export class HottakesController {
  constructor(private readonly hottakesService: HottakesService) {}

  @Post()
  @ApiOperation({ summary: 'Add Hot Take' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Hot Take Added' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async createHotTakes(
    @Body() payload: CreateHottakeDto,
  ): Promise<BaseResponseTypeDTO> {
    const result = await this.hottakesService.createHottakes(payload);
    return result;
  }

  @Post('user/post')
  @ApiOperation({ summary: 'User Post a Hot Take' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'User Posted a Hot Take' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async PostHotTakes(
    @Body() payload: PostHottakeDto,
  ): Promise<BaseResponseTypeDTO> {
    const result = await this.hottakesService.postHottakes(payload);
    return result;
  }

  @Get('user/:username')
  @ApiOperation({ summary: 'Fetch all Hot Takes by username' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Hot Takes fetched ',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    enum: FILTERS,
    description: 'Filters (optional)',
  })
  async findAllByUser(
    @Param('username') username: string,
    @Query('filter') filter?: FILTERS,
  ) {
    const result = await this.hottakesService.getTakesForUser(username, filter);
    return result;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch a hot take' })
  @ApiResponse({ status: HttpStatus.OK, description: 'hot take fetched' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async findOne(@Param('id') id: string) {
    const result = await this.hottakesService.getSingleTake(id);
    return result;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'React to takes' })
  @ApiResponse({ status: HttpStatus.OK, description: 'React to takes' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  @ApiQuery({
    name: 'reactions',
    required: false,
    enum: REACTIONS,
    description: 'Query by reactions (optional)',
  })
  async reactToHotTake(
    @Param('id') id: string,
    @Query('reactions') reactions?: REACTIONS,
  ): Promise<BaseResponseTypeDTO> {
    const result = await this.hottakesService.reactToHotTake(id, reactions);
    return result;
  }

  @Get()
  @ApiOperation({ summary: 'Fetch all Hot Takes' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Hot Takes fetched ',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  @ApiQuery({
    name: 'filter',
    required: false,
    enum: FILTERS,
    description: 'Filters (optional)',
  })
  async getAllTakes(
    @Query('filter') filter?: FILTERS,
  ): Promise<BaseResponseTypeDTO> {
    const result = await this.hottakesService.getAllTakes(filter);
    return result;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a hot take' })
  @ApiResponse({ status: HttpStatus.OK, description: 'hot take Deleted' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async deleteTake(@Param('id') id: string) {
    const result = await this.hottakesService.deleteTake(id);
    return result;
  }
}
