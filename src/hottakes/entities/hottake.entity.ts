import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum Category {
  ENTERTAINMENT = 'Entertainment',
  FOOD = 'Food',
  GAMING = 'Gaming',
  SOCIETY = 'Society',
  SPORT = 'Sport',
  POLITICS = 'politics',
}

export enum REACTIONS {
  SPICY = 'spicy',
  HOT = 'hot',
  MIDGAMING = 'mid',
  TRASH = 'trash',
  COLD = 'cold',
}

export enum FILTERS {
  NEWEST = 'newest',
  TRENDING = 'trending',
  CONTROVERSIAL = 'controversial',
}

@Schema({ timestamps: true })
export class HotTake {
  @Prop({ required: true })
  content: string;

  @Prop({ required: true, enum: Category })
  category: Category;

  @Prop({ default: 0 })
  hot: number;

  @Prop({ default: 0 })
  spicy: number;

  @Prop({ default: 0 })
  trash: number;

  @Prop({ default: 0 })
  mid: number;

  @Prop({ default: 0 })
  cold: number;

  @Prop({ default: false })
  isFlagged?: boolean;

  @Prop()
  sender?: string;

  @Prop()
  recipientUsername?: string; 
}

export type HotTakeDocument = HotTake & Document;
export const HotTakeSchema = SchemaFactory.createForClass(HotTake);
