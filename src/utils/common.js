/*
 * @Description:
 * @Version: 2.0
 * @Autor: shiXl
 * @Date: 2021-11-20 22:48:23
 * @LastEditors: shiXl
 * @LastEditTime: 2021-11-20 22:50:51
 */
export default function keyBoard(vm, methodName, code) {
  document.onkeydown = function () {
    let key = window.event.keyCode;
    if (key == code) {
      vm[methodName](code);
    }
  };
}
