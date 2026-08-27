import type {
  DashboardEnvelope,
  DashboardRequestSpec,
  ReproductiveTimelineDto,
} from '../types/dashboardApi.ts'

type GrowthStageCrop = '小麦' | '玉米'

interface GrowthStageItem {
  productionDate: string
  periodType: string
  day: string
}

interface GrowthStageAnalysis {
  landRegion: string
  periodType: string
  phaseOneTime: string
  phaseOneName: string
  phaseOneRate: number
  phaseTwoTime: string
  phaseTwoName: string
  phaseTwoRate: number
  phaseThreeTime: string
  phaseThreeName: string
  phaseThreeRate: number
  measures: string
}

const stagesByCrop: Record<GrowthStageCrop, Record<number, readonly GrowthStageItem[]>> = {
  小麦: {
    2025: [
      { productionDate: '2025-11-30', periodType: '出苗期', day: '11-30' },
      { productionDate: '2025-12-21', periodType: '越冬期', day: '12-21' },
    ],
    2026: [
      { productionDate: '2026-03-10', periodType: '返青-起身期', day: '03-10' },
      { productionDate: '2026-05-02', periodType: '抽穗-开花期', day: '05-02' },
      { productionDate: '2026-05-25', periodType: '灌浆期', day: '05-25' },
    ],
  },
  玉米: {
    2025: [
      { productionDate: '2025-06-26', periodType: '播种期', day: '06-26' },
      { productionDate: '2025-08-11', periodType: '抽穗期', day: '08-11' },
      { productionDate: '2025-09-10', periodType: '乳熟期', day: '09-10' },
    ],
  },
}

const analysisByCropAndDate: Record<string, GrowthStageAnalysis> = {
  '小麦@2025-11-30': {
    landRegion: '青岛市',
    periodType: '播种期',
    phaseOneTime: '11月1日之前',
    phaseOneName: '',
    phaseOneRate: 17.37,
    phaseTwoTime: '11月1日-11月15日',
    phaseTwoName: '',
    phaseTwoRate: 68.21,
    phaseThreeTime: '11月15日之后',
    phaseThreeName: '',
    phaseThreeRate: 14.43,
    measures: '2025年受持续阴雨等因素影响，青岛冬小麦大多推迟到11月播种，晚播麦田冬前生长量不足、抗寒能力偏弱，存在减产风险。建议组织农技人员进村入田查苗划类，对晚播弱苗地块统筹实施镇压保墒、补种补缺和晚播专用技术；冬前控氮稳苗，返青期及早追施速效氮肥并配施磷钾肥、叶面肥增强抗寒；根据墒情和冷空气过程科学浇好封冻水和返青水，同步开展病虫草统防统治和社会化服务托管。',
  },
  '小麦@2025-12-21': {
    landRegion: '青岛市',
    periodType: '越冬期',
    phaseOneTime: '2026/12/22之前',
    phaseOneName: '',
    phaseOneRate: 0,
    phaseTwoTime: '2026/12/22之后',
    phaseTwoName: '',
    phaseTwoRate: 0,
    phaseThreeTime: '/',
    phaseThreeName: '',
    phaseThreeRate: 0,
    measures: '2025年青岛越冬期冷空气过程偏多、气温波动大，晚播弱苗抗寒偏弱，存在冻害与群体不足风险。弱苗田需镇压保墒、补种补缺，涝田疏沟排水；冬前控氮控水稳苗；寒潮前后因墒浇好封冻水、返青水；返青期抢早追施速效氮并配磷钾、叶面肥，同时落实病虫草统防统治。',
  },
  '小麦@2026-03-10': {
    landRegion: '青岛市',
    periodType: '返青期',
    phaseOneTime: '2026/2/25之前',
    phaseOneName: '返青较早',
    phaseOneRate: 0,
    phaseTwoTime: '2月25日-3月5日',
    phaseTwoName: '返青集中期',
    phaseTwoRate: 0,
    phaseThreeTime: '2026/3/5之后',
    phaseThreeName: '返青较晚',
    phaseThreeRate: 0,
    measures: '管理决策建议：2026年青岛市冬小麦返青期总体集中在2月下旬末至3月初，胶州等西南部区域返青较早，平度、莱西等北部区域返青偏晚。早返青地块应重点防范倒春寒和旺长风险，做好镇压保墒和病虫草害监测；迟返青地块应加强弱苗、晚播苗和墒情不足地块管理，适时开展肥水调控，促进苗情转化。',
  },
  '小麦@2026-05-02': {
    landRegion: '青岛市',
    periodType: '开花期',
    phaseOneTime: '5月5日之前',
    phaseOneName: '开花期偏早',
    phaseOneRate: 0,
    phaseTwoTime: '5月5日-5月10日',
    phaseTwoName: '开花期适中',
    phaseTwoRate: 0,
    phaseThreeTime: '5月10日之后',
    phaseThreeName: '开花期偏晚',
    phaseThreeRate: 0,
    measures: '管理决策建议：2026年青岛市冬小麦开花盛期总体集中在5月上旬，主要出现在5月2日至5月9日前后。建议加强墒情监测，缺墒地块及时补水，并做好赤霉病、蚜虫等病虫害监测防控。',
  },
  '小麦@2026-05-25': {
    landRegion: '青岛市',
    periodType: '成熟期',
    phaseOneTime: '6月15日之前',
    phaseOneName: '',
    phaseOneRate: 11.68,
    phaseTwoTime: '6月15日-6月20日',
    phaseTwoName: '',
    phaseTwoRate: 4.38,
    phaseThreeTime: '6月20日之后',
    phaseThreeName: '',
    phaseThreeRate: 83.94,
    measures: '管理决策建议：今年青岛市冬小麦整体进入收获期时间较晚，大部分区域集中在6月20日以后完成收获。建议密切关注成熟进度和天气变化，提前统筹调配收割机械，抓住晴好天气窗口及时开展抢收作业。',
  },
  '玉米@2025-06-26': {
    landRegion: '青岛市',
    periodType: '播种期',
    phaseOneTime: '6月20日之前',
    phaseOneName: '早播',
    phaseOneRate: 23.63,
    phaseTwoTime: '6月20日-6月30日',
    phaseTwoName: '适播',
    phaseTwoRate: 72.18,
    phaseThreeTime: '6月30日之后',
    phaseThreeName: '晚播',
    phaseThreeRate: 4.2,
    measures: '青岛市玉米播种期以适播为主，播种时间集中度高，有利于统一管理。建议下一季继续保持适期播种的高比例，适度减少早播和晚播面积。',
  },
  '玉米@2025-08-11': {
    landRegion: '青岛市',
    periodType: '抽雄吐丝期',
    phaseOneTime: '7月30日之前',
    phaseOneName: '',
    phaseOneRate: 10.1,
    phaseTwoTime: '7月30日-8月10日',
    phaseTwoName: '',
    phaseTwoRate: 50.1,
    phaseThreeTime: '8月10日之后',
    phaseThreeName: '',
    phaseThreeRate: 39.8,
    measures: '预计高温天气将持续，同时降水量相对较少。建议在玉米抽雄吐丝期前后加强灌溉和施肥管理，确保关键生育阶段获得充足水分和养分。',
  },
  '玉米@2025-09-10': {
    landRegion: '青岛市',
    periodType: '成熟期',
    phaseOneTime: '9月22日之前',
    phaseOneName: '早熟',
    phaseOneRate: 22.4,
    phaseTwoTime: '9月23日-10月9日',
    phaseTwoName: '中熟',
    phaseTwoRate: 73.9,
    phaseThreeTime: '10月10日之后',
    phaseThreeName: '晚熟',
    phaseThreeRate: 3.7,
    measures: '青岛市玉米成熟期以中熟为主，应密切关注降雨、夜温和湿度变化，提前制定备选收割路径或启动预烘干方案，同时关注强风暴雨造成的倒伏风险。',
  },
}

