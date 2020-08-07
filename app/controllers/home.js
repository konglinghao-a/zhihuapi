const path = require('path');
class HomeCtl {
  index(ctx) {
    ctx.body = '<h1>主页</h1>';
  }

  // 上传图片的控制器
  upload(ctx) {
    const file = ctx.request.files.file;
    const basename = path.basename(file.path); // 得到文件的名称+扩展名
    // 此时ctx.origin就是localhost:3000
    ctx.body = { url: `${ctx.origin}/uploads/${basename}` };
  }
}
module.exports = new HomeCtl();
