<!--
 * @Description: 
 * @Version: 2.0
 * @Autor: 史小雷
 * @Date: 2021-08-28 16:28:11
 * @LastEditors: Seven
 * @LastEditTime: 2021-08-30 11:12:42
-->
<template>
  <div class="toolBar">
    <div v-for="(item, index) in buttonList" :key="index">
      <div v-if="item.type !== 'zoomTo3Dtile'">
        <span>{{ item.name }}</span
        >:
        <button @click="handleReducer(item)">-</button>
        <input type="text" v-model="item.num" />
        <button @click="handleAdd(item)">+</button>
      </div>
      <div v-if="item.type == 'zoomTo3Dtile'">
        <button @click="zoomTo">{{ item.name }}</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      buttonList: [
        {
          name: "透明度",
          num: 1,
          type: "alpha",
        },
        {
          name: "亮度",
          num: 1,
          type: "brightness",
        },
        {
          name: "灰度",
          num: 1,
          type: "gamma",
        },
        {
          name: "Viewer亮度",
          num: 1,
          type: "ViewerBrightness",
        },
        {
          name: "缩放到模型",
          num: 1,
          type: "zoomTo3Dtile",
        },
      ],
    };
  },
  watch: {
    buttonList: {
      handler(newVal, oldVal) {
        this.$emit("putList", this.buttonList);
      },
      deep: true,
    },
  },
  methods: {
    handleReducer(val) {
      this.buttonList.forEach((item) => {
        if (item.type == val.type) {
          if (item.num > 1) {
            item.num--;
          } else {
            item.num = 1;
          }
        }
      });
      this.$emit("putList", this.buttonList);
    },
    handleAdd(val) {
      this.buttonList.forEach((item) => {
        if (item.type == val.type) {
          item.num++;
        }
      });
      this.$emit("putList", this.buttonList);
    },
    zoomTo() {
      this.$emit("zoomTo");
    },
  },
};
</script>

<style lang="scss" scoped>
.toolBar {
  position: absolute;
  left: 0;
  top: 0;
  > div {
    span {
      color: white;
    }
  }
}
</style>
