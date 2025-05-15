import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CronWork } from './cron';
import { User, UserSchema } from 'src/users/entities/user.entity';
import { UsersModule } from 'src/users/users.module';
import { Notifications, NotificationsSchema } from 'src/notification/entities/notification.entity';
import { NotificationModule } from 'src/notification/notification.module';
@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    forwardRef(() => UsersModule),
    MongooseModule.forFeature([{ name: Notifications.name, schema: NotificationsSchema }]),
    forwardRef(() => NotificationModule),
  ],
  providers: [CronWork],
  exports: [CronWork],
})
export class CronWorkModule {}
