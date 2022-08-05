'use strict';

const Service = require('egg').Service;
const ApiResult =require('../utils/apiResult')
class UserService extends Service {

  // 注册
  async register(params) {
    const { app } = this;
    try {
      const result = await app.mysql.insert('users', params);
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  // 通过用户名获取用户信息
  async getUserByName(username) {
    const { app } = this;
      try {
        const result = await app.mysql.get('users', { username });
        return result;
      } catch (error) {
        return null;
      }
  }

  async editUserInfo(params) {
    const { ctx, app } = this;
    try {
      let result = await app.mysql.update('users', {
        id: 0,
        ...params
      });
      return result;
    } catch (error) {
      return null;
    }
  }

  async modifyPass (params) {
    const { ctx, app } = this;
    console.log(params)
    try {
      let result = await app.mysql.update('user', {
          ...params
      }, {
          id: 0
      });
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
}

module.exports = UserService;
