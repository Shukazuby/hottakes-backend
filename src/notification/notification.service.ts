import { BadRequestException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { BaseResponseTypeDTO } from 'src/utils';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/users/entities/user.entity';
import { Notifications } from './entities/notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notifications.name)
    private readonly notificationModel: Model<Notifications>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async createNotifiction(dto: CreateNotificationDto): Promise<BaseResponseTypeDTO> {
    const username = dto.username.toLowerCase();
    const receipiantUsername = dto.recipientUsername.toLowerCase();

    let sender = 'anonymous';
    const senderUser = await this.userModel.findOne({ username });
    if (senderUser) {
      sender = senderUser.username;
    }

    const receipiant = await this.userModel.findOne({
      username: receipiantUsername,
    });
    if (!receipiant) {
      throw new BadRequestException('Receipient does not exist');
    }

    const notification = new this.notificationModel({
      ...dto,
      senderId: senderUser._id,
      receiverId: receipiant._id,
    });

    await notification.save();

    return {
      data: notification,
      success: true,
      code: HttpStatus.CREATED,
      message: 'Notification created',
    };
  }

  async findAll(username: string): Promise<BaseResponseTypeDTO> {
    username = username.toLowerCase();

    const user = await this.userModel.findOne({ username });
    if (!user) {
      throw new BadRequestException('user not found');
    }

    const notification = await this.notificationModel.find({
      receiverId: user._id,
    }).sort({createdAt: -1});
    if (!notification || notification.length < 0) {
      return {
        totalCount: notification.length,
        success: true,
        code: HttpStatus.OK,
        message: 'No notification found',
      };
    }

    return {
      totalCount: notification.length,
      data: notification,
      success: true,
      code: HttpStatus.OK,
      message: 'Notifications Found',
    };
  }

  async findOne(id: string): Promise<BaseResponseTypeDTO> {
    const notification = await this.notificationModel.findById(id);
    if (!notification) {
      throw new NotFoundException('notification not found');
    }

    notification.isRead = true;
    await notification.save();
    return {
      data: notification,
      success: true,
      code: HttpStatus.OK,
      message: 'Notification Found',
    };
  }


  async remove(id: string): Promise<BaseResponseTypeDTO> {
    const notification = await this.notificationModel.findById(id);
    if (!notification) {
      throw new NotFoundException('notification not found');
    }
    await notification.deleteOne();
    return {
      success: true,
      code: HttpStatus.OK,
      message: 'Notification Deleted',
    };
  }
}
