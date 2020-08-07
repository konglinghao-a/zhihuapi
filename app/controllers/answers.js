const Answer = require('../models/answers');

class AnswerCtl {
  // 查找全部答案
  async find(ctx) {
    const perPage = ctx.query.per_page
      ? Math.max(ctx.query.per_page * 1, 1)
      : 10;
    const page = ctx.query.page ? Math.max(ctx.query.page * 1, 1) - 1 : 0;
    const q = new RegExp(ctx.query.q);
    ctx.body = await Answer.find({
      content: q,
      questionId: ctx.params.questionId,
    })
      .limit(perPage)
      .skip(page * perPage);
  }
  // 判断答案是否存在
  async checkAnswerExist(ctx, next) {
    const answer = await Answer.findById(ctx.params.id).select('+answerer');
    // 答案除了检测存不存在以外，还要检测是否在这个问题下面
    if (!answer) {
      ctx.throw(404, '答案不存在');
    }
    // 只有在删改查答案的时候才检查此逻辑，赞和踩答案的时候不检查
    if (
      ctx.params.questionId &&
      answer.questionId.toString() !== ctx.params.questionId
    ) {
      ctx.throw(404, '该问题下无此答案');
    }
    // 这个地方把结果储存起来，这样后面update的时候就不用再找一次了。
    ctx.state.answer = answer;
    await next();
  }
  // 查找特定答案
  async findById(ctx) {
    const { fields } = ctx.query;
    const selectFields = fields
      ? fields
          .split(';')
          .filter((f) => f)
          .map((f) => ' +' + f)
          .join('')
      : '';
    const answer = await Answer.findById(ctx.params.id)
      .select(selectFields)
      .populate('answerer');
    ctx.body = answer;
  }

  // 创建答案
  async create(ctx) {
    ctx.verifyParams({
      content: { type: 'string', required: true },
    });
    const answer = await new Answer({
      ...ctx.request.body,
      answerer: ctx.state.user._id,
      questionId: ctx.params.questionId,
    }).save();
    ctx.body = answer;
  }

  // 检查回答者
  async checkAnswerer(ctx, next) {
    const { answer } = ctx.state;
    if (answer.answerer.toString() !== ctx.state.user._id) {
      ctx.throw(403, '没有权限');
    }
    await next();
  }
  // 修改答案
  async update(ctx) {
    ctx.verifyParams({
      content: { type: 'string', required: true },
    });
    await ctx.state.answer.update(ctx.request.body);
    ctx.body = ctx.state.answer;
  }
  // 删除问题
  async delete(ctx) {
    await Answer.findByIdAndRemove(ctx.params.id);
    ctx.status = 204;
  }
}

module.exports = new AnswerCtl();
