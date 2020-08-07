const jsonwebtoken = require('jsonwebtoken');
const User = require('../models/users');
const Question = require('../models/questions');
const Answer = require('../models/answers');
const { secret } = require('../config');

class UsersCtl {
  // 获取用户列表
  async find(ctx) {
    const perPage = ctx.query.per_page
      ? Math.max(ctx.query.per_page * 1, 1)
      : 10;
    const page = ctx.query.page ? Math.max(ctx.query.page * 1, 1) - 1 : 0;
    // mongoose查找全部
    ctx.body = await User.find({ name: new RegExp(ctx.query.q) })
      .limit(perPage)
      .skip(page * perPage);
  }
  // 获取指定用户
  async findById(ctx) {
    const { fields = '' } = ctx.query;
    const selectFiled = fields
      .split(';')
      .filter((f) => f)
      .map((f) => ' +' + f)
      .join('');

    const populateStr = fields
      .split(';')
      .filter((f) => f)
      .map((f) => {
        if (f === 'employments') {
          return 'employments.company employments.job';
        }
        if (f === 'educations') {
          return 'educations.school educations.major';
        }
        return f;
      })
      .join(' ');

    // mongoose查找id
    const user = await User.findById(ctx.params.id)
      .select(selectFiled)
      .populate(populateStr);
    if (!user) {
      ctx.throw(404, '用户不存在');
    }
    ctx.body = user;
  }
  // 创建用户
  async create(ctx) {
    ctx.verifyParams({
      name: { type: 'string', required: true }, // name字段为必选
      password: { type: 'string', require: true },
    });
    // 唯一性验证：查看用户名在数据库中是否已经存在
    const { name } = ctx.request.body;
    const repeatedUser = await User.findOne({ name });
    if (repeatedUser) {
      ctx.throw(409, '用户已存在'); // 409状态码代表冲突，也就是说已经存在了不能再创建用户了。
    }

    // mongoose新建一个文档对象
    const user = await new User(ctx.request.body).save();
    ctx.body = user;
  }

  // 检查是不是自己
  async checkOwner(ctx, next) {
    // 验证id就能判断是不是自己
    if (ctx.params.id !== ctx.state.user._id) {
      ctx.throw(403, '没有权限'); // 403错误就是授权错误（forbidden）
    }
    // 如果执行人是自己就执行接下来的逻辑
    await next();
  }

  // 更新用户
  async update(ctx) {
    ctx.verifyParams({
      name: { type: 'string', required: false }, // name字段为必选
      password: { type: 'string', required: false },
      avatar_url: { type: 'string', required: false },
      gender: { type: 'string', required: false },
      headline: { type: 'string', required: false },
      // 住址，是个数组类型，数组中的每一项是字符串类型
      locations: { type: 'array', itemType: 'string', required: false },
      business: { type: 'string', required: false },
      // itemType后面就不往下写了，不然会导致太臃肿。
      employments: { type: 'array', itemType: 'object', required: false },
      educations: { type: 'array', itemType: 'object', required: false },
    });
    // mongoose更新; 第一个参数为要传的id；第二个参数为要更新的对象
    const user = await User.findByIdAndUpdate(ctx.params.id, ctx.request.body);
    if (!user) {
      ctx.throw(404, '用户不存在');
    }
    ctx.body = user;
  }
  // 删除用户
  async delete(ctx) {
    const user = await User.findByIdAndRemove(ctx.params.id);
    if (!user) {
      ctx.throw(404, '用户存在');
    }
    ctx.status = 204;
  }

