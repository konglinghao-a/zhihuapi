const mongoose = require('mongoose');

const { Schema, model } = mongoose;

// 使用Schema类就能生成各种各样的Schema
const userSchema = new Schema({
  __v: { type: Number, select: false },
  name: { type: String, required: true },
  // select 设置成false，这样返回用户列表的时候就不会显示密码字段
  password: { type: String, require: true, select: false },
  // 接下来就是个人资料的schema设计
  // 头像：
  avatar_url: { type: String },
  /**
   * 性别：
   * 用enum将type设置成可枚举的类型, default可以选择默认值
   */
  gender: {
    type: String,
    enum: ['male', 'female'],
    default: 'male',
    required: true,
  },
  // 一句话介绍：
  headline: { type: String },
  /**
   * 居住地
   * 下面是mongoose里面字符串数组的写法
   */
  locations: {
    type: [{ type: Schema.Types.ObjectId, ref: 'Topic' }],
    select: false,
  },
  // 所在行业：
  business: { type: Schema.Types.ObjectId, ref: 'Topic', select: false },
  // 职业经历：
  employments: {
    type: [
      {
        company: { type: Schema.Types.ObjectId, ref: 'Topic' },
        job: { type: Schema.Types.ObjectId, ref: 'Topic' },
      },
    ],
    select: false,
  },
  // 教育经历
  educations: {
    type: [
      {
        school: { type: Schema.Types.ObjectId, ref: 'Topic' },
        major: { type: Schema.Types.ObjectId, ref: 'Topic' },
        diploma: { type: Number, enum: [1, 2, 3, 4, 5] },
        entrace_year: { type: Number },
        graduation_year: { type: Number },
      },
    ],
    select: false,
  },
  // 关注的用户
  following: {
    /**
     * 我们期望存入一个用户id，这个时候我们需要使用特殊类型，
     * 这个特殊类型需要有schema；这是一个引用，将User与id
     * 关联起来，这样就可以通过id去查询别的用户
     */
    type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    select: false,
  },

  // 关注的话题
  followingTopics: {
    type: [{ type: Schema.Types.ObjectId, ref: 'Topic' }],
    select: false,
  },

  // 点赞的答案
  likingAnswers: {
    type: [{ type: Schema.Types.ObjectId, ref: 'Answer' }],
    select: false,
  },

  // 踩过的答案
  dislikingAnswers: {
    type: [{ type: Schema.Types.ObjectId, ref: 'Answer' }],
    select: false,
  },

  // 收藏的答案
  collectingAnswers: {
    type: [{ type: Schema.Types.ObjectId, ref: 'Answer' }],
    select: false,
  },
});

// 生成模型；第一个参数会成为mongodb集合的名称；一个用户列表，就是一个集合的概念
module.exports = model('User', userSchema);
