const Router = require('koa-router');
const jwt = require('koa-jwt');
const { secret } = require('../config');
const {
  find,
  findById,
  update,
  create,
  listTopicFollowers,
  checkTopicExist,
  listQuestions,
} = require('../controllers/topics');

const router = new Router({ prefix: '/topics' });
const auth = jwt({ secret });
// 查找全部话题
router.get('/', find);
// 增加话题
router.post('/', auth, create);
// 根据用户id查找话题
router.get('/:id', checkTopicExist, findById);
// 根据用户id更新
router.patch('/:id', auth, checkTopicExist, update);
// 获取话题的粉丝
router.get('/:id/followers', checkTopicExist, listTopicFollowers);
// 获取对应话题下的问题
router.get('/:id/questions', checkTopicExist, listQuestions);

module.exports = router;
