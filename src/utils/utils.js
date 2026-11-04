/*
 * @Description:
 * @Version: 2.0
 * @Autor: shiXl
 * @Date: 2021-08-15 16:53:05
 * @LastEditors: shixiaolei
 * @LastEditTime: 2024-07-18 17:25:04
 */
/**
 * 工具函数封装
 */
export default {
  formateDate(date, rule) {
    let fmt = rule || "yyyy-MM-dd hh:mm:ss"; // 自定义格式
    // let fmt = rule || "yyyy/MM-/dd"; // 自定义格式

    if (/(y+)/.test(fmt)) {
      // /(y+)/.test(fmt) = true
      fmt = fmt.replace(RegExp.$1, date.getFullYear()); // RegExp.$1 = "yyyy"
    }
    const o = {
      // "y+": date.getFullYear(),
      "M+": date.getMonth() + 1,
      "d+": date.getDate(),
      "h+": date.getHours(),
      "m+": date.getMinutes(),
      "s+": date.getSeconds(),
    };
    for (let k in o) {
      if (new RegExp(`(${k})`).test(fmt)) {
        // 动态正则匹配，需要new RegExp
        const val = o[k] + "";
        fmt = fmt.replace(
          RegExp.$1,
          RegExp.$1.length == 1 ? val : ("00" + val).substr(val.length)
        );
      }
    }
    return fmt;
  },
  generateRoute(menuList) {
    const routes = [];
    const deepList = (list) => {
      list.forEach((item) => {
        if (!item || typeof item !== "object" || item.menuType !== 1) {
          return;
        }
        const path = typeof item.path === "string" ? item.path.trim() : "";
        const component =
          typeof item.component === "string" ? item.component.trim() : "";
        if (path && component) {
          routes.push({
            name: item.name || path,
            path,
            meta: {
              title: item.menuName || "Untitled",
            },
            component,
          });
        }
        if (Array.isArray(item.children)) {
          deepList(item.children);
        }
      });
    };
    if (Array.isArray(menuList)) {
      deepList(menuList);
    }
    return routes;
  },
};