  // 登录的控制器
  async login(ctx) {
    // 校验请求体和密码格式
    ctx.verifyParams({
      name: { type: 'string', required: true },
      password: { type: 'string', required: true },
    });
    // 登陆失败的情况（用户名和密码不匹配）
    const user = await User.findOne(ctx.request.body);
    if (!user) {
      ctx.throw(401, '用户名或密码不正确');
    }
    // 登录成功的情况；生成token
    // 把不敏感的信息拿过来生成token
    const { _id, name } = user;
    // 第三个参数是个对象，可以过期时间
    const token = jsonwebtoken.sign({ _id, name }, secret, { expiresIn: '1d' });
    // 把token放到请求体里面返回给客户端
    ctx.body = { token };
  }

  /**
   * 获取关注者列表
   */
  async listFollowing(ctx) {
    /**
     * 根据id获取某个特定用户的关注者的id（following里面存得是id）,
     * 然后用populate去填充following，这样following就能拿到详细的用户的名单了
     */
    const user = await User.findById(ctx.params.id)
      .select('+following')
      .populate('following');

    if (!user) {
      ctx.throw(404, '用户不存在');
    }
    ctx.body = user.following;
  }
  /**
   * 检验用户是否存在
   */
  async checkUserExist(ctx, next) {
    const user = await User.findById(ctx.params.id);
    if (!user) {
      ctx.throw(404, '用户不存在');
    }
    await next();
  }

  /**
   * 关注某人
   */
  async follow(ctx) {
    // 拿到这个用户的关注者列表
    const me = await User.findById(ctx.state.user._id).select('+following');
    /**
     * 把点了关注的人添加到关注列表中,
     * 它的id并不是字符串类型，而是mongoose自带的一种类型，
     * 因此要将其转换成字符串，用map
     */
    if (!me.following.map((id) => id.toString()).includes(ctx.params.id)) {
      me.following.push(ctx.params.id);
      // 想要保存到数据库中还要使用save方法
      me.save();
    }
    ctx.status = 204; // 代表成功了但并没有数据返回
  }
  // 取消关注
  async unfollow(ctx) {
    const me = await User.findById(ctx.state.user._id).select('+following');
    // 找到要取消关注的人在数组中的索引
    const index = me.following
      .map((id) => id.toString())
      .indexOf(ctx.params.id);
    if (index > -1) {
      me.following.splice(index, 1);
      me.save();
    }
    ctx.status = 204; // 代表成功了但并没有数据返回
  }

  // 获取粉丝（获取用户列表）
  async listFollowers(ctx) {
    /**
     * 获取粉丝的用户（找这个粉丝的following包含这个人就行）;
     * 下面这个语法就是找到following包含传入id的用户
     */
    const users = await User.find({ following: ctx.params.id });
    ctx.body = users;
  }

  // 获取关注的话题
  async listFollowingTopics(ctx) {
    const user = await User.findById(ctx.params.id)
      .select('+followingTopics')
      .populate('followingTopics');

    if (!user) {
      ctx.throw(404, '用户不存在');
    }
    ctx.body = user.followingTopics;
  }

  // 关注话题
  async followTopics(ctx) {
    const me = await User.findById(ctx.state.user._id).select(
      '+followingTopics'
    );
    if (
      !me.followingTopics.map((id) => id.toString()).includes(ctx.params.id)
    ) {
      me.followingTopics.push(ctx.params.id);
      me.save();
    }
    ctx.status = 204;
  }
  // 取消关注话题
  async unfollowTopics(ctx) {
    const me = await User.findById(ctx.state.user._id).select(
      '+followingTopics'
    );
    // 找到要取消关注的人在数组中的索引
    const index = me.followingTopics
      .map((id) => id.toString())
      .indexOf(ctx.params.id);
    if (index > -1) {
      me.followingTopics.splice(index, 1);
      me.save();
    }
    ctx.status = 204; // 代表成功了但并没有数据返回
  }

  // 获取问题列表
  async listQuestions(ctx) {
    const questions = await Question.find({ questioner: ctx.params.id });
    ctx.body = questions;
  }

