const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const commmentSchema = new Schema(
  {
    __v: { type: Number, select: false },
    // 评论内容
    content: { type: String, required: true },
    // 评论者
    commentator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      select: false,
    },
    questionId: { type: String, required: true },
    // 记录回答id
    answerId: { type: String, required: true },
    // 根评论的id；非必选，因为一级评论没有这个属性
    rootCommentId: { type: String },
    // 回复给哪个用户；非必选，但是是一个引用
    replyTo: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = model('Comment', commmentSchema);
