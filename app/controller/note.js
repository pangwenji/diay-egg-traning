'use strict';

const Controller = require('egg').Controller;
const ApiResult = require('../utils/apiResult');
class NoteController extends Controller {
  async list() {
    const { ctx, app } = this;
    let user_id
    // 通过 token 解析，拿到 user_id
    const token = ctx.request.header.authorization;
    const decode = await app.jwt.verify(token, app.config.jwt.secret);
    if (!decode) return
    user_id = decode.id
    const list = await ctx.service.note.list(user_id)
    ApiResult.common(ctx, 200, '请求成功', {list})
  }

  async add() {
    const { ctx, app } = this;
    const { note } = ctx.request.body;

    if (!note) {
      ApiResult.common(ctx, 400, '参数错误', null)
    }

    try {
      let user_id
      const token = ctx.request.header.authorization;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) return
      user_id = decode.id
      const result = await ctx.service.note.add({
        content: note,
        create_time: new Date().getTime(),
        update_time: new Date().getTime(),
        user_id
      });
      ApiResult.common(ctx, 200, '请求成功', null)
    } catch (error) {
      ApiResult.common(ctx, 500, '系统错误', null)
    }
  }

  async delete() {
    const { ctx, app } = this;
    const { id } = ctx.request.body;

    if (!id) {
      ApiResult.common(ctx, 400, '参数错误', null)
    }

    try {
      let user_id
      const token = ctx.request.header.authorization;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) return
      user_id = decode.id
      const result = await ctx.service.note.delete(id, user_id);
     
      ApiResult.common(ctx, 200, '请求成功', null)
    } catch (error) {
      ApiResult.common(ctx, 500, '系统错误', null)
    }
  }

  async update() {
    const { ctx, app } = this;
    const { id, note } = ctx.request.body;

    try {
      let user_id
      const token = ctx.request.header.authorization;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) return
      user_id = decode.id
      const result = await ctx.service.note.update({
        id,
        content: note,
        update_time: new Date().getTime(),
        user_id
      });
      ApiResult.common(ctx, 200, '请求成功', null)
    } catch (error) {
      
      ApiResult.common(ctx, 500, '系统错误', null)
    }
  }
}

module.exports = NoteController;
