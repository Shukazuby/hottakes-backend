import { BadRequestException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateUserDto,
  LoginDto,
  UpdateUsernameDto,
} from './dto/create-user.dto';
import { BaseResponseTypeDTO } from 'src/utils';
import { User } from './entities/user.entity';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { sendPushNotification } from 'src/utils/utils.function';
import { NotificationService } from 'src/notification/notification.service';
import * as crypto from 'crypto';
@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly notiSrv: NotificationService,
  ) {}

  async loginWithThirdParty(dto: LoginDto): Promise<BaseResponseTypeDTO> {
    const email = dto.email.toLowerCase();
    let user = await this.userModel.findOne({ email });
    if (!user) {
      user = new this.userModel({
        email,
      });
      await user.save();
    }

    let token = dto?.token?.trim();
    if (!token) {
      token = user.token;
    }
    user.token = token;

    await user.save();
    const payload = {
      recipientUsername: user.username,
      content: {
        sender: 'Hot Takes App',
        takeContent:
          'Welcome To Hot Takes! Start sharing your opinions anonymously.',
        notificationType: 'general',
      },
      contentType: 'general',
      token: user.token,
      username: 'Hot Takes App',
    };
    if (!user.isWelcomeNotified && user.token) {
      await this.notiSrv.createNotifiction(payload);
      await sendPushNotification(
        'Welcome To Hot Takes! Start sharing your opinions anonymously.',
        payload.token,
        'Welcome',
      );

      user.isWelcomeNotified = true;
    }
    await user.save();

    return {
      data: user,
      success: true,
      code: HttpStatus.CREATED,
      message: 'User Signed In',
    };
  }

  async createUser(dto: CreateUserDto): Promise<BaseResponseTypeDTO> {
    const username = dto.username.toLowerCase();
    const existingUser = await this.userModel.findOne({ email: dto.email });

    if (!existingUser) {
      throw new NotFoundException('Email does not exist');
    }

    // Check for username conflict
    await this.findByUsername(username);

    existingUser.username = username;
    await existingUser.save();
    const profileLink = await this.generateProfileUrl(username);
    existingUser.user_link = profileLink.profileUrl;
    existingUser.hashedUsername = profileLink.hashedUsername;
    await existingUser.save();
    const socials = await this.getShareUrls(username);
    existingUser.whatsappShare = socials.whatsappShareUrl;
    existingUser.twitterShare = socials.twitterShareUrl;
    const updatedUser = await existingUser.save();

    return {
      data: updatedUser,
      success: true,
      code: HttpStatus.OK,
      message: 'User updated with new username and links',
    };
  }

  async findByUsername(name: string) {
    try {
      const user = await this.userModel.findOne({ username: name });
      if (user) {
        throw new NotFoundException(`Username already exist.`);
      }
    } catch (ex) {
      throw ex;
    }
  }

  async findAllUsers(): Promise<BaseResponseTypeDTO> {
    try {
      const user = await this.userModel.find().sort({ createdAt: -1 });
      if (!user) {
        return {
          data: [],
          success: true,
          code: HttpStatus.OK,
          message: 'No User Found',
        };
      }
      return {
        totalCount: user.length,
        data: user,
        success: true,
        code: HttpStatus.OK,
        message: 'Users fetched',
      };
    } catch (ex) {
      throw ex;
    }
  }

  // generateProfileUrl(username: string): string {
  //   const baseUrl = process.env.APP_BASE_URL;
  //   return `${baseUrl}/profile/${encodeURIComponent(username.toLowerCase())}`;
  // }

    generateProfileUrl(username: string) {
    const baseUrl = process.env.APP_BASE_URL;
    const fullHash = crypto
      .createHash('md5')
      .update(username.toLowerCase())
      .digest('hex'); 

    const lettersOnly = fullHash.replace(/[0-9]/g, '');
    const hash = lettersOnly.slice(0, 8).padEnd(8, 'x');

    return {
      profileUrl: `${baseUrl}/profile/${hash}`,
      hashedUsername: hash,
    };
  }

  async getShareUrls(name: string) {
    const username = name.toLowerCase();
    const user = await this.userModel.findOne({ username });
    if (!user) throw new NotFoundException(`User not found.`);

    const profileUrl = user.user_link;

    const whatsappMessage = `Send me an anonymous hot take: ${profileUrl}`;
    const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

    const tweetText = `Send me your hottest anonymous takes!`;
    const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(profileUrl)}`;

    return {
      profileUrl,
      whatsappShareUrl,
      twitterShareUrl,
    };
  }

  async updateUsername(dto: UpdateUsernameDto): Promise<BaseResponseTypeDTO> {
    const newU = dto.newUsername.toLowerCase();
    try {
      const user = await this.userModel.findOne({
        username: dto.current.toLowerCase(),
      });
      if (!user) {
        throw new NotFoundException(`Current username does not exist.`);
      }
      await this.findByUsername(newU);
      user.username = newU;
      const profileLink = await this.generateProfileUrl(newU);
      user.user_link = profileLink.profileUrl;
      user.hashedUsername = profileLink.hashedUsername;
      await user.save();
      const socials = await this.getShareUrls(newU);
      user.whatsappShare = socials.whatsappShareUrl;
      user.twitterShare = socials.twitterShareUrl;

      await user.save();

      return {
        data: user,
        success: true,
        code: HttpStatus.OK,
        message: 'User name updated ',
      };
    } catch (ex) {
      throw ex;
    }
  }

  async sendGeneralNotification() {
    try {
      const users = await this.userModel.find();

      for (const user of users) {
        // user.isWelcomeNotified = false
        //   await user.save()
        // Only notify if not already notified and token exists
        if (!user.isWelcomeNotified && user.token) {
          const payload = {
            recipientUsername: user.username,
            content: {
              sender: 'Hot Takes App',
              takeContent:
                'Welcome To Hot Takes! Start sharing your opinions anonymously.',
              notificationType: 'general',
            },
            contentType: 'general',
            token: user.token,
            username: 'Hot Takes App',
          };

          await this.notiSrv.createNotifiction(payload);

          await sendPushNotification(
            'Welcome To Hot Takes! Start sharing your opinions anonymously.',
            payload.token,
            'Welcome',
          );

          user.isWelcomeNotified = true;
          await user.save();
        }
      }
    } catch (ex) {
      // It's better to log errors for debugging
      console.error('Error sending general notifications:', ex);
      throw ex;
    }
  }

  async deleteUser(id: string): Promise<BaseResponseTypeDTO> {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('Hot Take user not found');
    await user.deleteOne();
    return {
      success: true,
      code: HttpStatus.OK,
      message: 'user Deleted',
    };
  }

async blockUser(blockerUsername: string, blockedUsername: string): Promise<BaseResponseTypeDTO> {
  const blocker = await this.userModel.findOne({ username: blockerUsername.toLowerCase() });
  if (!blocker) throw new NotFoundException('Requesting user not found');

  const userToBlock = await this.userModel.findOne({ username: blockedUsername.toLowerCase() });
  if (!userToBlock) throw new NotFoundException('User to block not found');

  const isAlreadyBlocked = blocker.blockedUsers?.includes(userToBlock.username);

  if (isAlreadyBlocked) {
    throw new BadRequestException('User already blocked');
  }

  blocker.blockedUsers.push(userToBlock.username);
  await blocker.save();

  return {
    success: true,
    code: HttpStatus.OK,
    message: 'User blocked successfully',
  };
}

 async deleteUsersBeforeDate(): Promise<{ deletedCount: number }> {
    const cutoffDate = new Date('2025-06-16T00:00:00.000Z');

    const result = await this.userModel.deleteMany({
      createdAt: { $lt: cutoffDate },
    });

    return { deletedCount: result.deletedCount };
  }

}
