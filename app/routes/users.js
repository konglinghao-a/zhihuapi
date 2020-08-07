const jwt = require('koa-jwt');
const Router = require('koa-router');
// const jsonwebtoken = require('jsonwebtoken');
const router = new Router({ prefix: '/users' });
const {
  find,
  findById,
  create,
  update,
  delete: del,
  login,
  checkOwner,
  listFollowing,
  follow,
  unfollow,
  listFollowers,
  checkUserExist,
  followTopics,
  unfollowTopics,
  listFollowingTopics,
  listQuestions,
  likeAnswer,
  listDisLikingAnswers,
  listLikingAnswers,
  unDislikeAnswer,
  unlikeAnswer,
  dislikeAnswer,
  collectAnswer,
  uncollectAnswer,
  listCollectingAnswers,
} = require('../controllers/users');
const { checkTopicExist } = require('../controllers/topics');
// 检查答案是否存在
const { checkAnswerExist } = require('../controllers/answers');
const { secret } = require('../config');

// 认证的中间件, 生成的信息也在ctx.state.user上
const auth = jwt({ secret });

// 查询用户列表（用数组）
router.get('/', find);

// 增加用户；返回的是新建的用户的信息（用对象）
router.post('/', create);

// 查询特定用户；返回数组中的某一项（用对象）
router.get('/:id', findById);

// 修改用户；返回修改后的项（用对象）; put是整体替换，patch是部分替换
router.patch('/:id', auth, checkOwner, update);

// 删除用户；返回状态码204，表示什么都没有但是请求成功了
router.delete('/:id', auth, checkOwner, del);

// 用户登录
router.post('/login', login);

// 获取用户关注的人的列表
router.get('/:id/following', listFollowing);

// 获取粉丝列表
router.get('/:id/followers', listFollowers);

/**
 * 关注
 * 后面的id是要关注的人的id
 * 要加auth，因为要知道是是谁关注了别人，这样就可以把关注的人加到这个人的关注列表里面
 */
router.put('/following/:id', auth, checkUserExist, follow);

// 取消关注
router.delete('/following/:id', auth, checkUserExist, unfollow);

// 关注话题
router.put('/followingTopics/:id', auth, checkTopicExist, followTopics);

// 取消关注话题
router.delete('/followingTopics/:id', auth, checkTopicExist, unfollowTopics);

// 获取关注的话题列表
router.get('/:id/followingTopics', listFollowingTopics);

// 获取关注的问题的列表
router.get('/:id/questions', listQuestions);

// 点赞答案，点赞的时候要取消踩，因此把控制器放到后面执行，这样就实现了互斥的关系。
router.put(
  '/likingAnswers/:id',
  auth,
  checkAnswerExist,
  likeAnswer,
  unDislikeAnswer
);

// 取消点赞答案
router.delete('/likingAnswers/:id', auth, checkAnswerExist, unlikeAnswer);

// 获取赞过的答案
router.get('/:id/likingAnswers', listLikingAnswers);

// 踩答案
router.put(
  '/dislikingAnswers/:id',
  auth,
  checkAnswerExist,
  dislikeAnswer,
  unlikeAnswer
);

// 取消踩答案
router.delete('/dislikingAnswers/:id', auth, checkAnswerExist, unDislikeAnswer);

// 获取踩过的答案
router.get('/:id/dislikingAnswers', listDisLikingAnswers);

// 收藏答案
router.put('/collectingAnswers/:id', auth, checkAnswerExist, collectAnswer);

// 取消收藏的答案
router.delete(
  '/collectingAnswers/:id',
  auth,
  checkAnswerExist,
  uncollectAnswer
);

// 获取收藏过的答案
router.get('/:id/collectingAnswers', listCollectingAnswers);
module.exports = router;
