import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { HottakesModule } from './hottakes/hottakes.module';
import * as dotenv from 'dotenv';
import { TokenModule } from './token/token.module';
import { CronWork, HottakesService } from './hottakes/hottakes.service';
dotenv.config();

  @Module({
    imports: [
      MongooseModule.forRoot(String(process.env.MONGODB_URL).trim()),
      UsersModule,
      HottakesModule,
      TokenModule,
    ],
  
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
