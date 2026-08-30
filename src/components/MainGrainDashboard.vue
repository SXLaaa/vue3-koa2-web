<template>
  <main class="grain-screen mainBox" :class="[`module-${activeModule}`, `screen-${activeSub}`]">
    <DashboardMap
      :dataset="screenData"
      :selected-district="selectedDistrict"
      :active-crop="activeCrop"
      :timeline-text="activeTimelineText"
      @select-district="selectDistrict"
    />
    <div class="right-decoration" aria-hidden="true" />

    <header class="screen-header header">
      <h1 class="headerTitle">青岛市主粮作物遥感监测平台</h1>
      <nav class="navBox" aria-label="专题导航">
        <button
          v-for="item in dashboardModules"
          :key="item.key"
          class="navItem"
          :class="{ checkNav: activeModule === item.key }"
          type="button"
          @click="selectModule(item.key)"
        >
          {{ item.name }}
        </button>
        <a
          v-if="showAdminEntry"
          class="dashboardAdminEntry"
          data-testid="dashboard-admin-entry"
          href="#/admin"
          aria-label="进入后台管理"
          title="进入后台管理"
        >
          <span class="dashboardAdminEntryIcon" aria-hidden="true" />
        </a>
        <span v-else class="homeIconPlaceholder" aria-hidden="true" />
      </nav>
    </header>

    <section class="screen-main">
      <section v-if="screenData.cropOptions" class="topClassBox">
        <div class="classTitle">种植分类</div>
        <div class="classNavBox">
          <button
            v-for="crop in screenData.cropOptions"
            :key="crop.value"
            type="button"
            class="classItem"
            :class="{ checkClass: crop.value === activeCrop }"
            @click="selectCrop(crop.value)"
          >
            {{ crop.label }}
          </button>
        </div>
      </section>

      <section v-if="isWeatherScreen" class="topTypeBox" aria-label="气象灾害类型">
        <div class="topTypeContent">
          <button
            v-for="type in weatherAlertTypes"
            :key="type"
            type="button"
            class="topTypeItem"
            :class="{ checkTopType: weatherAlertType === type }"
            @click="selectWeatherType(type)"
          >
            {{ type }}
          </button>
        </div>
      </section>

      <nav class="childrenNav" aria-label="子专题导航">
        <button
          v-for="child in activeModuleConfig.children"
          :key="child.id"
          type="button"
          class="childrenItem"
          :class="{ isActive: child.id === activeSub }"
          :aria-current="child.id === activeSub ? 'page' : undefined"
          @click="selectSub(child.id)"
        >
          <span :class="{ checkChildren: child.id === activeSub }">{{ child.name }}</span>
        </button>
      </nav>

      <aside class="rightBoard" tabindex="0" aria-label="专题数据面板">
        <div class="palceClass">
          <i class="placeIcon" aria-hidden="true" />
          <span class="placeCity">{{ placeName }}</span>
          <span v-if="currentPlaceName" class="placeSeparator">·</span>
          <span v-if="currentPlaceName" class="nowPlace">{{ currentPlaceName }}</span>
        </div>

        <template v-if="isCultivatedLandScreen">
          <section class="sourcePanel gdmjClass">
            <h2 class="divBoxHeader">耕地面积</h2>
            <div class="gdmjContent">
              <div class="gdmjName">
                <span class="cityName">青岛</span>
                <span class="gdTitle">耕地总面积</span>
              </div>
              <div class="gdNum">
                <span>{{ farmlandTotal.value }}</span>
                <span class="gdUnit">{{ farmlandTotal.unit }}</span>
              </div>
              <div class="gdDesc">
                <span>{{ farmlandPercent.label }}</span>
                <span class="gdPercent">{{ farmlandPercent.value }}</span>
                <span>{{ farmlandPercent.unit }}</span>
              </div>
            </div>
          </section>

          <section class="sourcePanel gdfxClass">
            <h2 class="divBoxHeader">耕地分析</h2>
            <div class="farmlandTabWrap">
              <div class="farmlandTabs" role="tablist" aria-label="耕地分析类型">
                <button
                  type="button"
                  class="farmlandTab"
                  :class="{ btnActive: farmlandAnalysisMode === 'area' }"
                  role="tab"
                  :aria-selected="farmlandAnalysisMode === 'area'"
                  @click="farmlandAnalysisMode = 'area'"
                >
                  占地面积
                </button>
                <button
                  type="button"
                  class="farmlandTab"
                  :class="{ btnActive: farmlandAnalysisMode === 'trend' }"
                  role="tab"
                  :aria-selected="farmlandAnalysisMode === 'trend'"
                  @click="farmlandAnalysisMode = 'trend'"
                >
                  趋势分析
                </button>
              </div>
            </div>
            <div class="fxContent">
              <ChartBox :chart="farmlandAnalysisChart" class="fxEcharts" />
              <div v-if="farmlandMaximum" class="fxRow">
                <span class="fxTitle">最大面积：</span>
                <span>{{ farmlandMaximum.name }}</span>
                <span class="fxNum">{{ farmlandMaximum.value }}</span>
                <span>{{ farmlandMaximum.unit }}</span>
              </div>
              <div v-if="farmlandMinimum" class="fxRow">
                <span class="fxTitle">最小面积：</span>
                <span>{{ farmlandMinimum.name }}</span>
                <span class="fxNum">{{ farmlandMinimum.value }}</span>
                <span>{{ farmlandMinimum.unit }}</span>
              </div>
            </div>
          </section>

          <section class="sourcePanel gdReportClass">
            <h2 class="divBoxHeader">耕地监测报告</h2>
            <div class="scroll-container" tabindex="0" aria-label="耕地监测报告列表">
              <div
                class="reportContent"
                :class="{ 'is-scrolling': farmlandReports.length > 2 }"
              >
                <button
                  v-for="(report, index) in farmlandReports"
                  :key="`${report.title}-${report.date}-${index}`"
                  type="button"
                  class="reportItem"
                  :class="{ 'is-active': selectedReportIndex === index }"
                  :aria-pressed="selectedReportIndex === index"
                  @click="selectedReportIndex = index"
                >
                  <span class="reportTitle">{{ report.title }}</span>
                  <span class="reportTime">{{ report.date }}</span>
                </button>
              </div>
            </div>
          </section>
        </template>

        <template v-else-if="isHighStandardScreen">
          <section class="sourcePanel gbzClass">
            <h2 class="divBoxHeader">高标准农田面积</h2>
            <div class="gdmjContent">
              <div class="gdmjName">
                <span class="cityName">{{ currentPlaceName || '青岛市' }}</span>
                <span class="gdTitle">高标准农田总面积</span>
              </div>
              <div class="gdNum">
                <span>{{ farmlandTotal.value }}</span>
                <span class="gdUnit">{{ farmlandTotal.unit }}</span>
              </div>
              <div class="gdDesc">
                <span>
                  {{
                    currentPlaceName
                      ? '占青岛市高标准农田总面积的'
                      : farmlandPercent.label
                  }}
                </span>
                <span class="gdPercent">{{ farmlandPercent.value }}</span>
                <span>{{ farmlandPercent.unit }}</span>
              </div>
            </div>
          </section>

          <section class="sourcePanel gbzfxClass">
            <h2 class="divBoxHeader">高标准农田分析</h2>
            <div class="fxContent">
              <ChartBox :chart="highStandardChart" class="fxEcharts" />
              <div v-if="farmlandMaximum" class="fxRow">
                <span class="fxTitle">最大面积：</span>
                <span>{{ farmlandMaximum.name }}</span>
                <span class="fxNum">{{ farmlandMaximum.value }}</span>
                <span>{{ farmlandMaximum.unit }}</span>
              </div>
              <div v-if="farmlandMinimum" class="fxRow">
                <span class="fxTitle">最小面积：</span>
                <span>{{ farmlandMinimum.name }}</span>
                <span class="fxNum">{{ farmlandMinimum.value }}</span>
                <span>{{ farmlandMinimum.unit }}</span>
              </div>
            </div>
          </section>
        </template>

        <template v-else-if="isBasicProtectionScreen">
          <section class="sourcePanel ysflhBox">
            <h2 class="divBoxHeader">疑似非粮化统计</h2>
            <div class="ysflhContent">
              <div class="ysflhImg" aria-hidden="true" />
              <div class="ysfRight">
                <div class="rightTop protectionTabWrap">
                  <div class="protectionTabs" role="tablist" aria-label="疑似非粮化统计类型">
                    <button
                      type="button"
                      class="protectionTab"
                      role="tab"
                      :class="{ btnActive: protectionSummaryMode === 'area' }"
                      :aria-selected="protectionSummaryMode === 'area'"
                      @click="protectionSummaryMode = 'area'"
                    >
                      面积
                    </button>
                    <button
                      type="button"
                      class="protectionTab"
                      role="tab"
                      :class="{ btnActive: protectionSummaryMode === 'count' }"
                      :aria-selected="protectionSummaryMode === 'count'"
                      @click="protectionSummaryMode = 'count'"
                    >
                      数量
                    </button>
                  </div>
                </div>
                <div class="rightCenter">
                  <span class="rightNum">{{ protectionSummary.value }}</span>
                  <span class="rightUnit">{{ protectionSummary.unit }}</span>
                </div>
                <div class="rightBottom">
                  <span class="bottomLeft">较上期</span>
                  <span class="downClass">↑ {{ protectionSummary.rate }}%</span>
                  <span class="bottomDesc">(+{{ protectionSummary.increase }}{{ protectionSummary.unit }})</span>
                </div>
              </div>
            </div>
          </section>

          <section class="sourcePanel ysflhFxBox">
            <h2 class="divBoxHeader">疑似非粮化分析</h2>
            <div class="protectionFxContent">
              <div class="protectionAnalysisTabs protectionTabWrap">
                <div class="protectionTabs" role="tablist" aria-label="疑似非粮化分析类型">
                  <button
                    type="button"
                    class="protectionTab"
                    role="tab"
                    :class="{ btnActive: protectionAnalysisMode === 'area' }"
                    :aria-selected="protectionAnalysisMode === 'area'"
                    @click="protectionAnalysisMode = 'area'"
                  >
                    面积
                  </button>
                  <button
                    type="button"
                    class="protectionTab"
                    role="tab"
                    :class="{ btnActive: protectionAnalysisMode === 'count' }"
                    :aria-selected="protectionAnalysisMode === 'count'"
                    @click="protectionAnalysisMode = 'count'"
                  >
                    数量
                  </button>
                </div>
              </div>
              <ChartBox :chart="protectionChart" class="ysflhEcharts" />
              <div class="protectionFxRow">
                <span class="fxTitle">最大{{ protectionAnalysisMode === 'area' ? '面积' : '数量' }}：</span>
                <span>{{ protectionMaximum.name }}</span>
                <span class="fxNum">{{ protectionMaximum.value }}</span>
                <span>{{ protectionMaximum.unit }}</span>
              </div>
              <div class="protectionFxRow">
                <span class="fxTitle">最小{{ protectionAnalysisMode === 'area' ? '面积' : '数量' }}：</span>
                <span>{{ protectionMinimum.name }}</span>
                <span class="fxNum">{{ protectionMinimum.value }}</span>
                <span>{{ protectionMinimum.unit }}</span>
              </div>
            </div>
          </section>
        </template>

        <template v-else-if="isPlantingTaskScreen">
          <section class="sourcePanel plantingSummaryPanel">
            <h2 class="divBoxHeader">种植任务</h2>
            <div class="plantingSummaryContent">
              <div class="plantingProgressBlock">
                <div class="plantingProgress">
                  <svg viewBox="0 0 100 100" aria-label="种植任务完成率">
                    <defs>
                      <linearGradient id="plantingCircleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stop-color="#62ffc8" />
                        <stop offset="100%" stop-color="#32d1e7" />
                      </linearGradient>
                    </defs>
                    <circle class="plantingProgressTrack" cx="50" cy="50" r="45" stroke-width="10" fill="none" />
                    <circle
                      class="plantingProgressValue"
                      cx="50"
                      cy="50"
                      r="45"
                      stroke="url(#plantingCircleGradient)"
                      stroke-width="10"
                      fill="none"
                      :stroke-dasharray="plantingCircleLength"
                      :stroke-dashoffset="plantingCircleOffset"
                      stroke-linecap="round"
                    />
                    <text x="50" y="55" text-anchor="middle" font-size="16" fill="#fff">
                      {{ plantingCompletion.value }}%
                    </text>
                  </svg>
                </div>
                <div class="plantingProgressLabel">完成率</div>
              </div>

              <div class="plantingSummaryValues">
                <div class="plantingMetricRow">
                  <div class="plantingMetricValue">
                    {{ plantingPlan.value }}
                    <span>{{ plantingPlan.unit }}</span>
                  </div>
                  <div class="plantingMetricLabel">种植任务</div>
                </div>
                <div class="plantingSeasonRow">
                  <div v-for="metric in plantingSeasons" :key="metric.label" class="plantingSeasonCard">
                    <div class="plantingSeasonValue">{{ metric.value }}</div>
                    <div class="plantingSeasonLabel">{{ metric.label }}<span>({{ metric.unit }})</span></div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section class="sourcePanel plantingAnalysisPanel">
            <h2 class="divBoxHeader">区县种植任务对比分析</h2>
            <ChartBox :chart="plantingTaskChart" class="plantingTaskChart" />
            <div class="plantingStatistics">
              <article v-for="(metric, index) in plantingMetrics" :key="metric.label" class="plantingStatistic">
                <img :src="plantingStatIcons[index]" alt="" />
                <div>
                  <span>{{ metric.label }}</span>
                  <strong>{{ metric.value }} <em>{{ metric.unit }}</em></strong>
                </div>
              </article>
            </div>
          </section>
        </template>

        <template v-else-if="isGrowthStageScreen">
          <section class="sourcePanel mqfxClass warningGrowthStagePanel">
            <h2 class="divBoxHeader">生育期分析</h2>
            <div class="mqfxContent">
              <ChartBox v-if="primaryPanel?.chart" :chart="primaryPanel.chart" class="bzqEcharts" />
              <div v-if="primaryPanel?.chart" class="bzqDesc">
                <div
                  v-for="(item, index) in primaryPanel.chart.data"
                  :key="item.name"
                  class="bzqItem"
                  :class="`color${index + 1}`"
                >
                  <span class="bzqTitle">{{ growthStageNames[index] }}</span>
                  <span class="bzqValue">{{ item.value }}%</span>
                  <span class="bzqDate">{{ item.name }}</span>
                </div>
              </div>
            </div>
          </section>

          <section v-if="secondaryPanel" class="sourcePanel adviceBox">
            <h2 class="divBoxHeader">管理措施建议</h2>
            <p class="adviceContent">{{ secondaryPanel.content }}</p>
          </section>
        </template>

        <template v-else-if="isSeedlingScreen">
          <section class="sourcePanel mqfxClass seedlingAnalysisPanel">
            <h2 class="divBoxHeader">苗情分析</h2>
            <div class="mqfxContent">
              <div class="mqTopBox">
                <article v-for="metric in warningHeadline" :key="metric.label" class="mapTopItem">
                  <span class="top_title">{{ metric.label }}</span>
                  <strong class="top_Type" :class="{ 'is-long': String(metric.value).length > 5 }">
                    {{ metric.value }}
                  </strong>
                  <small class="top_desc">{{ metric.subValue }}</small>
                </article>
              </div>
              <div class="mqEcharTitle">叶面积指数苗情分级</div>
              <ChartBox v-if="primaryPanel?.chart" :chart="primaryPanel.chart" class="mqEchartsBox" />
            </div>
          </section>

          <section class="sourcePanel reportBox warningReportBox">
            <h2 class="divBoxHeader">苗情监测报告</h2>
            <div class="warningScrollContainer" tabindex="0" aria-label="苗情监测报告列表">
              <div class="warningReportContent is-scrolling">
                <button
                  v-for="(report, index) in warningReports"
                  :key="`${report.title}-${index}`"
                  type="button"
                  class="warningReportItem"
                  :class="{ 'is-active': selectedReportIndex === index }"
                  :aria-pressed="selectedReportIndex === index"
                  :style="{ borderColor: warningReportColors[index % warningReportColors.length] }"
                  @click="selectedReportIndex = index"
                >
                  <strong>{{ report.title }}</strong>
                  <span>{{ report.date }}</span>
                  <small>{{ report.scope }}</small>
                </button>
              </div>
            </div>
          </section>
        </template>

        <template v-else-if="isGrowthScreen">
          <section class="sourcePanel levelBox">
            <h2 class="divBoxHeader">长势等级分析</h2>
            <div class="levelContent">
              <div class="mqTopBox">
                <article v-for="metric in warningHeadline" :key="metric.label" class="mapTopItem">
                  <span class="top_title">{{ metric.label }}</span>
                  <strong class="top_Type" :class="{ 'is-long': String(metric.value).length > 5 }">
                    {{ metric.value }}
                  </strong>
                  <small class="top_desc">{{ metric.subValue }}</small>
                </article>
              </div>
              <ChartBox v-if="primaryPanel?.chart" :chart="primaryPanel.chart" class="levelEcharts" />
            </div>
          </section>

          <section class="sourcePanel zsdbBox">
            <h2 class="divBoxHeader">长势对比分析</h2>
            <ChartBox v-if="secondaryPanel?.chart" :chart="secondaryPanel.chart" class="zsdbEcharts" />
          </section>
        </template>

        <template v-else-if="isMaturityScreen">
          <section class="sourcePanel csdycBox">
            <h2 class="divBoxHeader">成熟度预测</h2>
            <div class="csdycContent">
              <div class="csdTop">
                <div class="maturityCircle" :style="{ '--maturity': `${maturityPercent * 3.6}deg` }">
                  <div>
                    <strong>{{ maturityPercent }}%</strong>
                    <span>{{ maturityStatus }}</span>
                  </div>
                </div>
                <div class="nowTitle">当前成熟度</div>
              </div>
              <div class="csdBottom">
                <img class="csdImg" :src="maturityHarvestIcon" alt="" />
                <div class="csdContent">
                  <div class="csdTitle">最佳采收期</div>
                  <div class="csdTime">{{ maturityHarvestPeriod }}</div>
                  <div class="csdDesc">建议在此期间内完成收割</div>
                </div>
              </div>
            </div>
          </section>

          <section class="sourcePanel csdTrendBox">
            <h2 class="divBoxHeader">成熟度趋势</h2>
            <ChartBox v-if="primaryPanel?.chart" :chart="primaryPanel.chart" class="csdEcharts" />
          </section>
        </template>

        <template v-else-if="isWeatherScreen">
          <section class="sourcePanel ssqxBox">
            <h2 class="divBoxHeader">{{ weatherPage === 'current' ? '实时气象' : '7天预报' }}</h2>
            <div class="ssqxContent">
              <div v-if="weatherPage === 'current'" class="ssqxOne">
                <article v-for="(metric, index) in screenData.headline" :key="metric.label" class="ssqxItem">
                  <img class="ssqxImg" :src="weatherIcons[index]" alt="" />
                  <div class="ssqxRight">
                    <span class="ssqxTitle">{{ metric.label }}</span>
                    <strong class="ssqxValue">{{ metric.value }} <em>{{ metric.unit }}</em></strong>
                    <small class="ssqxDesc">{{ metric.subValue }}</small>
                  </div>
                </article>
              </div>
              <div v-else class="ssqxTwo">
                <ChartBox :chart="weatherForecastChart" class="weatherEcharts" />
              </div>
              <div class="ssqxPageBox" role="tablist" aria-label="气象信息页">
                <button
                  type="button"
                  class="pageItem"
                  :class="{ checkPage: weatherPage === 'current' }"
                  aria-label="实时气象"
                  @click="weatherPage = 'current'"
                />
                <button
                  type="button"
                  class="pageItem"
                  :class="{ checkPage: weatherPage === 'forecast' }"
                  aria-label="7天预报"
                  @click="weatherPage = 'forecast'"
                />
              </div>
            </div>
          </section>

          <section class="sourcePanel wdErrBox">
            <h2 class="divBoxHeader" />
            <div class="wdErrContent">
              <div class="wdErrTop">
                <article
                  v-for="(metric, index) in weatherDisasterMetrics.slice(0, 3)"
                  :key="metric.label"
                  class="wdErrItem"
                  :style="{ boxShadow: `inset 0 0 20px 0 ${weatherAlertColors[index]}` }"
                >
                  <span class="wdTitle">{{ metric.label }}</span>
                  <strong class="wdValue" :style="{ color: weatherAlertColors[index] }">
                    {{ metric.value }}{{ metric.unit }}
                  </strong>
                </article>
              </div>
              <div v-if="weatherDisasterMetrics[3]" class="wdTips">
                {{ weatherDisasterMetrics[3].label }}
                <strong class="tipsValue">
                  {{ weatherDisasterMetrics[3].value }}{{ weatherDisasterMetrics[3].unit }}
                </strong>
              </div>
            </div>
          </section>

          <section class="sourcePanel gdReportClass weatherReportBox">
            <h2 class="divBoxHeader">病虫害监测报告</h2>
            <div class="scroll-container" tabindex="0" aria-label="病虫害监测报告列表">
              <div class="reportContent is-scrolling">
                <button
                  v-for="(report, index) in warningReports"
                  :key="`${report.title}-${index}`"
                  type="button"
                  class="reportItem"
                  :class="{ 'is-active': selectedReportIndex === index }"
                  :aria-pressed="selectedReportIndex === index"
                  @click="selectedReportIndex = index"
                >
                  <span class="reportTitle">{{ report.title }}</span>
                  <span class="reportTime">{{ report.date }}</span>
                </button>
              </div>
            </div>
          </section>
        </template>

        <template v-else>
          <section class="sourcePanel metricPanel">
            <h2 class="divBoxHeader">{{ screenData.title }}</h2>
            <div class="headlineMetrics" :class="`metrics-${screenData.headline.length}`">
              <article
                v-for="metric in screenData.headline"
                :key="metric.label"
                :class="`accent-${metric.accent ?? 'cyan'}`"
              >
                <span>{{ metric.label }}</span>
                <strong>{{ metric.value }}<em v-if="metric.unit">{{ metric.unit }}</em></strong>
                <small v-if="metric.subValue">{{ metric.subValue }}</small>
              </article>
            </div>
          </section>

          <section
            v-for="panel in screenData.panels"
            :key="panel.title"
            class="sourcePanel detailPanel"
            :class="`panel-${panel.kind}`"
          >
            <h2 class="divBoxHeader">{{ panel.title }}</h2>

            <div v-if="panel.kind === 'metrics'" class="miniMetrics">
              <article
                v-for="metric in panel.metrics"
                :key="metric.label"
                :class="`accent-${metric.accent ?? 'cyan'}`"
              >
                <span>{{ metric.label }}</span>
                <strong>{{ metric.value }}<em v-if="metric.unit">{{ metric.unit }}</em></strong>
                <small v-if="metric.subValue">{{ metric.subValue }}</small>
              </article>
            </div>

            <ChartBox v-if="panel.kind === 'chart' && panel.chart" :chart="panel.chart" />

            <ul v-if="panel.kind === 'reports'" class="reportList">
              <li v-for="report in panel.reports" :key="`${report.title}-${report.date}`">
                <strong>{{ report.title }}</strong>
                <span>{{ report.date }}</span>
                <small v-if="report.scope">{{ report.scope }}</small>
              </li>
            </ul>

            <p v-if="panel.kind === 'advice'" class="adviceContent">{{ panel.content }}</p>
          </section>
        </template>
      </aside>

      <section class="mapTipsBox" :class="{ weatherMapTips: isWeatherScreen }">
        <h2>{{ isWeatherScreen ? weatherAlertType : screenData.map.legendTitle }}</h2>
        <div v-if="isWeatherScreen" class="weatherLegend">
          <i class="weatherColor" />
          <div class="weatherLegendLabels">
            <span v-for="item in screenData.map.legend" :key="item.label">{{ item.label }}</span>
          </div>
        </div>
        <div v-else>
          <div v-for="item in screenData.map.legend" :key="item.label" class="colorInfo">
            <i class="colorBox" :style="{ background: item.color }" />
            <span class="colorName">{{ item.label }}</span>
          </div>
        </div>
      </section>

      <section v-if="activeModule === 'warning' && screenData.timeline?.length" class="dateTimeLine">
        <div class="dateLeft">
          <select
            class="leftDateClass"
            :value="screenData.year"
            aria-label="选择年份"
            @change="selectTimelineYear"
          >
            <option v-for="year in timelineYears" :key="year" :value="year">{{ year }}</option>
          </select>
          <span class="yearSelectArrow" aria-hidden="true" />
        </div>
        <div class="dateRight">
          <button type="button" class="arrButton leftIcon" aria-label="上一期" @click="moveTimeline(-1)">
            <span class="timelineChevron timelineChevron--left" aria-hidden="true" />
          </button>
          <div class="dateCenterBox">
            <div
              v-for="(item, index) in displayTimeline"
              :key="`${item.label}-${item.date}`"
              class="dateItem"
              :class="{ checkDate: item.active }"
              role="button"
              tabindex="0"
              @click="selectTimeline(index)"
              @keydown.enter="selectTimeline(index)"
            >
              <div class="dateType">{{ item.label }}</div>
              <div class="dateLine"><i class="dataCircle" /></div>
              <div class="dateValue">{{ formatTimelineDate(item.date) }}</div>
            </div>
          </div>
          <button type="button" class="arrButton rightIcon" aria-label="下一期" @click="moveTimeline(1)">
            <span class="timelineChevron timelineChevron--right" aria-hidden="true" />
          </button>
        </div>
      </section>

      <section v-else-if="screenData.timeline?.length" class="timeLineBox">
        <button type="button" class="timeArrow" aria-label="上一期" @click="moveTimeline(-1)">
          <span class="timelineChevron timelineChevron--left" aria-hidden="true" />
        </button>
        <div class="timeCenter">
          <button
            v-for="(item, index) in displayTimeline"
            :key="`${item.label}-${item.date}`"
            type="button"
            class="timeItem"
            :class="{ checkLine: item.active }"
            @click="selectTimeline(index)"
          >
            <i class="lineClass"><span /></i>
            <strong>{{ item.date }}</strong>
            <small>{{ item.label }}</small>
          </button>
        </div>
        <button type="button" class="timeArrow" aria-label="下一期" @click="moveTimeline(1)">
          <span class="timelineChevron timelineChevron--right" aria-hidden="true" />
        </button>
      </section>
    </section>

    <div v-if="loading" class="screenMask">加载中...</div>
    <div v-if="errorMessage" class="screenError">{{ errorMessage }}</div>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import ChartBox from '@/components/ChartBox.vue'
