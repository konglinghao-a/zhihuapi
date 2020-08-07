// 轮流注册路由，这样就不用每次都手动注册路由了
const fs = require('fs');
module.exports = (app) => {
  // 利用fs来读取目录
  fs.readdirSync(__dirname).forEach((file) => {
    if (file === 'index.js') {
      return;
    }
    const route = require(`./${file}`);
    app.use(route.routes()).use(route.allowedMethods());
  });
};