  // 获取用户赞过的列表
  async listLikingAnswers(ctx) {
    const user = await User.findById(ctx.params.id)
      .select('+likingAnswers')
      .populate('likingAnswers');

    if (!user) {
      ctx.throw(404, '用户不存在');
    }
    ctx.body = user.likingAnswers;
  }

  // 点赞答案
  async likeAnswer(ctx, next) {
    const me = await User.findById(ctx.state.user._id).select('+likingAnswers');
    if (!me.likingAnswers.map((id) => id.toString()).includes(ctx.params.id)) {
      me.likingAnswers.push(ctx.params.id);
      me.save();
      // 接下来要修改answer的投票数; $inc 就是用来增加的意思
      await Answer.findByIdAndUpdate(ctx.params.id, { $inc: { voteCount: 1 } });
    }
    ctx.status = 204;
    await next();
  }
  // 取消点赞答案
  async unlikeAnswer(ctx) {
    const me = await User.findById(ctx.state.user._id).select('+likingAnswers');
    // 找到要取消点赞的答案在数组中的索引
    const index = me.likingAnswers
      .map((id) => id.toString())
      .indexOf(ctx.params.id);
    if (index > -1) {
      me.likingAnswers.splice(index, 1);
      me.save();
      // 在answer中将投票数减一
      await Answer.findByIdAndUpdate(ctx.params.id, {
        $inc: { voteCount: -1 },
      });
    }
    ctx.status = 204; // 代表成功了但并没有数据返回
  }
  // 获取用户踩过的答案列表
  async listDisLikingAnswers(ctx) {
    const user = await User.findById(ctx.params.id)
      .select('+dislikingAnswers')
      .populate('dislikingAnswers');

    if (!user) {
      ctx.throw(404, '用户不存在');
    }
    ctx.body = user.dislikingAnswers;
  }

  // 踩答案
  async dislikeAnswer(ctx, next) {
    const me = await User.findById(ctx.state.user._id).select(
      '+dislikingAnswers'
    );
    if (
      !me.dislikingAnswers.map((id) => id.toString()).includes(ctx.params.id)
    ) {
      me.dislikingAnswers.push(ctx.params.id);
      me.save();
    }
    ctx.status = 204;
    await next();
  }
  // 取消踩答案
  async unDislikeAnswer(ctx) {
    const me = await User.findById(ctx.state.user._id).select(
      '+dislikingAnswers'
    );
    // 找到要取消点赞的答案在数组中的索引
    const index = me.dislikingAnswers
      .map((id) => id.toString())
      .indexOf(ctx.params.id);
    if (index > -1) {
      me.dislikingAnswers.splice(index, 1);
      me.save();
    }
    ctx.status = 204; // 代表成功了但并没有数据返回
  }

  // 获取用户收藏的答案列表
  async listCollectingAnswers(ctx) {
    const user = await User.findById(ctx.params.id)
      .select('+collectingAnswers')
      .populate('collectingAnswers');

    if (!user) {
      ctx.throw(404, '用户不存在');
    }
    ctx.body = user.collectingAnswers;
  }

  // 收藏答案
  async collectAnswer(ctx, next) {
    const me = await User.findById(ctx.state.user._id).select(
      '+collectingAnswers'
    );
    if (
      !me.collectingAnswers.map((id) => id.toString()).includes(ctx.params.id)
    ) {
      me.collectingAnswers.push(ctx.params.id);
      me.save();
    }
    ctx.status = 204;
    await next();
  }
  // 取消收藏答案
  async uncollectAnswer(ctx) {
    const me = await User.findById(ctx.state.user._id).select(
      '+collectingAnswers'
    );
    // 找到要取消点赞的答案在数组中的索引
    const index = me.collectingAnswers
      .map((id) => id.toString())
      .indexOf(ctx.params.id);
    if (index > -1) {
      me.collectingAnswers.splice(index, 1);
      me.save();
    }
    ctx.status = 204; // 代表成功了但并没有数据返回
  }
}

module.exports = new UsersCtl();
