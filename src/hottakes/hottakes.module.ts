import { forwardRef, Module } from '@nestjs/common';
import { HottakesService } from './hottakes.service';
import { HottakesController } from './hottakes.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { HotTake, HotTakeSchema } from './entities/hottake.entity';
import { User, UserSchema } from 'src/users/entities/user.entity';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: HotTake.name, schema: HotTakeSchema }]),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    forwardRef(() => UsersModule),

  ],

  controllers: [HottakesController],
  providers: [HottakesService],
  exports: [HottakesService],
})
export class HottakesModule {}
