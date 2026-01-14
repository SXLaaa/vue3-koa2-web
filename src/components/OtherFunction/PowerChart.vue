<template>
  <div class="power-chart-container">
    <div class="container">
      <div class="content-wrapper">
        <div class="chart-container">
          <div ref="chartRef" class="chart-wrapper"></div>
        </div>
        <div class="legend-container">
          <div class="legend-list">
            <div
              v-for="(item, index) in timeLegend"
              :key="index"
              class="legend-item"
              @mouseenter="highlightPeriod(item.name)"
              @mouseleave="resetHighlight"
            >
              <div
                class="color-box"
                :style="{ backgroundColor: item.color }"
              ></div>
              <div class="legend-text">
                <div class="legend-name">{{ item.name }}</div>
                <div class="legend-time">时段: {{ item.timeRange }}</div>
              </div>
              <div class="legend-value">{{ item.value }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from "echarts";

export default {
  name: "PowerChart",
  data() {
    return {
      chartInstance: null,
      hours: [
        "00",
        "01",
        "02",
        "03",
        "04",
        "05",
        "06",
        "07",
        "08",
        "09",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "20",
        "21",
        "22",
        "23",
      ],

      // 时段图例数据
      timeLegend: [
        {
          name: "平",
          timeRange: "08:00-11:00, 13:00-18:00",
          value: 1,
          color: "#00e5ff",
        },
        {
          name: "峰",
          timeRange: "12:00-12:00, 19:00-22:00",
          value: 1.7,
          color: "#ffa726",
        },
        {
          name: "尖峰",
          timeRange: "19:00-21:00 (夏季)",
          value: 2,
          color: "#ff7043",
        },
        {
          name: "深谷",
          timeRange: "00:00-06:00",
          value: 0.1,
          color: "#2979ff",
        },
        {
          name: "谷",
          timeRange: "06:00-08:00, 22:00-24:00",
          value: 0.3,
          color: "#29b6f6",
        },
      ],

      // 时段定义
      timePeriods: [
        {
          name: "深谷",
          start: 0,
          end: 6,
          color: "rgba(41, 121, 255, 0.3)",
          textColor: "#2979ff",
          value: 0.1,
        },
        {
          name: "谷",
          start: 6,
          end: 8,
          color: "rgba(41, 182, 246, 0.3)",
          textColor: "#29b6f6",
          value: 0.3,
        },
        {
          name: "平",
          start: 8,
          end: 11,
          color: "rgba(0, 229, 255, 0.3)",
          textColor: "#00e5ff",
          value: 1,
        },
        {
          name: "峰",
          start: 12,
          end: 12,
          color: "rgba(255, 167, 38, 0.3)",
          textColor: "#ffa726",
          value: 1.7,
        },
        {
          name: "平",
          start: 13,
          end: 18,
          color: "rgba(0, 229, 255, 0.3)",
          textColor: "#00e5ff",
          value: 1,
        },
        {
          name: "尖峰",
          start: 19,
          end: 21,
          color: "rgba(255, 112, 67, 0.3)",
          textColor: "#ff7043",
          value: 2,
        },
        {
          name: "峰",
          start: 22,
          end: 22,
          color: "rgba(255, 167, 38, 0.3)",
          textColor: "#ffa726",
          value: 1.7,
        },
        {
          name: "谷",
          start: 23,
          end: 23,
          color: "rgba(41, 182, 246, 0.3)",
          textColor: "#29b6f6",
          value: 0.3,
        },
      ],

      // 图表数据
      data202407Original: [],
      data202507: [],
      data202407: [],
      loadIncrement: [],
    };
  },
  mounted() {
    this.initChart();
    window.addEventListener("resize", this.handleResize);
  },
  beforeDestroy() {
    if (this.chartInstance) {
      this.chartInstance.dispose();
    }
    window.removeEventListener("resize", this.handleResize);
  },
  methods: {
    // 生成模拟数据
    generateData() {
      const data202407Original = [
        10000, 15000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000,
        10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000,
        10000, 10000, 10000, 10000,
      ];

      const data202507 = [
        15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000,
        15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000,
        15000, 15000, 15000, 15000,
      ];

      const data202407 = [];
      const loadIncrement = [];

      // 生成更真实的负荷曲线
      for (let i = 0; i < 24; i++) {
        // 2024年7月调整后数据 - 基于原始数据调整
        let value = data202407Original[i];
        if (i >= 9 && i <= 11) value = value * 0.95; // 上午高峰降低
        if (i >= 19 && i <= 22) value = value * 0.94; // 晚间高峰降低
        if (i >= 0 && i <= 6) value = value * 1.08; // 夜间低谷增加
        if (i >= 13 && i <= 15) value = value * 1.05; // 午后增加

        data202407.push(Math.max(5000, value + Math.random() * 1000 - 500));

        // 负荷增量 = 2025年负荷 - 2024年调整后负荷
        loadIncrement.push(data202507[i] - data202407[i]);
      }

      return { data202407Original, data202507, data202407, loadIncrement };
    },

    // 生成时段区域数据
    createMarkArea(periods) {
      return periods.map((period) => {
        return [
          {
            xAxis: period.start,
            itemStyle: {
              color: period.color,
            },
          },
          {
            xAxis: period.end,
          },
        ];
      });
    },

    // 初始化图表
    initChart() {
      const chartData = this.generateData();
      this.data202407Original = chartData.data202407Original;
      this.data202507 = chartData.data202507;
      this.data202407 = chartData.data202407;
      this.loadIncrement = chartData.loadIncrement;

      this.chartInstance = echarts.init(this.$refs.chartRef, "dark");

      const option = this.getChartOption();
      this.chartInstance.setOption(option);
    },

    // 获取图表配置
    getChartOption() {
      return {
        backgroundColor: "transparent",
        title: {
          text: "同比移峰 60.48万千瓦",
          left: "center",
          top: 10,
          textStyle: {
            color: "#fff",
            fontSize: 18,
            fontWeight: "normal",
          },
        },
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "cross",
            crossStyle: {
              color: "#999",
            },
          },
          backgroundColor: "rgba(10, 25, 49, 0.9)",
          borderColor: "#2a5caa",
          textStyle: {
            color: "#fff",
          },
          formatter: (params) => {
            let result = `<div style="margin-bottom:5px">时间: ${params[0].name}:00</div>`;

            // 添加时段信息
            const hour = parseInt(params[0].name);
            let periodName = "";
            let periodColor = "";
            let periodValue = "";

            for (const period of this.timePeriods) {
              if (hour >= period.start && hour <= period.end) {
                periodName = period.name;
                periodColor = period.textColor;
                periodValue = period.value;
                break;
              }
            }

            if (periodName) {
              result += `<div style="margin-bottom:5px">
                <span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${periodColor};margin-right:5px"></span>
                时段: <span style="color:${periodColor}; font-weight:bold">${periodName}</span>, 费率系数: <span style="font-weight:bold">${periodValue}</span>
              </div>`;
            }

            params.forEach((item) => {
              let value = item.value;
              if (item.seriesName === "负荷增量") {
                value = value >= 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
              } else {
                value = value.toFixed(2);
              }

              const color = item.color;
              result += `
                <div>
                  <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};margin-right:5px"></span>
                  ${item.seriesName}: <span style="font-weight:bold;color:#5dafff">${value}</span> 万千瓦
                </div>
              `;
            });

            return result;
          },
        },
        legend: {
          data: ["202407原始", "202507", "202407", "负荷增量"],
          top: 40,
          textStyle: {
            color: "#e6f7ff",
          },
          itemWidth: 20,
          itemHeight: 10,
          itemGap: 20,
        },
        grid: {
          left: 60,
          right: 60,
          bottom: 100,
          top: 100,
          containLabel: false,
        },
        xAxis: [
          {
            type: "category",
            data: this.hours,
            nameLocation: "middle",
            nameGap: 30,
            nameTextStyle: {
              color: "#a0c8ff",
              fontSize: 14,
            },
            axisLine: {
              lineStyle: {
                color: "#2a5caa",
              },
            },
            axisLabel: {
              color: "#a0c8ff",
              fontSize: 12,
            },
            axisTick: {
              alignWithLabel: true,
            },
          },
        ],
        yAxis: [
          {
            type: "value",
            name: "万千瓦",
            nameTextStyle: {
              color: "#a0c8ff",
              fontSize: 14,
            },
            position: "left",
            axisLine: {
              show: true,
              lineStyle: {
                color: "#2a5caa",
              },
            },
            axisLabel: {
              color: "#a0c8ff",
              fontSize: 12,
              formatter: "{value}",
            },
            splitLine: {
              lineStyle: {
                color: "rgba(42, 92, 170, 0.3)",
                type: "dashed",
              },
            },
            min: 0,
            max: 30000,
            interval: 5000,
          },
          {
            type: "value",
            name: "负荷增量",
            nameTextStyle: {
              color: "#a0c8ff",
              fontSize: 14,
            },
            position: "right",
            axisLine: {
              show: true,
              lineStyle: {
                color: "#ffa726",
              },
            },
            axisLabel: {
              color: "#a0c8ff",
              fontSize: 12,
              formatter: (value) => {
                return value >= 0 ? `+${value}` : value;
              },
            },
            splitLine: {
              show: false,
            },
          },
        ],
        series: [
          {
            name: "202407原始",
            type: "line",
            smooth: true,
            lineStyle: {
              color: "#00e5ff",
              width: 3,
            },
            symbol: "circle",
            symbolSize: 6,
            itemStyle: {
              color: "#00e5ff",
            },
            data: this.data202407Original,
            markArea: {
              silent: true,
              itemStyle: {
                color: "rgba(0, 100, 200, 0.1)",
              },
              data: this.createMarkArea(this.timePeriods),
            },
          },
          {
            name: "202507",
            type: "line",
            smooth: true,
            lineStyle: {
              color: "#ff6b6b",
              width: 3,
            },
            symbol: "circle",
            symbolSize: 6,
            itemStyle: {
              color: "#ff6b6b",
            },
            data: this.data202507,
          },
          {
            name: "202407",
            type: "line",
            smooth: true,
            lineStyle: {
              color: "#4cd964",
              width: 3,
            },
            symbol: "circle",
            symbolSize: 6,
            itemStyle: {
              color: "#4cd964",
            },
            data: this.data202407,
          },
          {
            name: "负荷增量",
            type: "bar",
            yAxisIndex: 1,
            barWidth: "60%",
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "#ffa726" },
                { offset: 1, color: "#ff7043" },
              ]),
              borderRadius: [2, 2, 0, 0],
            },
            data: this.loadIncrement,
          },
        ],
        graphic: [
          {
            type: "text",
            left: "center",
            top: 80,
            style: {
              text: "同比填谷 136.17万千瓦",
              fill: "#5dafff",
              fontSize: 16,
              fontWeight: "bold",
            },
          },
        ],
      };
    },

    // 处理窗口大小变化
    handleResize() {
      if (this.chartInstance) {
        this.chartInstance.resize();
      }
    },

    // 高亮时段
    highlightPeriod(periodName) {
      console.log(`高亮 ${periodName} 时段`);
      // 这里可以添加高亮对应时段的逻辑
    },

    // 重置高亮
    resetHighlight() {
      console.log("重置高亮");
    },
  },
};
</script>

