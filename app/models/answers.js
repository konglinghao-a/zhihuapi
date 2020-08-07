const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const answerSchema = new Schema(
  {
    __v: { type: Number, select: false },
    // 答案内容
    content: { type: String, required: true },
    // 回答者
    answerer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      select: false,
    },
    questionId: { type: String, required: true },
    voteCount: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

module.exports = model('Answer', answerSchema);