import DashboardMap from '@/components/DashboardMap.vue'
import plantingStatAverageIcon from '@/assets/screen/planting-stat-average.png'
import plantingStatExcessIcon from '@/assets/screen/planting-stat-excess.png'
import plantingStatMaximumIcon from '@/assets/screen/planting-stat-maximum.png'
import plantingStatTargetIcon from '@/assets/screen/planting-stat-target.png'
import maturityHarvestIcon from '@/assets/screen/maturity-harvest.png'
import weatherHumidityIcon from '@/assets/screen/weather-humidity.png'
import weatherRainIcon from '@/assets/screen/weather-rain.png'
import weatherTemperatureIcon from '@/assets/screen/weather-temperature.png'
import weatherWindIcon from '@/assets/screen/weather-wind.png'
import { dashboardModules, getDefaultDashboardSubId } from '@/config/dashboardNavigation'
import { fetchScreenData } from '@/services/dashboardApi'
import {
  WEATHER_ALERT_TYPES,
  selectWeatherAlertType,
} from '@/services/weatherAlertState'
import type { DashboardRequestContext } from '@/types/dashboardApi'
import type { ChartBlock, DistrictStat, MapTheme, ModuleKey, ScreenPayload } from '@/types/dashboard'

const screenThemes: Record<string, MapTheme> = {
  cultivatedLand: 'cropland',
  highStandard: 'standard',
  basicProtection: 'protection',
  greenGrain: 'greenGrain',
  plantingTask: 'task',
  cropDistribution: 'crop',
  yieldEstimate: 'yield',
  growthStage: 'growth',
  seedling: 'seedling',
  growth: 'growth',
  maturity: 'maturity',
  weatherDisaster: 'weather',
}

