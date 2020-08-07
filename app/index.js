const Koa = require('koa');
const koaBody = require('koa-body');
const koaStatic = require('koa-static');
const error = require('koa-json-error');
const parameter = require('koa-parameter');
const mongoose = require('mongoose');
const path = require('path');
const app = new Koa();
const routing = require('./routes');
const { connectionStr } = require('./config');

// 第一个参数就是网站上生成好的连接字符串; 第二个参数专门放选项
mongoose.connect(connectionStr, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.connection.on('connected', () => {
  console.log('连接成功');
});
// 打印错误信息；第二个参数是错误的回调
mongoose.connection.on('error', (err) => {
  console.log(`连接失败`, err);
});

/**
 * 通常静态文件都是放到最前面的；
 * 它接收一个参数：指定目录
 */
app.use(koaStatic(path.join(__dirname, 'public')));

// 先执行错误处理中间件
app.use(
  error({
    // postFormat 就是用来定制返回格式的
    postFormat: (e, { stack, ...rest }) =>
      process.env.NODE_ENV === 'production' ? rest : { stack, ...rest },
  })
);
// 把router挂载在app上
app.use(
  koaBody({
    multipart: true, // 代表启用文件, 文件的Content-Type就是multipart/formdata
    formidable: {
      // 这是个npm包，被koabody引用了
      uploadDir: path.join(__dirname, '/public/uploads'), // 上传目录
      keepExtensions: true, // 保留扩展名，就是图片后面的jpg、png这些
    },
  })
);
// koa-parameter通常是用来校验请求体的，因此我们将其放在请求体后面
app.use(parameter(app));
// 轮流注册路由
routing(app);

app.listen(3000, () => console.log('server is running'));
