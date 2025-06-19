import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class Report {
  @Prop({ ref: 'User' })
  reporter: string;

  @Prop()
  takeSender: string;

  @Prop({ ref: 'HotTake' })
  takeId: string;

  @Prop()
  content: string;

  @Prop()
  reportType?: string;
}

export type ReportDocument = Report & Document;
export const ReportSchema = SchemaFactory.createForClass(Report);
