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
          :class="
            currentSelectedIndex === index + currentPage * itemsPerPage
              ? 'active'
              : ''
          "
        >
          <p>工单编号：{{ workOrder.orderId }}</p>
          <p>业务类型：{{ workOrder.businessType }}</p>
          <p>客户编号：{{ workOrder.customerId }}</p>
          <div
            v-if="currentSelectedIndex === index + currentPage * itemsPerPage"
            class="work-order-arrow"
          ></div>
        </div>
      </div>
      <div
        class="scroll-arrow right"
        @click="nextPage"
        :class="{ disabled: currentPage >= totalPages - 1 }"
      ></div>
    </div>

    <!-- 流程展示区域 -->
    <div v-if="currentSelectedIndex !== -1" class="flow-container-wrapper">
      <div class="flow-container">
        <div
          v-for="(step, stepIndex) in reorderedFlow"
          :key="stepIndex"
          class="flow-step"
          :class="[getStepClass(stepIndex)]"
          :style="
            !step.title ? { background: 'transparent', border: 'none' } : {}
          "
        >
          <!-- 空流程不显示内容 -->
          <template v-if="step.title">
            <p>{{ step.title }}</p>
            <p>{{ step.date }}</p>
            <p>电能表较表</p>
            <p>风险项：{{ step.riskItem }}</p>
          </template>
          <!-- 空流程不显示箭头 -->
          <div
            v-if="step.title && shouldShowArrow(stepIndex)"
            class="flow-step-arrow"
            :class="[getArrowClass(stepIndex)]"
          ></div>
        </div>
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
              title: "流程11",
              date: "2025-01-06 16:31:27",
              riskItem: "不满意",
            },
            {
              title: "流程10",
              date: "2025-01-06 16:31:27",
              riskItem: "不满意",
            },
            { title: "流程9", date: "2025-01-06 16:31:27", riskItem: "不满意" },
            { title: "流程8", date: "2025-01-05 16:31:27", riskItem: "不满意" },
            { title: "流程7", date: "2025-01-06 16:31:27", riskItem: "不满意" },
            { title: "流程6", date: "2025-01-05 16:31:27", riskItem: "不满意" },
            { title: "流程5", date: "2025-01-04 09:23:27", riskItem: "" },
            { title: "流程4", date: "2025-01-04 09:23:27", riskItem: "" },
            { title: "流程3", date: "2025-01-05 16:31:27", riskItem: "不满意" },
            { title: "流程2", date: "2025-01-04 08:34:47", riskItem: "" },
            { title: "流程1", date: "2025-01-04 08:34:47", riskItem: "" },
          ],
        },
        {
          orderId: "2025011011324135",
          businessType: "投诉客户",
          customerId: "3700XX003",
          flow: [
            { title: "流程E", date: "2025-01-06 16:31:27", riskItem: "不满意" },
            { title: "流程D", date: "2025-01-06 16:31:27", riskItem: "不满意" },
            { title: "流程C", date: "2025-01-06 16:31:27", riskItem: "不满意" },
            { title: "流程B", date: "2025-01-06 16:31:27", riskItem: "不满意" },
            { title: "流程A", date: "2025-01-07 16:31:27", riskItem: "不满意" },
          ],
        },
        {
          orderId: "2025011011324135",
          businessType: "投诉客户",
          customerId: "3700XX006",
          flow: [
            { title: "流程D", date: "2025-01-06 16:31:27", riskItem: "不满意" },
            { title: "流程C", date: "2025-01-06 16:31:27", riskItem: "不满意" },
            { title: "流程B", date: "2025-01-06 16:31:27", riskItem: "不满意" },
            { title: "流程A", date: "2025-01-07 16:31:27", riskItem: "不满意" },
          ],
        },
        {
          orderId: "2025011011324135",
          businessType: "投诉客户",
          customerId: "3700XX000",
          flow: [
            { title: "流程H", date: "2025-01-06 16:31:27", riskItem: "不满意" },
            { title: "流程G", date: "2025-01-06 16:31:27", riskItem: "不满意" },
            { title: "流程F", date: "2025-01-06 16:31:27", riskItem: "不满意" },
            { title: "流程E", date: "2025-01-06 16:31:27", riskItem: "不满意" },
            { title: "流程C", date: "2025-01-06 16:31:27", riskItem: "不满意" },
            { title: "流程B", date: "2025-01-06 16:31:27", riskItem: "不满意" },
            { title: "流程A", date: "2025-01-07 16:31:27", riskItem: "不满意" },
          ],
        },
        {
          orderId: "2025011011324135",
          businessType: "投诉客户",
          customerId: "3700XX000",
          flow: [
            { title: "流程H", date: "2025-01-06 16:31:27", riskItem: "不满意" },
            { title: "流程G", date: "2025-01-06 16:31:27", riskItem: "不满意" },
            { title: "流程F", date: "2025-01-06 16:31:27", riskItem: "不满意" },
            { title: "流程E", date: "2025-01-06 16:31:27", riskItem: "不满意" },
            { title: "流程D", date: "2025-01-06 16:31:27", riskItem: "不满意" },
            { title: "流程C", date: "2025-01-06 16:31:27", riskItem: "不满意" },
            { title: "流程B", date: "2025-01-06 16:31:27", riskItem: "不满意" },
            { title: "流程A", date: "2025-01-07 16:31:27", riskItem: "不满意" },
          ],
        },
        {
          orderId: "2025011011324135",
          businessType: "投诉客户",
          customerId: "3700XX000",
          flow: [
            { title: "流程J", date: "2025-01-06 16:31:27", riskItem: "不满意" },
            { title: "流程I", date: "2025-01-06 16:31:27", riskItem: "不满意" },
            { title: "流程H", date: "2025-01-06 16:31:27", riskItem: "不满意" },
            { title: "流程G", date: "2025-01-06 16:31:27", riskItem: "不满意" },
            { title: "流程F", date: "2025-01-06 16:31:27", riskItem: "不满意" },
            { title: "流程E", date: "2025-01-06 16:31:27", riskItem: "不满意" },
            { title: "流程C", date: "2025-01-06 16:31:27", riskItem: "不满意" },
            { title: "流程B", date: "2025-01-06 16:31:27", riskItem: "不满意" },
            { title: "流程A", date: "2025-01-07 16:31:27", riskItem: "不满意" },
          ],
        },
      ],
      currentPage: 0, // 当前页码
      itemsPerPage: 3, // 每页显示的工单数
      currentSelectedIndex: 0, // 当前选中的工单索引
      totalPages: 0, // 总页数
    };
  },

  computed: {
    // 当前可见的工单
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
    // 动态重新排列流程步骤
    reorderedFlow() {
      const flow = this.workOrders[this.currentSelectedIndex].flow;
      const reordered = [];
      const totalSteps = flow.length;
      const stepsPerRow = 3; // 每行显示的步骤数

      // 计算当前选中的工单在当前页的局部索引
      const localIndex = this.currentSelectedIndex % this.itemsPerPage;
      console.log("🚀 ~ reorderedFlow ~ localIndex:", localIndex);

      // 根据局部索引决定插入空流程的位置和数量
      if (localIndex === 0) {
        reordered.push(
          { title: "", date: "", riskItem: "" },
          { title: "", date: "", riskItem: "" },
          ...flow
        ); // 插入第 2 个空流程
      } else if (localIndex === 1) {
        reordered.push({ title: "", date: "", riskItem: "" }, ...flow); // 插入第 2 个空流程
      } else {
        // 第三个工单：不插入空流程
        reordered.push(...flow);
      }

      // 重新排列流程（奇数行从左到右，偶数行从右到左）
      const finalReordered = [];
      for (let i = 0; i < reordered.length; i += stepsPerRow) {
        const rowSteps = reordered.slice(i, i + stepsPerRow);
        if ((i / stepsPerRow) % 2 !== 0) {
          finalReordered.push(...rowSteps); // 奇数行从左到右
        } else {
          finalReordered.push(...rowSteps.reverse()); // 偶数行从右到左
        }
      }

      return finalReordered;
    },
  },

  methods: {
    // 上一页
    prevPage() {
      if (this.currentPage > 0) this.currentPage--;
    },
    // 下一页
    nextPage() {
      if (this.currentPage < this.totalPages - 1) this.currentPage++;
    },
    // 显示流程
    showFlow(index) {
      this.currentSelectedIndex = index;
    },
    // 获取步骤的样式类
    getStepClass(stepIndex) {
      const row = Math.floor(stepIndex / 3); // 计算当前步骤所在的行
      const col = stepIndex % 3; // 计算当前步骤所在的列
      // console.log(row, col);
      const classes = [];
      if (row === 0 && col === 0) classes.push("first-step");
      if (col === 2 && stepIndex + 1 < this.reorderedFlow.length)
        classes.push("last-in-row");

      // 判断是否最后一行且是奇数行，如果有两个就是end11 end12，如果有三个就是end1 end2 end3
      const totalRows = Math.ceil(
        this.reorderedFlow.filter((step) => step).length / 3
      );
      if (totalRows % 2 === 1 && row === totalRows - 1) {
        const lastRowSteps = this.reorderedFlow
          .slice(row * 3)
          .filter((step) => step);
        const lastRowLength = lastRowSteps.length;
        if (lastRowLength === 1) {
          classes.push(`end1${col + 1}`);
        } else if (lastRowLength === 2) {
          classes.push(`end2${col + 1}`);
        } else if (lastRowLength === 3) {
          classes.push(`end3${col + 1}`);
        }
      }
      return classes.join(" ");
    },
    // 是否显示箭头
    shouldShowArrow(stepIndex) {
      return stepIndex < this.reorderedFlow.length - 1; // 不是最后一个步骤时显示箭头
    },
    // 获取箭头的样式类
    getArrowClass(stepIndex) {
      const row = Math.floor(stepIndex / 3); // 计算当前步骤所在的行
      const col = stepIndex % 3; // 计算当前步骤所在的列
      const totalSteps = this.reorderedFlow.length;

      // 如果是奇数行的最后一个步骤，并且不是最后一行，显示向下的箭头
      if (
        row % 2 === 0 &&
        col === 0 &&
        row < Math.floor((totalSteps - 1) / 3)
      ) {
        return "arrow-down";
      }

      // 如果是偶数行的第一个步骤，并且不是最后一行，显示向下的箭头
      if (
        row % 2 === 1 &&
        col === 2 &&
        row < Math.floor((totalSteps - 1) / 3)
      ) {
        return "arrow-down";
      }

      // 如果是偶数行，显示向左的箭头
      if (row % 2 === 1) {
        return "arrow-right";
      }

      // 默认显示向右的箭头
      return "arrow-left";
    },
  },
};
</script>

