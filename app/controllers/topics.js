const Topic = require('../models/topics');
const User = require('../models/users');
const Question = require('../models/questions');

class TopicsCtl {
  // 获取话题列表
  async find(ctx) {
    // 从查询字符串中获取每页显示多少项，字符串要转换成数字
    const perPage = ctx.query.per_page
      ? Math.max(ctx.query.per_page * 1, 1)
      : 10;
    // 当前在第几页，减一到时候直接乘perPage就可以放到skip里面了。
    const page = ctx.query.page ? Math.max(ctx.query.page * 1, 1) - 1 : 0;
    // 模糊搜索，就是加了个正则表达式
    ctx.body = await Topic.find({ name: new RegExp(ctx.query.q) })
      .limit(perPage)
      .skip(page * perPage);
  }
  // 查询特定话题
  async findById(ctx) {
    // 过滤字段的逻辑
    const { fields } = ctx.query;
    const selectFields = fields
      ? fields
          .split(';')
          .filter((f) => f)
          .map((f) => ' +' + f)
          .join('')
      : '';
    const topic = await Topic.findById(ctx.params.id).select(selectFields);
    ctx.body = topic;
  }
  // 判断话题是否存在
  async checkTopicExist(ctx, next) {
    const topic = await Topic.findById(ctx.params.id);
    if (!topic) {
      ctx.throw(404, '话题不存在');
    }
    await next();
  }
  // 创建话题
  async create(ctx) {
    // 创建话题有请求体了，因此要校验一下请求体
    ctx.verifyParams({
      name: { type: 'string', required: true },
      avatar_url: { type: 'string', required: false },
      introduction: { type: 'string', required: false },
    });
    const topic = await new Topic(ctx.request.body).save();
    // 根据restful api最佳实践，新增的实体返回到客户端
    ctx.body = topic;
  }
  // 修改话题
  async update(ctx) {
    ctx.verifyParams({
      name: { type: 'string', required: false },
      avatar_url: { type: 'string', required: false },
      introduction: { type: 'string', required: false },
    });
    const topic = await Topic.findByIdAndUpdate(
      ctx.params.id,
      ctx.request.body
    );
    ctx.body = topic;
  }
  // 获取这个话题的粉丝
  async listTopicFollowers(ctx) {
    const users = await User.find({ followingTopics: ctx.params.id });
    ctx.body = users;
  }

  // 获取话题的问题列表
  async listQuestions(ctx) {
    const questions = await Question.find({ topics: ctx.params.id });
    ctx.body = questions;
  }
}

module.exports = new TopicsCtl();
