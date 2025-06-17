import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { BaseResponseTypeDTO, PaginationFilterDTO } from 'src/utils';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/users/entities/user.entity';
import { Notifications } from './entities/notification.entity';
import { sendPushNotification } from 'src/utils/utils.function';
import { HotTake } from 'src/hottakes/entities/hottake.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notifications.name)
    private readonly notificationModel: Model<Notifications>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(HotTake.name) private readonly hotModel: Model<HotTake>,
  ) {}

  async createNotifiction(
    dto: CreateNotificationDto,
  ): Promise<BaseResponseTypeDTO> {
    const senderUsername = dto?.username?.toLowerCase();
    const recipientUsername = dto?.recipientUsername?.toLowerCase();

    let sender = 'anonymous';
    const senderUser = await this.userModel.findOne({
      username: senderUsername,
    });

    if (senderUser) {
      sender = senderUser.username;
    }

    if (recipientUsername !== 'anonymous') {
      const recipient = await this.userModel.findOne({
        username: recipientUsername,
      });

      if (!recipient) {
        throw new BadRequestException('Recipient does not exist');
      }

      const notification = new this.notificationModel({
        recipientUsername,
        content: dto.content,
        senderId: senderUser?._id,
        receiverId: recipient._id,
        token: recipient.token,
        contentType: dto.contentType,
      });

      await notification.save();

      return {
        data: notification.content,
        success: true,
        code: HttpStatus.CREATED,
        message: 'Notification created',
      };
    }

    // throw new BadRequestException('Invalid recipient username');
  }

  async findAll(
    username: string,
    pagination?: PaginationFilterDTO,
  ): Promise<BaseResponseTypeDTO> {
    username = username.toLowerCase();

    const user = await this.userModel.findOne({ username });
    if (!user) {
      throw new BadRequestException('user not found');
    }

    const skip = (pagination.page - 1) * pagination.limit;

    const [notifications, totalCount] = await Promise.all([
      this.notificationModel
        .find({ receiverId: user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pagination.limit)
        .populate(['content.hottakeId']),
      this.notificationModel.countDocuments({ receiverId: user._id }),
    ]);

    return {
      totalCount,
      data: notifications,
      success: true,
      code: HttpStatus.OK,
      message: notifications.length
        ? 'Notifications Found'
        : 'No notification found',
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

// async sendInactivityNotification() {
//   try {
//     const users = await this.userModel.find();

//     const OneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
//     const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
//     const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
//     const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
//     const nineDaysAgo = new Date(Date.now() - 9 * 24 * 60 * 60 * 1000);
//     const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);

//     for (const user of users) {
//       const hotTake = await this.hotModel
//         .findOne({ sender: user.username })
//         .sort({ createdAt: -1 });

//       // If user has never posted, treat accordingly (e.g. consider all notifications valid)
//       const lastPostDate = hotTake ? hotTake.createdAt : new Date(0);

//       if (!user.isInactive1 && lastPostDate > OneDayAgo && lastPostDate < twoDaysAgo) {
//         const message = "The timeline’s too quiet without you. Drop that hot take 🔥👀";
//         await this.sendNotificationToUser(user, message, 'Where You At?');
//         user.isInactive1 = true;
//         await user.save();
//       } else if (!user.isInactive2 && lastPostDate > fourDaysAgo &&  lastPostDate < fiveDaysAgo) {
//         const message = "No hot takes, yet? Wow, groundbreaking silence.";
//         await this.sendNotificationToUser(user, message, 'Still Cooking?');
//         user.isInactive2 = true;
//         await user.save();
//       } else if (!user.isInactive3 && lastPostDate > nineDaysAgo &&  lastPostDate < tenDaysAgo) {
//         const message = "Been 10 days since your last hot take... just sayin";
//         await this.sendNotificationToUser(user, message, 'Your Feed Needs You');
//         user.isInactive3 = true;
//         await user.save();
//       }
//     }
//   } catch (ex) {
//     console.error('Error sending inactivity notifications:', ex);
//     throw ex;
//   }
// }


private async sendNotificationToUser(user: any, message: string, title: string) {
  const payload = {
    recipientUsername: user.username,
    content: {
      sender: 'Hot Takes App',
      takeContent: message,
      notificationType: 'general',
    },
    contentType: 'general',
    token: user.token,
    username: 'Hot Takes App',
  };

  await this.createNotifiction(payload);
  await sendPushNotification(message, user.token, title);
}

//validddddddddddd


// async sendInactivityNotification() {
//   try {
//     const users = await this.userModel.find();

//     const now = Date.now();
//     const oneDayAgo = new Date(now - 1 * 24 * 60 * 60 * 1000);
//     const twoDaysAgo = new Date(now - 2 * 24 * 60 * 60 * 1000);
//     const fourDaysAgo = new Date(now - 4 * 24 * 60 * 60 * 1000);
//     const fiveDaysAgo = new Date(now - 5 * 24 * 60 * 60 * 1000);
//     const nineDaysAgo = new Date(now - 9 * 24 * 60 * 60 * 1000);
//     const tenDaysAgo = new Date(now - 10 * 24 * 60 * 60 * 1000);

//     for (const user of users) {
//       const latestHotTake = await this.hotModel
//         .findOne({ sender: user.username })
//         .sort({ createdAt: -1 });

//       const lastPostDate = latestHotTake ? latestHotTake.createdAt : new Date(0);

//       // Inactivity 1: Between 2 and 1 days ago
//       if (!user.isInactive1 && lastPostDate <= twoDaysAgo && lastPostDate > oneDayAgo) {
//         await this.sendNotificationToUser(
//           user,
//           "The timeline’s too quiet without you. Drop that hot take 🔥👀",
//           "Where You At?"
//         );
//         user.isInactive1 = true;
//         await user.save();
//       }

//       // Inactivity 2: Between 5 and 4 days ago
//       else if (!user.isInactive2 && lastPostDate <= fiveDaysAgo && lastPostDate > fourDaysAgo) {
//         await this.sendNotificationToUser(
//           user,
//           "No hot takes, yet? Wow, groundbreaking silence.",
//           "Still Cooking?"
//         );
//         user.isInactive2 = true;
//         await user.save();
//       }

//       // Inactivity 3: Between 10 and 9 days ago
//       else if (!user.isInactive3 && lastPostDate <= tenDaysAgo && lastPostDate > nineDaysAgo) {
//         await this.sendNotificationToUser(
//           user,
//           "Been 10 days since your last hot take... just sayin",
//           "Your Feed Needs You"
//         );
//         user.isInactive3 = true;
//         await user.save();
//       }
//     }
//   } catch (error) {
//     console.error("Error sending inactivity notifications:", error);
//     throw error;
//   }
// }

}