function createEmptyScreenData(moduleKey: ModuleKey, subId: string): ScreenPayload {
  const title = dashboardModules
    .find((item) => item.key === moduleKey)
    ?.children.find((item) => item.id === subId)?.name ?? ''
  return {
    moduleKey,
    subId,
    title,
    place: '青岛市',
    year: new Date().getFullYear(),
    map: {
      theme: screenThemes[subId] ?? 'cropland',
      legendTitle: title,
      districtStats: [],
      legend: [],
    },
    headline: [],
    panels: [],
  }
}

withDefaults(
  defineProps<{
    showAdminEntry?: boolean
  }>(),
  {
    showAdminEntry: false,
  },
)

function getInitialModule(): ModuleKey {
  const route = window.location.hash.replace(/^#\/?/, '').split('/')[0]
  return dashboardModules.some((item) => item.key === route) ? (route as ModuleKey) : 'farmland'
}

function getInitialSub(moduleKey: ModuleKey): string {
  const subId = window.location.hash.replace(/^#\/?/, '').split('/')[1]
  const moduleConfig = dashboardModules.find((item) => item.key === moduleKey)
  return moduleConfig?.children.some((item) => item.id === subId)
    ? subId
    : getDefaultDashboardSubId(moduleKey)
}

const initialModule = getInitialModule()
const activeModule = ref<ModuleKey>(initialModule)
const activeSub = ref(getInitialSub(initialModule))
const activeCrop = ref('')
const selectedDistrict = ref<DistrictStat | null>(null)
const loading = ref(false)
const errorMessage = ref('')
let errorMessageTimer: ReturnType<typeof setTimeout> | null = null
const screenData = ref<ScreenPayload>(createEmptyScreenData(initialModule, activeSub.value))
const farmlandAnalysisMode = ref<'area' | 'trend'>('area')
const protectionSummaryMode = ref<'area' | 'count'>('area')
const protectionAnalysisMode = ref<'area' | 'count'>('area')
const weatherPage = ref<'current' | 'forecast'>('current')
const weatherAlertType = computed(() => activeCrop.value || '高温')
const selectedReportIndex = ref<number | null>(null)
let loadRequestId = 0

function clearErrorMessage(): void {
  if (errorMessageTimer !== null) {
    clearTimeout(errorMessageTimer)
    errorMessageTimer = null
  }
  errorMessage.value = ''
}

function showErrorMessage(message: string): void {
  clearErrorMessage()
  errorMessage.value = message
  errorMessageTimer = setTimeout(() => {
    errorMessage.value = ''
    errorMessageTimer = null
  }, 4_000)
}
const activeTimelineIndex = ref(0)

const activeModuleConfig = computed(
  () => dashboardModules.find((item) => item.key === activeModule.value) ?? dashboardModules[0],
)
const placeName = computed(() => screenData.value.place.split('·')[0]?.trim() || '青岛市')
const defaultPlaceName = computed(() => screenData.value.place.split('·')[1]?.trim() || '')
const currentPlaceName = computed(() => selectedDistrict.value?.name || defaultPlaceName.value)
const warningHeadline = computed(() => {
  if (!['seedling', 'growth'].includes(activeSub.value)) return screenData.value.headline
  const crop = screenData.value.cropOptions?.find((item) => item.value === activeCrop.value)
  if (!crop) return screenData.value.headline

  return screenData.value.headline.map((metric, index) =>
    index === 0
      ? { ...metric, value: crop.label, subValue: crop.value === 'corn' ? '夏玉米品种' : '冬小麦品种' }
      : metric,
  )
})
const isCultivatedLandScreen = computed(
  () => activeModule.value === 'farmland' && activeSub.value === 'cultivatedLand',
)
const isHighStandardScreen = computed(
  () => activeModule.value === 'farmland' && activeSub.value === 'highStandard',
)
const isBasicProtectionScreen = computed(
  () => activeModule.value === 'farmland' && activeSub.value === 'basicProtection',
)
const isPlantingTaskScreen = computed(
  () => activeModule.value === 'security' && activeSub.value === 'plantingTask',
)
const isGrowthStageScreen = computed(
  () => activeModule.value === 'warning' && activeSub.value === 'growthStage',
)
const isSeedlingScreen = computed(
  () => activeModule.value === 'warning' && activeSub.value === 'seedling',
)
const isGrowthScreen = computed(
  () => activeModule.value === 'warning' && activeSub.value === 'growth',
)
const isMaturityScreen = computed(
  () => activeModule.value === 'warning' && activeSub.value === 'maturity',
)
const isWeatherScreen = computed(
  () => activeModule.value === 'warning' && activeSub.value === 'weatherDisaster',
)
const primaryPanel = computed(() => screenData.value.panels[0])
const secondaryPanel = computed(() => screenData.value.panels[1])
const growthStageNames = computed(() => screenData.value.headline.map((item) => item.label))
const warningReportColors = ['#00d4ff', '#ffb800', '#00ff88', '#ff6b6b']
const weatherAlertColors = ['#30c1ff', '#ff8c00', '#ff4444']
const weatherAlertTypes = WEATHER_ALERT_TYPES
const weatherIcons = [weatherTemperatureIcon, weatherHumidityIcon, weatherWindIcon, weatherRainIcon]
const plantingCompletion = computed(() => screenData.value.headline[0] ?? { value: 0, unit: '%' })
const plantingPlan = computed(() => screenData.value.headline[1] ?? { value: '--', unit: '万亩' })
const plantingSeasons = computed(() => screenData.value.headline.slice(2, 4))
const plantingTaskChart = computed<ChartBlock>(() =>
  screenData.value.panels.find((panel) => panel.kind === 'chart')?.chart ?? {
    title: '任务量/完成量',
    type: 'bar',
    variant: 'plantingTask',
    unit: '万亩',
    data: [],
  },
)
const plantingMetrics = computed(
  () => screenData.value.panels.find((panel) => panel.kind === 'metrics')?.metrics ?? [],
)
const plantingStatIcons = [
  plantingStatExcessIcon,
  plantingStatAverageIcon,
  plantingStatMaximumIcon,
  plantingStatTargetIcon,
]
const plantingCircleLength = 2 * Math.PI * 45
const plantingCircleOffset = computed(
  () => plantingCircleLength * (1 - Number(plantingCompletion.value.value) / 100),
)
const farmlandTotal = computed(() => screenData.value.headline[0] ?? { value: '--', unit: '' })
const farmlandPercent = computed(
  () => screenData.value.headline[1] ?? { label: '占青岛市土地总面积的', value: '--', unit: '%' },
)
const farmlandReports = computed(
  () => screenData.value.panels.find((panel) => panel.kind === 'reports')?.reports ?? [],
)
const farmlandMaximum = computed(() =>
  [...screenData.value.map.districtStats].sort((left, right) => right.value - left.value)[0],
)
const farmlandMinimum = computed(() =>
  [...screenData.value.map.districtStats].sort((left, right) => left.value - right.value)[0],
)
const farmlandAreaChart = computed<ChartBlock>(() =>
  screenData.value.panels.find((panel) => panel.kind === 'chart')?.chart ?? {
    title: '占地面积',
    type: 'bar',
    unit: '万亩',
    data: [],
  },
)
const highStandardChart = computed<ChartBlock>(() =>
  screenData.value.panels.find((panel) => panel.kind === 'chart')?.chart ?? {
    title: '占地面积',
    type: 'bar',
    variant: 'farmlandArea',
    unit: '万亩',
    data: [],
  },
)
const farmlandTrendChart = computed<ChartBlock>(() =>
  screenData.value.panels.find((panel) => panel.chart?.variant === 'farmlandTrend')?.chart ?? {
    title: '耕地面积变化趋势',
    type: 'line',
    variant: 'farmlandTrend',
    unit: '万亩',
    data: [],
  },
)
const farmlandAnalysisChart = computed(() =>
  farmlandAnalysisMode.value === 'area' ? farmlandAreaChart.value : farmlandTrendChart.value,
)
const protectionBaseChart = computed<ChartBlock>(() =>
  screenData.value.panels.find((panel) => panel.kind === 'chart')?.chart ?? {
    title: '面积',
    type: 'stack',
    variant: 'protectionMonitoring',
    unit: '亩',
    data: [],
    series: [],
  },
)
const protectionChart = computed<ChartBlock>(() => {
  const chart = protectionBaseChart.value
  if (protectionAnalysisMode.value === 'area') return chart

  const countSeries = (chart.series ?? []).map((series) => ({
    ...series,
    data: series.countData ?? [],
  }))
  const countData = chart.data.map((item, index) => ({
    ...item,
    value: countSeries.reduce((total, series) => total + (series.data[index] ?? 0), 0),
  }))
  return { ...chart, title: '数量', unit: '个', data: countData, series: countSeries }
})
const protectionSummary = computed(() => {
  if (protectionSummaryMode.value === 'area') {
    const comparison = screenData.value.headline[1]
    return {
      value: screenData.value.headline[0]?.value ?? '--',
      unit: '亩',
      rate: comparison?.value ?? '--',
      increase: comparison?.subValue?.replace(/[^\d.,-]/gu, '') || '--',
    }
  }

  const count = (protectionBaseChart.value.series ?? []).reduce(
    (total, series) => total + (series.countData ?? []).reduce((sum, value) => sum + value, 0),
    0,
  )
  return {
    value: count ? new Intl.NumberFormat('en-US').format(count) : '--',
    unit: '个',
    rate: '--',
    increase: '--',
  }
})
const protectionMaximum = computed(() => {
  const item = [...protectionChart.value.data].sort((left, right) => right.value - left.value)[0]
  return {
    name: item?.name ?? '--',
    value: item ? new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(item.value) : '--',
    unit: protectionChart.value.unit ?? '',
  }
})
const protectionMinimum = computed(() => {
  const item = [...protectionChart.value.data].sort((left, right) => left.value - right.value)[0]
  return {
    name: item?.name ?? '--',
    value: item ? new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(item.value) : '--',
    unit: protectionChart.value.unit ?? '',
  }
})
const warningReports = computed(
  () => screenData.value.panels.find((panel) => panel.kind === 'reports')?.reports ?? [],
)
const weatherDisasterMetrics = computed(() => {
  const metrics = screenData.value.panels.find((panel) => panel.kind === 'metrics')?.metrics ?? []
  return metrics.map((metric, index) =>
    index === 3 ? { ...metric, label: `年度${weatherAlertType.value}累计天数` } : metric,
  )
})
const maturityPercent = computed(() => Number(screenData.value.headline[0]?.value ?? 0))
const maturityStatus = computed(() => screenData.value.headline[0]?.subValue ?? '')
const maturityHarvestPeriod = computed(
  () => screenData.value.headline.find((metric) => metric.label === '最佳采收期')?.value ?? '--',
)
const weatherForecastChart = computed<ChartBlock>(() =>
  screenData.value.panels.find((panel) => panel.chart?.variant === 'weatherForecast')?.chart ?? {
    title: '7天预报',
    type: 'line',
    variant: 'weatherForecast',
    unit: '℃',
    data: [],
  },
)
const displayTimeline = computed(() =>
  (screenData.value.timeline ?? []).map((item, index) => ({
    ...item,
    active: index === activeTimelineIndex.value,
  })),
)
const timelineYears = computed(() => {
  const years = screenData.value.timelineYears ?? []
  return years.length ? years : [screenData.value.year]
})
const activeTimelineText = computed(() => {
  const item = screenData.value.timeline?.[activeTimelineIndex.value]
  return [item?.label, item?.date].filter(Boolean).join(' ')
})

function formatTimelineDate(date: string): string {
  return /^\d{4}-\d{2}-\d{2}$/u.test(date) ? date.slice(5) : date
}

function resetPageFilters(): void {
  activeCrop.value = ''
  activeTimelineIndex.value = 0
  selectedDistrict.value = null
}

function selectModule(moduleKey: ModuleKey): void {
  const subId = getDefaultDashboardSubId(moduleKey)
  if (moduleKey === activeModule.value && subId === activeSub.value) return
  resetPageFilters()
  activeModule.value = moduleKey
  activeSub.value = subId
  window.location.hash = `/${moduleKey}`
}

function selectSub(subId: string): void {
  if (subId === activeSub.value) return
  resetPageFilters()
  activeSub.value = subId
  window.location.hash = `/${activeModule.value}/${subId}`
}

// 时间轴选择同时更新业务筛选与哈希页面状态，随后只刷新当前专题数据。
function selectTimeline(index: number): void {
  if (index === activeTimelineIndex.value) return
  activeTimelineIndex.value = index
  void loadScreenData()
}

function moveTimeline(direction: -1 | 1): void {
  const itemCount = screenData.value.timeline?.length ?? 0
  if (!itemCount) return
  const nextIndex = activeTimelineIndex.value + direction
  if (nextIndex >= 0 && nextIndex < itemCount) {
    activeTimelineIndex.value = nextIndex
    void loadScreenData()
    return
  }

  if (activeModule.value === 'warning') {
    const yearIndex = timelineYears.value.indexOf(screenData.value.year)
    const targetYear = timelineYears.value[yearIndex + direction]
    if (targetYear !== undefined) {
      void loadScreenData(false, {
        year: targetYear,
        timelineEdge: direction === 1 ? 'first' : 'last',
      })
    }
    return
  }

  activeTimelineIndex.value = direction === 1 ? 0 : itemCount - 1
  void loadScreenData()
}

function selectTimelineYear(event: Event): void {
  const year = Number((event.target as HTMLSelectElement).value)
  if (!Number.isInteger(year) || year === screenData.value.year) return
  void loadScreenData(false, { year, timelineEdge: 'last' })
}

function selectCrop(crop: string): void {
  if (crop === activeCrop.value) return
  activeCrop.value = crop
  activeTimelineIndex.value = 0
  void loadScreenData(false, { timelineEdge: 'last' })
}

// 气象按钮与 activeCrop 使用同一状态源，切换后复位时间轴并重新请求当前页面。
function selectWeatherType(type: string): void {
  const selection = selectWeatherAlertType(weatherAlertType.value, type)
  if (!selection.changed) return
  activeCrop.value = selection.crop
  activeTimelineIndex.value = selection.timelineIndex
  void loadScreenData(false, { crop: selection.crop, timelineEdge: 'last' })
}

function selectDistrict(district: DistrictStat | null): void {
  if (district?.name === selectedDistrict.value?.name) return
  selectedDistrict.value = district
  void loadScreenData()
}

// 将登录门控确认后的哈希同步回一级/二级导航，保证刷新和前进后退仍停留原页面。
function syncRouteFromHash(): void {
  const moduleKey = getInitialModule()
  const subId = getInitialSub(moduleKey)
  if (moduleKey === activeModule.value && subId === activeSub.value) return
  resetPageFilters()
  activeModule.value = moduleKey
  activeSub.value = subId
}

function buildRequestOverrides(includeTimeline: boolean): Partial<DashboardRequestContext> {
  const requestOverrides: Partial<DashboardRequestContext> = {}
  const timelineMatchesActivePage = screenData.value.moduleKey === activeModule.value
    && screenData.value.subId === activeSub.value
  const timelineItem = includeTimeline && timelineMatchesActivePage
    ? screenData.value.timeline?.[activeTimelineIndex.value]
    : undefined
  const timelineValue = timelineItem?.date || timelineItem?.label || ''
  const yearText = timelineValue.match(/\d{4}/u)?.[0]

  if (timelineItem) {
    requestOverrides.year = activeModule.value === 'warning'
      ? screenData.value.year
      : yearText ? Number(yearText) : screenData.value.year
    if (/上/u.test(timelineValue)) requestOverrides.halfYear = 1
    if (/下/u.test(timelineValue)) requestOverrides.halfYear = 2
    if (activeModule.value === 'warning') {
      requestOverrides.date = /^\d{4}-\d{2}-\d{2}$/u.test(timelineValue)
        ? timelineValue
        : /^\d{2}-\d{2}$/u.test(timelineValue)
          ? `${requestOverrides.year}-${timelineValue}`
          : undefined
    }
  }
  if (activeCrop.value) requestOverrides.crop = activeCrop.value
  requestOverrides.district = selectedDistrict.value?.name ?? '青岛市'
  return requestOverrides
}

// 每次加载使用递增序号隔离并发响应，旧请求不能覆盖用户刚切换的新页面。
async function loadScreenData(
  includeTimeline = true,
  extraOverrides: Partial<DashboardRequestContext> = {},
): Promise<void> {
  const requestOverrides = { ...buildRequestOverrides(includeTimeline), ...extraOverrides }
  const requestId = ++loadRequestId
  const moduleKey = activeModule.value
  const subId = activeSub.value
  const requestedCrop = activeCrop.value
  const isSamePageRequest = screenData.value.moduleKey === moduleKey
    && screenData.value.subId === subId
  loading.value = true
  clearErrorMessage()
  if (!isSamePageRequest) screenData.value = createEmptyScreenData(moduleKey, subId)
  try {
    const result = await fetchScreenData(moduleKey, subId, requestOverrides)
    if (requestId !== loadRequestId) return
    screenData.value = result.data
    const matchedCrop = result.data.cropOptions?.find(
      (option) => option.value === requestedCrop || option.label === result.data.crop,
    )?.value
    activeCrop.value = matchedCrop
      ?? (moduleKey === 'warning' && subId === 'weatherDisaster' && requestedCrop
        ? requestedCrop
        : result.data.cropOptions?.[0]?.value)
      ?? ''
    activeTimelineIndex.value = Math.max(
      0,
      result.data.timeline?.findIndex((item) => item.active) ?? 0,
    )
    farmlandAnalysisMode.value = 'area'
    protectionSummaryMode.value = 'area'
    protectionAnalysisMode.value = 'area'
    weatherPage.value = 'current'
    selectedReportIndex.value = null
  } catch (error) {
    if (requestId !== loadRequestId) return
    if (!isSamePageRequest) screenData.value = createEmptyScreenData(moduleKey, subId)
    showErrorMessage(error instanceof Error ? error.message : '大屏数据加载失败')
  } finally {
    if (requestId === loadRequestId) loading.value = false
  }
}

watch([activeModule, activeSub], () => void loadScreenData(), { immediate: true })
onMounted(() => window.addEventListener('hashchange', syncRouteFromHash))
onBeforeUnmount(() => {
  window.removeEventListener('hashchange', syncRouteFromHash)
  clearErrorMessage()
})
</script>

<style scoped>
.dashboardAdminEntry {
  position: relative;
  width: 0.36rem;
  height: 0.34rem;
  margin-right: 0.2rem;
  flex: 0 0 0.36rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #65dcff;
  text-decoration: none;
  filter: drop-shadow(0 0 0.05rem rgba(38, 197, 255, 0.72));
  transition:
    color 160ms ease,
    filter 160ms ease,
    transform 160ms ease;
}

.dashboardAdminEntryIcon {
  position: relative;
  width: 0.28rem;
  height: 0.28rem;
  display: block;
}

.dashboardAdminEntryIcon::before {
  position: absolute;
  top: 0.025rem;
  left: 0.055rem;
  width: 0.17rem;
  height: 0.17rem;
  border-top: 0.018rem solid currentColor;
  border-left: 0.018rem solid currentColor;
  content: "";
  transform: rotate(45deg);
  box-sizing: border-box;
}

.dashboardAdminEntryIcon::after {
  position: absolute;
  top: 0.115rem;
  left: 0.045rem;
  width: 0.19rem;
  height: 0.145rem;
  border-right: 0.018rem solid currentColor;
  border-bottom: 0.018rem solid currentColor;
  border-left: 0.018rem solid currentColor;
  content: "";
  background: linear-gradient(currentColor, currentColor) center bottom / 0.038rem 0.072rem no-repeat;
  box-sizing: border-box;
}

.dashboardAdminEntry:hover,
.dashboardAdminEntry:focus-visible {
  outline: 0;
  color: #d8f9ff;
  filter: drop-shadow(0 0 0.08rem rgba(86, 222, 255, 0.95));
  transform: translateY(-0.01rem);
}

.dashboardAdminEntry:focus-visible {
  box-shadow: 0 0 0 1px rgba(101, 220, 255, 0.72);
}
</style>
