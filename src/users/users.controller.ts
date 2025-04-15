import { Controller, Post, Body, HttpStatus, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BaseResponseTypeDTO } from 'src/utils';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a User' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User created',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async createUser(
    @Body() payload: CreateUserDto,
  ): Promise<BaseResponseTypeDTO> {
    const result = await this.usersService.createUser(payload);
    return result;
  }

  @Get(':username/share')
  @ApiOperation({ summary: 'Share Profile' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Share Profile' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  getShareUrls(@Param('username') username: string) {
    return this.usersService.getShareUrls(username);
  }

    @Get()
    @ApiOperation({ summary: 'Fetch all Users' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Users fetched ',
    })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
    async getAllTakes(
    ): Promise<BaseResponseTypeDTO> {
      const result = await this.usersService.findAllUsers();
      return result;
    }
  
}
