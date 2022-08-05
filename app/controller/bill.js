'use strict';

const moment = require('moment')

const Controller = require('egg').Controller;
const ApiResult = require('../utils/apiResult');
class BillController extends Controller {
  async list() {
    const { ctx, app } = this;
    const { date, page, page_size = 5, type_id = 'all' } = ctx.query
    try {
      let user_id
      // 通过 token 解析，拿到 user_id
      const token = ctx.request.header.authorization;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) return
      user_id = decode.id
      const list = await ctx.service.bill.list(user_id)
      // 过滤出月份
      const _list = list.filter(item => {
        if (type_id != 'all') {
          return moment(Number(item.date)).format('YYYY-MM') == date && type_id == item.type_id
        }
        return moment(Number(item.date)).format('YYYY-MM') == date
      })

      // 格式化
      let listMap = _list.reduce((curr, item) => {
        const date = moment(Number(item.date)).format('YYYY-MM-DD')
        // 如果能在累加的数组中找到当前项日期的，那么在数组中的加入当前项到 bills 数组。
        if (curr && curr.length && curr.findIndex(item => item.date == date) > -1) {
          const index = curr.findIndex(item => item.date == date)
          curr[index].bills.push(item)
        }
        // 如果在累加的数组中找不到当前项日期的，那么再新建一项。
        if (curr && curr.length && curr.findIndex(item => item.date == date) == -1) {
          curr.push({
            date,
            bills: [item]
          })
        }

        if (!curr.length) {
          curr.push({
            date,
            bills: [item]
          })
        }
        return curr
      }, []).sort((a, b) => moment(b.date) - moment(a.date))

      // 分页处理
      const filterListMap = listMap.slice((page - 1) * page_size, page * page_size)

      let __list = list.filter(item => moment(Number(item.date)).format('YYYY-MM') == date)
      let totalExpense = __list.reduce((curr, item) => {
        if (item.pay_type == 1) {
          curr += Number(item.amount)
          return curr
        }
        return curr
      }, 0)
      let totalIncome = __list.reduce((curr, item) => {
        if (item.pay_type == 2) {
          curr += Number(item.amount)
          return curr
        }
        return curr
      }, 0)

      ApiResult.common(ctx,200,'请求成功',{
        totalExpense,
        totalIncome,
        totalPage: Math.ceil(listMap.length / page_size),
        list: filterListMap || []
      })
    
    } catch {
      ApiResult.common(ctx,500,'系统错误',null)
    }
  }
  
  async add() {
    const { ctx, app } = this;
    const { amount, type_id, type_name, date, pay_type, remark = '' } = ctx.request.body;

    if (!amount || !type_id || !type_name || !date || !pay_type) {
      ApiResult.common(ctx,400,'参数错误',null)
    }

    try {
      let user_id
      const token = ctx.request.header.authorization;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) return
      user_id = decode.id
      const result = await ctx.service.bill.add({
        amount,
        type_id,
        type_name,
        date,
        pay_type,
        remark,
        user_id
      });
      
      ApiResult.common(ctx,200,'请求成功',null)
    } catch (error) {
      ApiResult.common(ctx,500,'系统错误',null)
    }
  }

  async detail() {
    const { ctx, app } = this;
    const { id = '' } = ctx.query
    // 获取用户 user_id
    let user_id
    const token = ctx.request.header.authorization;
    const decode = await app.jwt.verify(token, app.config.jwt.secret);
    if (!decode) return
    user_id = decode.id
    
    if (!id) {
      ApiResult.common(ctx,500,'订单id不能为空',null)
      return
    }

    try {
      const detail = await ctx.service.bill.detail(id, user_id)
      ApiResult.common(ctx,200,'请求成功',detail)
    } catch (error) {
      ApiResult.common(ctx,500,'系统错误',null)
    }
  }

  async update() {
    const { ctx, app } = this;
    const { id, amount, type_id, type_name, date, pay_type, remark = '' } = ctx.request.body;

    if (!amount || !type_id || !type_name || !date || !pay_type) {
      ApiResult.common(ctx,400,'参数错误',null)
    }

    try {
      let user_id
      const token = ctx.request.header.authorization;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) return
      user_id = decode.id
      const result = await ctx.service.bill.update({
        id,
        amount,
        type_id,
        type_name,
        date,
        pay_type,
        remark,
        user_id
      });
      ApiResult.common(ctx,200,'请求成功',null)
    } catch (error) {
      ApiResult.common(ctx,500,'系统错误',null)
    }
  }

  async delete() {
    const { ctx, app } = this;
    const { id } = ctx.request.body;

    if (!id) {
      ApiResult.common(ctx,400,'参数错误',null)
    }

    try {
      let user_id
      const token = ctx.request.header.authorization;
      const decode = await app.jwt.verify(token, app.config.jwt.secret);
      if (!decode) return
      user_id = decode.id
      const result = await ctx.service.bill.delete(id, user_id);
      ApiResult.common(ctx,200,'请求成功',null)
    } catch (error) {
      ApiResult.common(ctx,500,'系统错误',null)
    }
  }

  async data() {
    const { ctx, app } = this;
    const { date = '' } = ctx.query
    // 获取用户 user_id
    let user_id
    const token = ctx.request.header.authorization;
    const decode = await app.jwt.verify(token, app.config.jwt.secret);
    if (!decode) return
    user_id = decode.id
    
    if (!date) {
      ApiResult.common(ctx,400,'参数错误',null)
      return
    }
    try {
      const result = await ctx.service.bill.list(user_id)
      const start = moment(date).startOf('month').unix() * 1000 // 选择月份，月初时间
      const end = moment(date).endOf('month').unix() * 1000 // 选择月份，月末时间
      const _data = result.filter(item => {
        if (Number(item.date) > start && Number(item.date) < end) {
          return item
        }
      })

      // 总支出
      const total_expense = _data.reduce((arr, cur) => {
        if (cur.pay_type == 1) {
          arr += Number(cur.amount)
        }
        return arr
      }, 0)

      // 总收入
      const total_income = _data.reduce((arr, cur) => {
        if (cur.pay_type == 2) {
          arr += Number(cur.amount)
        }
        return arr
      }, 0)

      // 获取收支构成
      let total_data = _data.reduce((arr, cur) => {
        const index = arr.findIndex(item => item.type_id == cur.type_id)
        if (index == -1) {
          arr.push({
            type_id: cur.type_id,
            type_name: cur.type_name,
            pay_type: cur.pay_type,
            number: Number(cur.amount)
          })
        }
        if (index > -1) {
          arr[index].number += Number(cur.amount)
        }
        return arr
      }, [])

      total_data = total_data.map(item => {
        item.number = Number(Number(item.number).toFixed(2))
        return item
      })

      // 柱状图数据
      // let bar_data = _data.reduce((curr, arr) => {
      //   const index = curr.findIndex(item => item.date == moment(Number(arr.date)).format('YYYY-MM-DD'))
      //   if (index == -1) {
      //     curr.push({
      //       pay_type: arr.pay_type,
      //       date: moment(Number(arr.date)).format('YYYY-MM-DD'),
      //       number: Number(arr.amount)
      //     })
      //   }
      //   if (index > -1) {
      //     curr[index].number += Number(arr.amount)
      //   }

      //   return curr
      // }, [])

      // bar_data = bar_data.sort((a, b) => moment(a.date).unix() - moment(b.date).unix()).map((item) => {
      //   item.number = Number(item.number).toFixed(2)
      //   return item
      // })
      ApiResult.common(ctx,200,'请求成功', {
        total_expense: Number(total_expense).toFixed(2),
        total_income: Number(total_income).toFixed(2),
        total_data: total_data || [],
        // bar_data: bar_data || [] 
      })
    } catch (error) {
      ApiResult.common(ctx,500,'系统错误',null)
    }
  }
}

module.exports = BillController;
