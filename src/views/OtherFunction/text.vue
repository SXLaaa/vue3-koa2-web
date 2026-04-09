<template>
  <div class="container">
    <!-- 工单滚动容器 -->
    <div class="work-order-scroll">
      <div
        class="scroll-arrow left"
        @click="prevPage"
        :class="{ disabled: currentPage === 0 }"
      ></div>
      <div class="work-order-row">
        <div
          v-for="(workOrder, index) in visibleWorkOrders"
          :key="index"
          ref="workOrderRefs"
          class="work-order"
          @click="showFlow(index + currentPage * itemsPerPage)"
          :class="{
            active: currentSelectedIndex === index + currentPage * itemsPerPage,
          }"
        >
          <p>工单编号：{{ workOrder.orderId }}</p>
          <p>业务类型：{{ workOrder.businessType }}</p>
          <p>客户编号：{{ workOrder.customerId }}</p>
        </div>
      </div>
      <div
        class="scroll-arrow right"
        @click="nextPage"
        :class="{ disabled: currentPage >= totalPages - 1 }"
      ></div>
    </div>

    <!-- 流程展示区域 -->
    <div v-if="currentSelectedIndex !== -1" class="flow-container">
      <div class="flow-connection-arrow"></div>
      <div
        v-for="(step, stepIndex) in flowSteps"
        :key="stepIndex"
        class="flow-step"
      >
        <p>{{ step.title }}</p>
        <p>{{ step.date }}</p>
        <p class="risk-item">{{ step.riskItem }}</p>

        <!-- 连接占位符 -->
        <div class="flow-connector-placeholder">
          <div class="arrow-placeholder-right"></div>
          <div class="arrow-placeholder-down"></div>
        </div>

        <!-- 步骤间连接箭头 -->
        <div
          v-if="stepIndex < flowSteps.length - 1"
          class="flow-step-arrow"
          :class="[
            'arrow-right',
            { 'arrow-down': stepIndex % 3 === 2 },
            {
              'arrow-between-lines':
                stepIndex % 3 === 2 && stepIndex + 1 < flowSteps.length - 1,
            },
          ]"
        ></div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      workOrders: [
        {
          orderId: "2025011011324134",
          businessType: "投诉客户",
          customerId: "3700XX002",
          flow: [
            {
              title: "意见（建议）7",
              date: "2025-01-06 16:31:27",
              riskItem: "不满意",
            },
            {
              title: "故障工单6",
              date: "2025-01-05 16:31:27",
              riskItem: "不满意",
            },
            {
              title: "装表工单5",
              date: "2025-01-04 09:23:27",
              riskItem: "",
            },
            {
              title: "装表工单2",
              date: "2025-01-04 09:23:27",
              riskItem: "",
            },
            {
              title: "故障工单3",
              date: "2025-01-05 16:31:27",
              riskItem: "不满意",
            },
            {
              title: "查询咨询4",
              date: "2025-01-04 08:34:47",
              riskItem: "",
            },
            {
              title: "查询咨询1",
              date: "2025-01-04 08:34:47",
              riskItem: "",
            },
            // 可添加更多工单流程步骤用于测试
          ],
        },
        {
          orderId: "2025011011324135",
          businessType: "投诉客户",
          customerId: "3700XX003",
          flow: [
            {
              title: "意见（建议） 线路问题",
              date: "2025-01-07 16:31:27",
              riskItem: "不满意",
            },
            {
              title: "故障工单 区域停电",
              date: "2025-01-06 16:31:27",
              riskItem: "不满意",
            },
          ],
        },
        // 可添加更多工单数据
      ],
      entPage: 0,
      itemsPerPage: 3,
      currentSelectedIndex: 0, // ✅ 初始化为第一个工单
    };
  },

  computed: {
    visibleWorkOrders() {
      return this.workOrders.slice(
        this.currentPage * this.itemsPerPage,
        (this.currentPage + 1) * this.itemsPerPage
      );
    },

    flowSteps() {
      return this.workOrders[this.currentSelectedIndex]?.flow || [];
    },

    totalPages() {
      return Math.ceil((this.workOrders || []).length / this.itemsPerPage);
    },
  },

  methods: {
    prevPage() {
      if (this.currentPage > 0) this.currentPage--;
    },

    nextPage() {
      if (this.currentPage < this.totalPages - 1) this.currentPage++;
    },

    showFlow(index) {
      this.currentSelectedIndex = index;
      const workOrderEl = this.$refs.workOrderRefs[index];
      const { left, bottom } = workOrderEl.getBoundingClientRect();

      this.flowLeft = left + window.pageXOffset;
      this.flowTop = bottom + 10 + window.pageYOffset;
    },
  },
};
</script>

<style scoped lang="scss">
// 新增占位符样式
.flow-connector-placeholder {
  position: absolute;
  right: -10px;
  top: 50%;
  transform: translateY(-50%);

  .arrow-placeholder-right {
    width: 10px;
    height: 10px;
    background-color: #000;
    border-radius: 50%;
  }

  .arrow-placeholder-down {
    width: 10px;
    height: 10px;
    background-color: #000;
    border-radius: 50%;
    margin-top: 5px;
  }
}

// 调整箭头样式
.flow-step-arrow {
  &.arrow-right {
    right: -10px;
    top: 50%;
    transform: translateY(-50%);
  }

  &.arrow-down {
    bottom: -14px;
    left: 50%;
    transform: translateX(-50%);
  }

  &.arrow-between-lines {
    bottom: -14px;
    left: 50%;
    transform: translateX(-50%) rotate(90deg);
  }
}
</style>
