import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import * as cron from 'node-cron';
import { NotificationService } from 'src/notification/notification.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class CronWork {
  constructor(
    private readonly usrSrv: UsersService,
    private readonly notSrv: NotificationService
  ) {
    this.scheduleJobs();
  }

  private scheduleJobs() {
    cron.schedule('* * * * *', async () => {
      console.log('🚀 Running scheduled job ...');
     await this.notSrv.sendInactivityNotification();
      console.log('created ...');
    });
  } 
}
