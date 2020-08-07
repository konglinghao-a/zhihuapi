const Comment = require('../models/comments');

class CommentCtl {
  // 查找全部评论
  // 查找二级评论的时候希望跟查找一级评论公用一个接口
  async find(ctx) {
    const perPage = ctx.query.per_page
      ? Math.max(ctx.query.per_page * 1, 1)
      : 10;
    const page = ctx.query.page ? Math.max(ctx.query.page * 1, 1) - 1 : 0;
    const q = new RegExp(ctx.query.q);
    // 查找的时候需要questionId和answerId
    const { questionId, answerId } = ctx.params;
    // 我们将可选参数都放到queryString上；如果有这个id，那么就将这个id放到查询的条件上
    const { rootCommentId } = ctx.query;
    // 查找到评论的时候我们需要具体的评论人的信息，因此用populate来填充
    ctx.body = await Comment.find({
      content: q,
      questionId,
      answerId,
      rootCommentId,
    })
      .limit(perPage)
      .skip(page * perPage)
      .populate('commentator replyTo');
  }
  // 判断评论是否存在
  async checkCommentExist(ctx, next) {
    const comment = await Comment.findById(ctx.params.id).select(
      '+commentator'
    );
    // 答案除了检测存不存在以外，还要检测是否在这个问题下面
    if (!comment) {
      ctx.throw(404, '评论不存在');
    }
    // 只有在删改查答案的时候才检查此逻辑，赞和踩答案的时候不检查
    if (
      ctx.params.questionId &&
      comment.questionId.toString() !== ctx.params.questionId
    ) {
      ctx.throw(404, '该问题下无此评论');
    }
    // 因为是三级嵌套，因此我们还有答案id
    if (
      ctx.params.answerId &&
      comment.answerId.toString() !== ctx.params.answerId
    ) {
      ctx.throw(404, '该答案下无此评论');
    }
    // 这个地方把结果储存起来，这样后面update的时候就不用再找一次了。
    ctx.state.comment = comment;
    await next();
  }
  // 查找特定评论
  async findById(ctx) {
    const { fields } = ctx.query;
    const selectFields = fields
      ? fields
          .split(';')
          .filter((f) => f)
          .map((f) => ' +' + f)
          .join('')
      : '';
    const comment = await Comment.findById(ctx.params.id)
      .select(selectFields)
      .populate('commentator');
    ctx.body = comment;
  }

  // 创建评论
  // 在创建评论的时候也希望使得一级评论和二级评论公用一个接口
  async create(ctx) {
    ctx.verifyParams({
      content: { type: 'string', required: true },
      // 如果你想添加的是二级评论，那就再多加下面这两个字段
      rootCommentId: { type: 'string', required: false },
      replyTo: { type: 'string', required: false },
    });
    const comment = await new Comment({
      ...ctx.request.body,
      commentator: ctx.state.user._id,
      questionId: ctx.params.questionId,
      answerId: ctx.params.answerId,
    }).save();
    ctx.body = comment;
  }

  // 检查评论者
  async checkCommentator(ctx, next) {
    const { comment } = ctx.state;
    if (comment.commentator.toString() !== ctx.state.user._id) {
      ctx.throw(403, '没有权限');
    }
    await next();
  }
  // 修改评论
  // 我们不能再无脑放入body，因为用户不能随意修改二级评论对应的一级评论
  async update(ctx) {
    ctx.verifyParams({
      content: { type: 'string', required: true },
    });
    // 限制二级评论的一级评论（也就是只更新content就行了）
    const { content } = ctx.request.body;
    await ctx.state.comment.update({ content });
    ctx.body = ctx.state.comment;
  }
  // 删除评论
  async delete(ctx) {
    await Comment.findByIdAndRemove(ctx.params.id);
    ctx.status = 204;
  }
}

module.exports = new CommentCtl();
