<template>
  <div>
    <!-- 工单滚动容器 -->
    <div class="work-order-scroll">
      <div
        class="scroll-arrow left"
        @click="prevPage"
        :disabled="currentPage === 0"
      >
        <font-awesome-icon icon="angle-left" />
      </div>
      <div class="work-order-row">
        <div
          v-for="(workOrder, index) in visibleWorkOrders"
          :key="index"
          class="work-order"
          @click="showFlow(index + currentPage * itemsPerPage)"
        >
          工单编号：{{ workOrder.orderId }}<br />
          业务类型：{{ workOrder.businessType }}<br />
          客户编号：{{ workOrder.customerId }}
          <div
            v-if="currentSelectedIndex === index + currentPage * itemsPerPage"
            class="work-order-arrow"
          ></div>
        </div>
      </div>
      <div
        class="scroll-arrow right"
        @click="nextPage"
        :disabled="currentPage >= totalPages - 1"
      >
        <font-awesome-icon icon="angle-right" />
      </div>
    </div>
    <!-- 流程展示区域 -->
    <div
      v-if="currentSelectedIndex !== -1"
      class="flow-container"
      :style="{ left: flowLeft + 'px', top: flowTop + 'px' }"
    >
      <div class="flow-connection-arrow"></div>
      <div
        v-for="(step, stepIndex) in workOrders[currentSelectedIndex].flow"
        :key="stepIndex"
        class="flow-step"
      >
        {{ step.title }}<br />
        {{ step.date }}<br />
        风险项：{{ step.riskItem }}
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
              title: "意见（建议） 电能表校表",
              date: "2025-01-06 16:31:27",
              riskItem: "不满意",
            },
            {
              title: "故障工单 单户停电",
              date: "2025-01-05 16:31:27",
              riskItem: "不满意",
            },
            { title: "装表工单", date: "2025-01-04 09:23:27", riskItem: "" },
            {
              title: "查询咨询 计量表计",
              date: "2025-01-04 08:34:47",
              riskItem: "",
            },
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
      currentPage: 0, // 当前页码
      itemsPerPage: 3, // 每页显示的工单数
      currentSelectedIndex: 0, // 当前选中的工单索引
      totalPages: 0, // 总页数
      clickedWorkOrderPos: null, // 存储点击工单的位置信息
      flowLeft: 0, // 流程容器的left值
      flowTop: 0, // 流程容器的top值
    };
  },
  computed: {
    visibleWorkOrders() {
      const startIndex = this.currentPage * this.itemsPerPage;
      const endIndex = startIndex + this.itemsPerPage;
      return this.workOrders.slice(startIndex, endIndex);
    },
  },
  mounted() {
    this.totalPages = Math.ceil(this.workOrders.length / this.itemsPerPage);
  },
  methods: {
    prevPage() {
      if (this.currentPage > 0) {
        this.currentPage--;
      }
    },
    nextPage() {
      if (this.currentPage < this.totalPages - 1) {
        this.currentPage++;
      }
    },
    showFlow(index) {
      this.currentSelectedIndex = index;
      const clickedWorkOrder = document.querySelectorAll(".work-order")[index];
      const rect = clickedWorkOrder.getBoundingClientRect();
      this.clickedWorkOrderPos = rect;
      // 给流程容器设置位置
      this.flowLeft = rect.left + window.pageXOffset;
      this.flowTop = rect.bottom + 10 + window.pageYOffset;
    },
  },
};
</script>

<style scoped>
.work-order-scroll {
  overflow-x: auto;
  white-space: nowrap;
  position: relative;
}
.scroll-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 10px;
  z-index: 1;
}
.left {
  left: 0;
}
.right {
  right: 0;
}
.work-order-row {
  display: inline-flex;
}
.work-order {
  border: 1px solid #ccc;
  padding: 10px;
  cursor: pointer;
  position: relative;
  margin-right: 10px;
  display: inline-block;
}
.work-order-arrow {
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 10px solid #000;
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
}
.flow-container {
  position: absolute;
  z-index: 1;
}
.flow-connection-arrow {
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-bottom: 10px solid #000;
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
}
.flow-step {
  border: 1px solid #ccc;
  padding: 10px;
  margin-bottom: 10px;
  width: calc(33.33% - 20px);
  margin-right: 20px;
}
.flow-step:nth-child(3n) {
  margin-right: 0;
}
.flow-step + .flow-step:before {
  content: "";
  position: absolute;
  border-style: solid;
  border-width: 10px 10px 0 10px;
  border-color: #000 transparent transparent transparent;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
}
</style>