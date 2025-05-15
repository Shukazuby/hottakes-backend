import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Notifications, NotificationsSchema } from './entities/notification.entity';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { UsersModule } from 'src/users/users.module';
import { User, UserSchema } from 'src/users/entities/user.entity';
import { HotTake, HotTakeSchema } from 'src/hottakes/entities/hottake.entity';
import { HottakesModule } from 'src/hottakes/hottakes.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Notifications.name, schema: NotificationsSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    forwardRef(() => UsersModule),
    MongooseModule.forFeature([{ name: HotTake.name, schema: HotTakeSchema }]),
    forwardRef(() => HottakesModule),

  ],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