<style scoped lang="scss">
.container {
  max-width: 827px;
  margin: 0 auto;
  // padding: 20px;
  border: 1px solid #ccc;
  background-color: #fff;

  .work-order-scroll {
    display: flex;
    align-items: center;
    margin-bottom: 20px;

    .scroll-arrow {
      width: 15px;
      height: 36px;
      background: url(@/assets/img/sroll.webp) no-repeat center;
      background-size: 100% 100%;
      cursor: pointer;
      &.left {
        transform: scaleX(-1);
      }
      &.disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .work-order-row {
      display: flex;
      gap: 10px;

      .work-order {
        width: 254px;
        height: 100px;
        padding: 10px;
        background: url(@/assets/img/blue.webp) no-repeat center;
        background-size: 100% 100%;
        color: #fff;
        cursor: pointer;
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: space-evenly;
        font-size: 14px;
        padding-left: 30px;
        font-weight: 400;

        &.active {
          background: url(@/assets/img/green.webp) no-repeat center;
          background-size: 100% 100%;
        }
        .work-order-arrow {
          width: 21px;
          height: 28px;
          background: url(@/assets/img/top.webp) no-repeat center;
          background-size: 100% 100%;
          position: absolute;
          bottom: -28px;
          left: 50%;
          transform: translateX(-50%);
        }
      }
    }
  }

  .flow-container-wrapper {
    margin-top: 27px;

    .flow-container {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      padding: 0 20px;

      .flow-step {
        width: 254px;
        height: 111px;
        padding: 10px;
        background: url(@/assets/img/progessGreen.webp) no-repeat center;
        background-size: 100% 100%;
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: space-evenly;
        align-items: center;
        font-size: 14px;
        font-weight: 400;
        color: #00f6ff;

        &:nth-child(odd) {
          background: url(@/assets/img/progessOrange.webp) no-repeat center;
          background-size: 100% 100%;
          color: rgba(225, 145, 17, 1);
        }
        .flow-step-arrow {
          width: 21px;
          height: 28px;
          background: url(@/assets/img/top.webp) no-repeat center;
          background-size: 100% 100%;
          position: absolute;
          &.arrow-right {
            top: 50%;
            right: -15px;
            transform: translateY(-50%) rotate(-90deg);
          }
          &.arrow-left {
            top: 50%;
            left: -15px;
            transform: translateY(-50%) scaleX(-1) rotate(-90deg);
          }
          &.arrow-down {
            bottom: -14px;
            left: 50%;
            transform: translateX(-50%);
          }
        }
        // 此处单独处理最后一行是奇数行排列问题
        &.end11 {
          margin-left: auto;
          .flow-step-arrow {
            top: 50%;
            right: -15px !important;
            transform: translateY(-50%) rotate(-90deg) !important;
          }
        }
        &.end21 {
          margin-left: auto;
          .flow-step-arrow {
            visibility: hidden;
          }
        }
        &.end22 {
          .flow-step-arrow {
            display: block !important;
          }
        }
        &.end31 {
          .flow-step-arrow {
            visibility: hidden;
          }
        }
        &.end32 {
          .flow-step-arrow {
            top: 50%;
            right: -15px !important;
            transform: translateY(-50%) rotate(90deg) !important;
          }
        }
        &.end33 {
          .flow-step-arrow {
            display: block !important;
          }
        }
      }
    }
  }
}
</style>
