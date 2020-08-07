module.exports = {
  secret: 'zhihu-jwt-secret', // 生成token的密钥，真实环境下千万别写在这，一般是环境变量获取的，
  connectionStr: `mongodb://localhost:27017/zhihu`,
};
