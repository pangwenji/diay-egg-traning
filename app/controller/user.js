'use strict';

const defaultAvatar = '//s.yezgea02.com/1615973940679/WeChat77d6d2ac093e247c361f0b8a7aeb6c2a.png'

const Controller = require('egg').Controller;
const ApiResult = require('../utils/apiResult');
class UserController extends Controller {
  async register() {
    const { ctx, app } = this;
    const { username, password } = ctx.request.body

    if (!username || !password) {
      ApiResult.common(ctx,500,'账号密码不能为空',null)
      return
    }

    // 验证数据库内是否已经有该账户名
    const userInfo = await ctx.service.user.getUserByName(username)

    if (userInfo && userInfo.id) {
      ApiResult.common(ctx,500,'账户名已被注册，请重新输入',null)
      return
    }

    const result = await ctx.service.user.register({
      username,
      password,
      signature: '世界和平。',
      avatar: defaultAvatar
    });
    result ? ApiResult.common(ctx,200,'注册成功',null):ApiResult.common(ctx,500,'注册失败',null) ;
  }

  async login() {
    // app 为全局属性，相当于所有的插件方法都植入到了 app 对象
    const { ctx, app } = this;
    const { username, password } = ctx.request.body
    // 根据用户名，在数据库查找相对应的id操作
    const userInfo = await ctx.service.user.getUserByName(username);
    console.log(userInfo, 'userInfo')
    // 没找到说明没有该用户
    if (!userInfo || !userInfo.username) {
      ApiResult.common(ctx,500,'账号不存在',null)
      return
    }
   
    if (userInfo && password != userInfo.password) {
      ApiResult.common(ctx,500,'账号密码错误',null)
      return
    }


    // 生成 token 加盐
    const token = app.jwt.sign({
      id: userInfo.id,
      username: userInfo.username,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // token 有效期为 24 小时
    }, app.config.jwt.secret);
    
    ApiResult.common(ctx, 200, '登录成功', {
        token
    })
  }
 
  async getUserInfo() {
    const { ctx, app } = this;
    const token = ctx.request.header.authorization;
    const decode = await app.jwt.verify(token, app.config.jwt.secret);
    const userInfo = await ctx.service.user.getUserByName(decode.username)
    ApiResult.common(ctx,200,'请求成功', {
      id: userInfo.id,
      username: userInfo.username,
      signature: userInfo.signature || '',
      avatar: userInfo.avatar || defaultAvatar
    })
  }

  async editUserInfo () {
    const { ctx, app } = this;
    const { signature = 'the last time change', avatar = 'profile' } = ctx.request.body
    try {
      let user_id
      const token = ctx.request.header.authorization;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) return
      user_id = decode.id
      
      const userInfo = await ctx.service.user.getUserByName(decode.username);
      let { username, password } = userInfo
      const  OkPacket = await ctx.service.user.editUserInfo({
        username,
        password,
        signature,
        avatar
      });
      if (OkPacket.protocol41) {
        ApiResult.common(ctx, 200, '更新成功', {
          id: user_id,
          signature,
          username: userInfo.username,
          avatar
        })
      } else { 
        ApiResult.common(ctx, 400, '更新失败', null)
      }
    } catch (error) {}
  }

  async modifyPass () {
    const { ctx, app } = this;
    const { old_pass = '', new_pass = '', new_pass2 = '' } = ctx.request.body

    try {
      let user_id
      const token = ctx.request.header.authorization;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) return
      if (decode.username == 'admin') {
        ApiResult.common(ctx,200,'管理员账户，不允许修改密码！',null)
        return
      }
      user_id = decode.id
      const userInfo = await ctx.service.user.getUserByName(decode.username)

      if (old_pass != userInfo.password) {
        ApiResult.common(ctx,400,'原密码错误',null)
        return
      }

      if (new_pass != new_pass2) {
        ApiResult.common(ctx,400,'新密码不一致',null)
        return
      }

      delete userInfo['password']
      const result = await ctx.service.user.modifyPass({
        ...userInfo,
        password: new_pass,
      })

      ApiResult.common(ctx,400,'请求成功',null)
      
    } catch (error) {
      ApiResult.common(ctx,500,'系统错误',null)
    }
  }

  async verify() {
    const { ctx, app } = this;
    const { token } = ctx.request.body
    const decode = await app.jwt.verify(token, app.config.jwt.secret);
    ctx.body = 'success gays'
  }
}

module.exports = UserController;
