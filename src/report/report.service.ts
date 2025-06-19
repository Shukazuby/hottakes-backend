import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Report } from './entities/report.entity';
import { Model } from 'mongoose';
import { HotTake } from 'src/hottakes/entities/hottake.entity';
import { BaseResponseTypeDTO } from 'src/utils';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class ReportService {
  constructor(
    @InjectModel(Report.name)
    private readonly reportModel: Model<Report>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(HotTake.name) private readonly hotModel: Model<HotTake>,
  ) {}

  async reportATake(
    name: string,
    takeId: string,
  ): Promise<BaseResponseTypeDTO> {
    const user = await this.userModel.findOne({ username: name });
    if (!user) {
      throw new NotFoundException('notification not found');
    }

    const hottake = await this.hotModel.findById(takeId);
    if (!hottake) {
      throw new NotFoundException('Hottake not found');
    }

    const reported = await this.reportModel.findOne({
      reporter: user._id,
      takeId: hottake._id,
    });
    if (reported) {
      throw new NotFoundException('Take already reported by you');
    }

    const report = new this.reportModel({
      reporter: user?._id,
      takeId: hottake._id,
      content: hottake.content,
      takeSender: hottake?.sender ?? 'anonymous',
    });
    await report.save();
    return {
      data: report,
      success: true,
      code: HttpStatus.OK,
      message: 'Take Reported',
    };
  }

  create(createReportDto: CreateReportDto) {
    return 'This action adds a new report';
  }

  findAll() {
    return `This action returns all report`;
  }

  findOne(id: number) {
    return `This action returns a #${id} report`;
  }

  update(id: number, updateReportDto: UpdateReportDto) {
    return `This action updates a #${id} report`;
  }

  remove(id: number) {
    return `This action removes a #${id} report`;
  }
}