function normalizeCrop(value: unknown): GrowthStageCrop {
  const crop = String(value ?? '').trim().toLowerCase()
  return crop === '玉米' || crop === 'corn' || crop === 'ym' ? '玉米' : '小麦'
}

function timelineFallback(crop: GrowthStageCrop, requestedYear: unknown): ReproductiveTimelineDto {
  const stagesByYear = stagesByCrop[crop]
  const allYear = Object.keys(stagesByYear).map(Number).sort((left, right) => left - right)
  const parsedYear = Number(requestedYear)
  const year = allYear.includes(parsedYear) ? parsedYear : allYear.at(-1)!
  const stages = stagesByYear[year] ?? []
  const allStages = allYear.flatMap((itemYear) => stagesByYear[itemYear] ?? [])
  const allMonth = [...new Map(allStages.map((item) => [
    item.productionDate.slice(0, 7),
    { timeMonth: item.productionDate.slice(0, 7), timeYear: Number(item.productionDate.slice(0, 4)), check: false },
  ])).values()]

  return {
    allMonth,
    reproductiveTimeList: stages.map((item, index) => ({
      ...item,
      dataFlag: true,
      wmsFlag: true,
      checked: index === stages.length - 1,
    })),
    allYear,
    year,
  }
}

function responseData(response: DashboardEnvelope | undefined): unknown {
  return response && 'data' in response ? response.data : undefined
}

function hasUsableResponse(spec: DashboardRequestSpec, response: DashboardEnvelope | undefined): boolean {
  if (!response || response.code !== 200) return false
  const data = responseData(response)
  if (spec.endpoint === 'queryCropType') return Array.isArray(data) && data.length > 0
  if (spec.endpoint === 'getReproductiveTimeLine') {
    const timeline = data as ReproductiveTimelineDto | undefined
    return Boolean(timeline?.reproductiveTimeList?.length)
  }
  if (spec.endpoint === 'queryReproductiveAnalysis') {
    return Boolean(data && typeof data === 'object' && !Array.isArray(data) && (data as GrowthStageAnalysis).periodType)
  }
  return true
}

export function resolveGrowthStageRequestResponse(
  spec: DashboardRequestSpec,
  response?: DashboardEnvelope,
): DashboardEnvelope | undefined {
  if (hasUsableResponse(spec, response)) return response

  if (spec.endpoint === 'queryCropType') {
    return { code: 200, msg: '操作成功', data: [
      { index: null, cropType: '小麦', select: true },
      { index: null, cropType: '玉米', select: false },
    ] }
  }

  if (spec.endpoint === 'getReproductiveTimeLine') {
    const crop = normalizeCrop(spec.body?.typeName)
    return { code: 200, msg: '操作成功', data: timelineFallback(crop, spec.body?.year) }
  }

  if (spec.endpoint === 'queryReproductiveAnalysis') {
    const crop = normalizeCrop(spec.body?.typeName)
    const date = String(spec.body?.yearDay ?? '')
    const analysis = analysisByCropAndDate[`${crop}@${date}`]
    return analysis ? { code: 200, msg: '操作成功', data: analysis } : response
  }

  return response
}
