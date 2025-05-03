import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export class ContentObj {
  @Prop({ ref: 'HotTake' })
  hottakeId?: string;

  @Prop()
  reaction?: string;
}

@Schema({ timestamps: true })
export class Notifications {
  @Prop()
  username: string;

  @Prop()
  receipiantUsername: string;

  @Prop()
  content: ContentObj;

  @Prop()
  title: string;

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ ref: 'User' })
  receiverId: string;

  @Prop({ ref: 'User' })
  senderId: string;
}

export type NotificationsDocument = Notifications & Document;
export const NotificationsSchema = SchemaFactory.createForClass(Notifications);
