const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const questionSchema = new Schema(
  {
    __v: { type: Number, select: false },
    // 问题标题
    title: { type: String, required: true },
    // 问题描述
    description: { type: String },
    // 提问者（每个问题只能有一个提问者）
    questioner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      select: false,
    },
    // 在问题里面设计话题
    topics: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Topic' }],
      select: false,
    },
  },
  { timestamps: true }
);

module.exports = model('Question', questionSchema);
