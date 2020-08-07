const Question = require('../models/questions');

class QuestionCtl {
  // 查找全部问题
  async find(ctx) {
    const perPage = ctx.query.per_page
      ? Math.max(ctx.query.per_page * 1, 1)
      : 10;
    const page = ctx.query.page ? Math.max(ctx.query.page * 1, 1) - 1 : 0;
    const q = new RegExp(ctx.query.q);
    ctx.body = await Question.find({ $or: [{ title: q }, { description: q }] })
      .limit(perPage)
      .skip(page * perPage);
  }
  // 查找特定问题
  async findById(ctx) {
    const { fields } = ctx.query;
    const selectFields = fields
      ? fields
          .split(';')
          .filter((f) => f)
          .map((f) => ' +' + f)
          .join('')
      : '';
    const question = await Question.findById(ctx.params.id)
      .select(selectFields)
      .populate('questioner topics');
    ctx.body = question;
  }
  // 判断问题是否存在
  async checkQuestionExist(ctx, next) {
    const question = await Question.findById(ctx.params.id).select(
      '+questioner'
    );
    if (!question) {
      ctx.throw(404, '问题不存在');
    }
    // 这个地方把结果储存起来，这样后面update的时候就不用再找一次了。
    ctx.state.question = question;
    await next();
  }
  // 创建问题
  async create(ctx) {
    ctx.verifyParams({
      title: { type: 'string', required: true },
      description: { type: 'string', required: false },
    });
    const question = await new Question({
      ...ctx.request.body,
      questioner: ctx.state.user._id,
    }).save();
    // 根据restful api最佳实践，新增的实体返回到客户端
    ctx.body = question;
  }
  /**
   * 此处会存在一个问题，我们提出的问题可能被别人修改了
   * 因此再写一个中间件，判断修改的用户是否是当前登录的用户
   */
  async checkQuestioner(ctx, next) {
    const { question } = ctx.state;
    if (question.questioner.toString() !== ctx.state.user._id) {
      ctx.throw(403, '没有权限');
    }
    await next();
  }
  // 修改问题
  async update(ctx) {
    ctx.verifyParams({
      title: { type: 'string', required: true },
      description: { type: 'string', required: false },
    });
    await ctx.state.question.update(ctx.request.body);
    ctx.body = ctx.state.question;
  }
  // 删除问题
  async delete(ctx) {
    await Question.findByIdAndRemove(ctx.params.id);
    ctx.status = 204;
  }
}

module.exports = new QuestionCtl();
