class ApiResult { 
  static common = (ctx,code, title, data) => {
    ctx.body = {
      code: code,
      msg: title,
      data: data
    }
  }

  static randorNum = () => { 
    return (Math.random()*10 + 1)
  }
}

module.exports = ApiResult;