<style scoped>
.power-chart-container {
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  background-color: #0a1931;
  color: #e6f7ff;
  padding: 20px;
  min-height: 100vh;
}

.container {
  max-width: 1600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.content-wrapper {
  display: flex;
  gap: 20px;
}

.chart-container {
  background-color: #0d1b3e;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
  flex: 1;
}

.chart-wrapper {
  width: 100%;
  height: 700px;
}

.legend-container {
  background-color: #0d1b3e;
  border-radius: 12px;
  padding: 20px;
  width: 300px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
}
.legend-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.legend-item {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.legend-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
  transform: translateX(5px);
}

.color-box {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  margin-right: 15px;
}

.legend-text {
  flex: 1;
}

.legend-name {
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
}

.legend-time {
  font-size: 12px;
  color: #a0c8ff;
  margin-top: 2px;
}

.legend-value {
  font-size: 20px;
  font-weight: 700;
  color: #5dafff;
}

.stat-item {
  background: rgba(22, 93, 255, 0.15);
  border-radius: 10px;
  padding: 15px 25px;
  min-width: 200px;
  text-align: center;
  border: 1px solid rgba(22, 93, 255, 0.3);
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #5dafff;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #a0c8ff;
}

@media (max-width: 1200px) {
  .content-wrapper {
    flex-direction: column;
  }

  .legend-container {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .chart-wrapper {
    height: 500px;
  }

  .stat-item {
    min-width: 150px;
    padding: 12px 20px;
  }
}
</style>