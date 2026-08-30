export const WEATHER_ALERT_TYPES = ['高温', '低温', '干旱', '洪涝', '病虫害'] as const

export interface WeatherAlertSelection {
  changed: boolean
  crop: string
  timelineIndex: number
}

/**
 * 气象类型与通用作物筛选共用 crop 状态，返回值直接驱动重新加载和时间轴复位。
 */
export function selectWeatherAlertType(currentType: string, nextType: string): WeatherAlertSelection {
  return {
    changed: currentType !== nextType,
    crop: nextType,
    timelineIndex: 0,
  }
}
