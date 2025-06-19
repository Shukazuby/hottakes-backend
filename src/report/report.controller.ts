import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
} from '@nestjs/common';
import { ReportService } from './report.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Report')
@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get(':username/:takeId')
  @ApiOperation({ summary: 'Report a take' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Take Reported' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async reportATake(@Param('username') username: string, @Param('takeId') takeId: string) {
    const result = await this.reportService.reportATake(username, takeId);
    return result;
  }

}
