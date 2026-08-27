import { createServer } from 'node:http'

const host = '127.0.0.1'
const port = 3010
const arrayDataPaths = new Set([
  '/agro-admin/screen/getTimeLine',
  '/agro-admin/screen/queryGreenGrainIncreaseStatistics',
  '/agro-admin/screen/queryGreenGrainIncreaseList',
  '/agro-admin/screen/queryGreenGrainIncreaseStatisticsByArea',
  '/agro-admin/screen/queryPlantingTaskByArea',
  '/agro-admin/screen/queryYieldTotalByYear',
  '/agro-admin/screen/queryYieldTotalByArea',
  '/agro-admin/screen/queryMaturityStageByYear',
  '/agro-admin/screen/queryCropType',
  '/agro-admin/screen/querySeedlingConditionAnalysis',
  '/agro-admin/screen/queryByKeyword',
])

function json(response, body, headers = {}) {
  response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', ...headers })
  response.end(JSON.stringify(body))
}

// 该服务只绑定回环地址，提供浏览器冒烟所需的最小虚构认证与空业务响应。
const server = createServer((request, response) => {
  const pathname = new URL(request.url ?? '/', `http://${host}:${port}`).pathname
  if (request.method === 'GET' && pathname === '/agro-admin/captchaImage') {
    json(response, {
      code: 200,
      msg: 'local smoke captcha',
      img: 'R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
      captchaEnabled: true,
      uuid: 'local-smoke-uuid',
    })
    return
  }
  if (request.method === 'POST' && pathname === '/agro-admin/login') {
    json(
      response,
      { code: 200, msg: 'local smoke login', token: 'local' },
      { 'Set-Cookie': 'main_grain_local_smoke=1; Path=/; HttpOnly; SameSite=Lax' },
    )
    return
  }
  if (pathname === '/agro-admin/screen/getVectorTableWms') {
    json(response, { code: 200, msg: '' })
    return
  }
  if (pathname === '/agro-admin/screen/queryReportList') {
    json(response, { code: 200, msg: 'ok', rows: [], total: 0 })
    return
  }
  if (pathname === '/agro-admin/screen/getTimeLine') {
    json(response, { code: 200, msg: 'ok', data: [{ timeYear: 2026, halfYear: 2 }] })
    return
  }
  if (pathname === '/agro-admin/screen/getReproductiveTimeLine') {
    json(response, {
      code: 200,
      msg: 'ok',
      data: { allMonth: [], reproductiveTimeList: [], allYear: [2026], year: 2026 },
    })
    return
  }
  if (pathname.startsWith('/agro-admin/')) {
    json(response, { code: 200, msg: 'ok', data: arrayDataPaths.has(pathname) ? [] : {} })
    return
  }
  response.writeHead(404)
  response.end('not found')
})

server.listen(port, host, () => {
  console.log(`LOCAL_AUTH_SERVER_READY=http://${host}:${port}`)
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)))
}
