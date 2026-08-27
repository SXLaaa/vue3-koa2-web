<template>
  <div ref="chartEl" class="chart-box" :class="`chart-${chart.type}`" />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import type { ChartBlock } from '@/types/dashboard'

const props = defineProps<{
  chart: ChartBlock
}>()

const chartEl = ref<HTMLElement | null>(null)
let chartInstance: echarts.ECharts | null = null
let resizeObserver: ResizeObserver | null = null

function makeOption(chart: ChartBlock): echarts.EChartsOption {
  const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
  const axisStyle = {
    axisLine: { lineStyle: { color: 'rgba(93, 210, 255, 0.35)' } },
    axisTick: { show: false },
    axisLabel: { color: '#b9eaff', fontSize: 10 },
    splitLine: { lineStyle: { color: 'rgba(93, 210, 255, 0.12)' } },
  }

  if (chart.variant === 'plantingTask') {
    const compactPlantingTask = window.innerWidth < 1500
    return {
      animationDuration: 500,
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
      },
      legend: {
        top: '5%',
        right: '5%',
        textStyle: { color: '#fff' },
      },
      grid: { top: '25%', left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: [
        {
          type: 'category',
          data: chart.data.map((item) => item.name),
          axisLabel: { interval: 0, color: '#fff', fontSize: rem * 0.11 },
        },
        {
          type: 'category',
          data: chart.data.map((item) => `${item.rate ?? ''}%`),
          position: 'bottom',
          offset: 20,
          axisLabel: { interval: 0, color: '#00ff88', fontSize: rem * 0.11 },
          axisLine: { show: false },
          axisTick: { show: false },
        },
      ],
      yAxis: {
        type: 'value',
        name: `单位：${chart.unit ?? ''}`,
        nameTextStyle: { color: '#fff', fontSize: rem * 0.12, lineHeight: 40 },
        splitLine: { show: false },
        axisLabel: { color: '#fff' },
      },
      series: [
        {
          name: '任务量',
          type: 'bar' as const,
          data: chart.data.map((item) => item.compare ?? 0),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#30dcff' },
              { offset: 1, color: 'rgba(53, 168, 235, 0)' },
            ]),
          },
          label: {
            show: !compactPlantingTask,
            position: 'top',
            distance: 5,
            color: '#30dcff',
            fontWeight: 'bolder',
            fontSize: rem * 0.11,
            formatter: '{c}',
          },
          tooltip: { valueFormatter: (value) => `${value}${chart.unit ?? ''}` },
        },
        {
          name: '完成量',
          type: 'bar' as const,
          data: chart.data.map((item) => item.value),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#21ff98' },
              { offset: 1, color: 'rgba(0, 153, 82, 0)' },
            ]),
          },
          label: {
            show: !compactPlantingTask,
            position: 'top',
            distance: 5,
            color: '#00ff88',
            fontWeight: 'bolder',
            fontSize: rem * 0.11,
            formatter: '{c}',
          },
          tooltip: { valueFormatter: (value) => `${value}${chart.unit ?? ''}` },
        },
      ],
    }
  }

  if (chart.variant === 'farmlandArea') {
    const values = chart.data.map((item) => item.value)
    const maximum = Math.max(...values, 0)

    return {
      animationDuration: 500,
      legend: {
        show: false,
        icon: 'rect',
        textStyle: { color: '#93B9FF' },
      },
      tooltip: {
        trigger: 'axis',
        confine: true,
      },
      grid: { top: '15%', left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: chart.data.map((item) => item.name),
        axisLabel: {
          interval: 0,
          color: '#A2B0B8',
          fontSize: 11,
          formatter: (value: string) =>
            chart.data.length > 5 &&
            (chartEl.value?.clientWidth ?? 420) < 330 &&
            value.length > 2
              ? `${value.slice(0, 2)}\n${value.slice(2)}`
              : value,
        },
        axisLine: { show: true, lineStyle: { width: 1, color: '#305B9A' } },
      },
      yAxis: {
        type: 'value',
        name: `占地面积(${chart.unit ?? ''})`,
        nameTextStyle: { color: '#fff', fontSize: 11, padding: [0, 0, 0, 10] },
        axisLabel: { color: '#A2B0B8', fontSize: 11 },
        axisLine: { show: false, lineStyle: { color: '#305B9A' } },
        splitLine: { lineStyle: { color: '#0F2E60' } },
      },
      series: [
        {
          name: `占地面积(${chart.unit ?? ''})`,
          type: 'bar' as const,
          barGap: '-100%',
          barWidth: 20,
          itemStyle: { color: 'rgba(63, 169, 245, 0.1)' },
          tooltip: { show: false },
          data: chart.data.map(() => maximum),
          z: 0,
        },
        {
          name: `占地面积(${chart.unit ?? ''})`,
          type: 'pictorialBar' as const,
          symbol: 'rect',
          barWidth: 14,
          symbolSize: '100%',
          symbolPosition: 'start',
          symbolOffset: [0, 0],
          itemStyle: { color: '#29A7E7' },
          data: values,
          tooltip: { valueFormatter: (value) => `${value}${chart.unit ?? ''}` },
          z: 1,
          zlevel: 0,
        },
        {
          name: `占地面积(${chart.unit ?? ''})`,
          type: 'pictorialBar' as const,
          barWidth: 14,
          symbol: 'rect',
          symbolRepeat: 15,
          symbolClip: true,
          symbolSize: [14, 2],
          symbolPosition: 'start',
          symbolOffset: [0, 0],
          itemStyle: { color: '#011140' },
          tooltip: { show: false },
          data: values,
          z: 2,
          zlevel: 0,
        },
      ],
    }
  }

  if (chart.variant === 'farmlandTrend') {
    const values = chart.data.map((item) => item.value)

    return {
      animationDuration: 500,
      title: {
        text: `面积(${chart.unit ?? ''})`,
        top: 0,
        left: 0,
        textStyle: { color: '#ffffff', fontSize: 11, fontWeight: 400 },
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(5, 35, 78, 0.92)',
        borderColor: '#29a7e7',
        textStyle: { color: '#dffaff', fontSize: 11 },
        valueFormatter: (value) => `${value}${chart.unit ?? ''}`,
      },
      grid: { top: 28, right: 7, bottom: 24, left: 34 },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: chart.data.map((item) => item.name),
        axisLine: { lineStyle: { color: 'rgba(41, 167, 231, 0.4)' } },
        axisTick: { show: false },
        axisLabel: { color: '#8ac8ea', fontSize: 9 },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 700,
        interval: 100,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#9ac9e8', fontSize: 9 },
        splitLine: { lineStyle: { color: 'rgba(41, 167, 231, 0.12)' } },
      },
      series: [
        {
          name: chart.title,
          type: 'line' as const,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color: '#2ad9f7', width: 2, shadowBlur: 7, shadowColor: '#2ad9f7' },
          itemStyle: { color: '#ffffff', borderColor: '#2ad9f7', borderWidth: 2 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(42, 217, 247, 0.24)' },
              { offset: 1, color: 'rgba(42, 217, 247, 0.02)' },
            ]),
          },
          data: values,
        },
      ],
    }
  }

  if (chart.variant === 'protectionMonitoring') {
    return {
      animationDuration: 500,
      tooltip: { trigger: 'axis', confine: true, axisPointer: { type: 'shadow' } },
      legend: { show: false },
      grid: { top: '15%', left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: chart.data.map((item) => item.name),
        axisLabel: { interval: 0, color: '#fff', fontSize: rem * 0.11 },
        axisLine: { show: true, lineStyle: { color: '#305b9a' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        name: `${chart.title === '数量' ? '占地个数' : '占地面积'}(${chart.unit ?? ''})`,
        nameTextStyle: { color: '#fff', fontSize: rem * 0.11, padding: [0, 0, 0, 10] },
        axisLabel: { color: '#a2b0b8', fontSize: rem * 0.11 },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#0f2e60' } },
      },
      series: (chart.series ?? []).map((series) => ({
        name: series.name,
        type: 'bar' as const,
        stack: '总量',
        barWidth: rem * 0.16,
        itemStyle: { color: series.color },
        emphasis: { focus: 'series' },
        data: series.data,
        tooltip: { valueFormatter: (value) => `${value}${chart.unit ?? ''}` },
      })),
    }
  }

  if (chart.variant === 'seedlingLevel') {
    const colors = ['#6c95e6', '#9966ff', '#00ffff', '#50a4f2']
    const pieData = chart.data.map((item, index) => ({
      name: item.name,
      value: item.value,
      itemStyle: { color: colors[index % colors.length] },
    }))

    return {
      tooltip: { trigger: 'item', formatter: '{b}<br/>{c}%' },
      title: {
        text: 'LAI',
        left: '25%',
        top: '43%',
        textAlign: 'center',
        textStyle: { color: '#fff', fontSize: rem * 0.2, fontWeight: 700 },
      },
      legend: {
        show: true,
        right: '3%',
        top: 'center',
        orient: 'vertical',
        itemGap: rem * 0.18,
        itemWidth: rem * 0.12,
        itemHeight: rem * 0.12,
        icon: 'circle',
        textStyle: { color: '#8a9baf', fontSize: rem * 0.12 },
        formatter: (name: string) => {
          const item = chart.data.find((datum) => datum.name === name)
          return `${name}   ${item?.value ?? 0}%`
        },
      },
      series: [
        {
          type: 'pie' as const,
          roseType: 'radius',
          radius: ['46%', '77%'],
          center: ['25%', '50%'],
          startAngle: 30,
          label: { show: false },
          itemStyle: { opacity: 0.32, shadowBlur: 10, shadowColor: 'rgba(0, 103, 255, 0.2)' },
          data: pieData,
        },
        {
          type: 'pie' as const,
          radius: ['46%', '67%'],
          center: ['25%', '50%'],
          startAngle: 30,
          label: { show: false },
          itemStyle: { opacity: 0.62 },
          data: pieData,
        },
      ],
    }
  }

  if (chart.variant === 'growthLevel') {
    const values = chart.data.map((item) => item.value)
    return {
      tooltip: { trigger: 'axis', confine: true, axisPointer: { type: 'shadow' } },
      grid: { left: '2%', bottom: '4%', right: '7%', top: '15%', containLabel: true },
      xAxis: [
        {
          type: 'category',
          data: chart.data.map((item) => item.name),
          axisTick: { show: false },
          axisLine: { show: false },
          axisLabel: { margin: 10, color: '#fff', fontSize: rem * 0.12 },
        },
        {
          type: 'category',
          data: values.map((value) => `${value}%`),
          position: 'top',
          offset: 16,
          axisTick: { show: false },
          axisLine: { show: false },
          axisLabel: { interval: 0, color: '#fff', fontSize: rem * 0.11 },
        },
      ],
      yAxis: {
        type: 'value',
        name: '占比',
        nameTextStyle: { color: '#8a9baf', fontSize: rem * 0.11 },
        axisTick: { show: false },
        axisLine: { show: false },
        axisLabel: { color: '#78c0e6', fontSize: rem * 0.1 },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.12)', type: 'dashed' } },
      },
      series: [
        {
          type: 'bar' as const,
          barWidth: rem * 0.26,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(0, 147, 221, 0.9)' },
              { offset: 1, color: 'rgba(0, 88, 255, 0.18)' },
            ]),
            borderColor: 'rgba(255,255,255,0.22)',
            borderWidth: 1,
          },
          data: values,
        },
      ],
    }
  }

  if (chart.variant === 'growthTrend') {
    const sourceSeries = chart.series?.length
      ? chart.series
      : [{ name: chart.title, color: '#30c1ff', data: chart.data.map((item) => item.value) }]
    return {
      legend: {
        top: 10,
        right: 10,
        data: sourceSeries.map((series) => series.name),
        textStyle: { color: '#8fafd6', fontSize: rem * 0.12 },
      },
      tooltip: { trigger: 'axis', confine: true },
      grid: { top: '15%', bottom: '10%', left: '10%', right: '10%' },
      xAxis: {
        type: 'category',
        data: chart.data.map((item) => item.name),
        axisLabel: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLabel: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: 'rgba(176,215,255,0.15)', type: 'dashed' } },
      },
      series: sourceSeries.map((series, index) => ({
          name: series.name,
          type: 'line' as const,
          symbol: index === 0 ? 'circle' : 'none',
          symbolSize: 8,
          smooth: index > 0,
          lineStyle: { color: series.color, type: index > 0 ? 'dashed' : 'solid' },
          itemStyle: { color: series.color },
          areaStyle: index === 0 ? {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: `${series.color}66` },
              { offset: 1, color: `${series.color}00` },
            ]),
          } : undefined,
          data: series.data,
        })),
    }
  }

  if (chart.variant === 'maturityTrend') {
    return {
      tooltip: { trigger: 'axis', confine: true },
      grid: { top: '12%', left: '10%', right: '8%', bottom: '12%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: chart.data.map((item) => item.name),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#0c5b9b' } },
        axisLabel: { color: '#78c0e6', fontSize: rem * 0.11 },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        axisTick: { show: false },
        axisLine: { show: false },
        axisLabel: { color: '#78c0e6', formatter: '{value}%' },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.12)', type: 'dashed' } },
      },
      series: [
        {
          type: 'line' as const,
          smooth: true,
          symbol: 'circle',
          symbolSize: 7,
          lineStyle: { width: 3, color: '#00ffe0' },
          itemStyle: { color: '#fff', borderColor: '#00ffe0', borderWidth: 2 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(0,198,186,0.62)' },
              { offset: 1, color: 'rgba(0,136,198,0)' },
            ]),
          },
          data: chart.data.map((item) => item.value),
        },
      ],
    }
  }

  if (chart.variant === 'weatherForecast') {
    const lows = chart.data.map((item) => item.compare ?? item.value - 5)
    return {
      tooltip: { trigger: 'axis', confine: true },
      legend: {
        top: 0,
        right: 5,
        data: ['最高温', '最低温'],
        textStyle: { color: '#8a9baf', fontSize: rem * 0.1 },
      },
      grid: { top: '20%', left: '4%', right: '5%', bottom: '12%', containLabel: true },
      xAxis: {
        type: 'category',
        data: chart.data.map((item) => item.name),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#8a9baf', fontSize: rem * 0.1 },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#78c0e6', formatter: '{value}°' },
        splitLine: { lineStyle: { color: 'rgba(176,215,255,0.12)', type: 'dashed' } },
      },
      series: [
        {
          name: '最高温',
          type: 'line' as const,
          smooth: true,
          symbolSize: 6,
          lineStyle: { color: '#ffab00' },
          itemStyle: { color: '#ffab00' },
          data: chart.data.map((item) => item.value),
        },
        {
          name: '最低温',
          type: 'line' as const,
          smooth: true,
          symbolSize: 6,
          lineStyle: { color: '#30c1ff' },
          itemStyle: { color: '#30c1ff' },
          areaStyle: { color: 'rgba(48,193,255,0.18)' },
          data: lows,
        },
      ],
    }
  }

  if (chart.type === 'donut') {
    return {
      color: ['#9966ff', '#6c95e6', '#00ffff'],
      tooltip: { trigger: 'item' },
      title: {
        text: chart.title,
        left: 'center',
        top: '44%',
        textStyle: {
          color: '#ffffff',
          fontFamily: 'Noto Sans SC, Microsoft YaHei, sans-serif',
          fontSize: 14,
          fontWeight: 700,
        },
      },
      series: [
        {
          type: 'pie' as const,
          radius: ['31%', '47%'],
          center: ['50%', '50%'],
          silent: true,
          label: { show: false },
          itemStyle: { opacity: 0.78 },
          data: chart.data.map((item) => ({ name: item.name, value: item.value })),
        },
        {
          type: 'pie' as const,
          radius: ['55%', '70%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: true,
          label: { show: false },
          labelLine: { show: false },
          itemStyle: {
            borderColor: 'rgba(6, 31, 68, 0.42)',
            borderWidth: 1,
          },
          data: chart.data.map((item) => ({ name: item.name, value: item.value })),
        },
      ],
    }
  }

  if (chart.type === 'line') {
    const sourceSeries = chart.series?.length
      ? chart.series
      : [{ name: chart.title, color: '#30dfff', data: chart.data.map((item) => item.value) }]
    return {
      color: sourceSeries.map((series) => series.color),
      tooltip: { trigger: 'axis' },
      legend: sourceSeries.length > 1
        ? { top: 0, right: 0, data: sourceSeries.map((series) => series.name), textStyle: { color: '#c5f3ff' } }
        : undefined,
      grid: { top: 20, right: 12, bottom: 26, left: 38 },
      xAxis: { type: 'category', data: chart.data.map((item) => item.name), ...axisStyle },
      yAxis: { type: 'value', name: chart.unit, nameTextStyle: { color: '#8fdcff' }, ...axisStyle },
      series: sourceSeries.map((series, index) => ({
          name: series.name,
          type: 'line' as const,
          smooth: true,
          symbolSize: 7,
          lineStyle: { color: series.color, type: index === 0 ? 'dashed' : 'solid' },
          itemStyle: { color: series.color },
          areaStyle: index === sourceSeries.length - 1 ? { color: `${series.color}2e` } : undefined,
          data: series.data,
        })),
    }
  }

  if (chart.type === 'stack') {
    return {
      color: ['#38df82', '#ec6b46', '#38a8ff', '#f2c654'],
      tooltip: { trigger: 'item' },
      grid: { top: 12, right: 8, bottom: 22, left: 34 },
      xAxis: { type: 'category', data: chart.data.map((item) => item.name), ...axisStyle },
      yAxis: { type: 'value', ...axisStyle },
      series: [{ type: 'bar' as const, barWidth: 18, data: chart.data.map((item) => item.value) }],
    }
  }

  return {
    color: ['#22d7ff', '#38df82'],
    tooltip: { trigger: 'axis' },
    legend: {
      top: 0,
      right: 0,
      textStyle: { color: '#c5f3ff', fontSize: 10 },
      itemWidth: 14,
      itemHeight: 8,
    },
    grid: { top: 28, right: 8, bottom: 26, left: 38 },
    xAxis: { type: 'category', data: chart.data.map((item) => item.name), ...axisStyle },
    yAxis: { type: 'value', name: chart.unit, nameTextStyle: { color: '#8fdcff' }, ...axisStyle },
    series: [
      {
        name: chart.data.some((item) => item.compare !== undefined) ? '完成量' : chart.title,
        type: 'bar' as const,
        barWidth: 14,
        data: chart.data.map((item) => item.value),
      },
      ...(chart.data.some((item) => item.compare !== undefined)
        ? [
            {
              name: '任务量',
              type: 'bar' as const,
              barWidth: 14,
              data: chart.data.map((item) => item.compare ?? 0),
            },
          ]
        : []),
    ],
  }
}

function renderChart(): void {
  if (!chartInstance) return
  chartInstance.setOption(makeOption(props.chart), true)
}

onMounted(() => {
  if (!chartEl.value) return
  chartInstance = echarts.init(chartEl.value)
  renderChart()
  resizeObserver = new ResizeObserver(() => {
    chartInstance?.resize()
    renderChart()
  })
  resizeObserver.observe(chartEl.value)
})

watch(
  () => props.chart,
  () => renderChart(),
  { deep: true },
)

onUnmounted(() => {
  resizeObserver?.disconnect()
  chartInstance?.dispose()
  chartInstance = null
})
</script>
