import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

// Sub-document schema for product reviews
@Schema()
class Review {
  @Prop({ required: true })
  user: string;

  @Prop({ required: true })
  rating: number;

  @Prop({ required: true })
  comment: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

const ReviewSchema = SchemaFactory.createForClass(Review);

@Schema()
class Attribute {
  @Prop({ required: true })
  key: string; // e.g., 'Color', 'Size'

  @Prop({ required: true })
  value: string; // e.g., 'Red', 'Medium'
}

const AttributeSchema = SchemaFactory.createForClass(Attribute);

@Schema()
export class Product extends Document {
  @Prop({ required: true, index: 'text' })
  name: string;

  @Prop({ index: 'text' })
  description: string;

  @Prop({ required: true })
  brand: string;

  @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'Category' }])
  categories: MongooseSchema.Types.ObjectId[];

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  sku: string;

  @Prop()
  images: string[];
  @Prop({ type: [AttributeSchema], default: [] })
  attributes: Attribute[];
  @Prop({ required: true, default: 0 })
  stock: number;

  @Prop({ type: [ReviewSchema], default: [] })
  reviews: Review[];

  @Prop({ default: 0 })
  averageRating: number;

  @Prop({ default: 0 })
  numOfReviews: number;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Pre-save middleware to update timestamps
ProductSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});
