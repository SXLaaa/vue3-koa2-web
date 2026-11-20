/**
 * @Description: 代码练习台用例接口，复用项目请求封装和登录鉴权。
 * @Date: 2026-11-20
 */
import request from "../utils/request";

const baseUrl = "/code-lab/cases";

export default {
  list() {
    return request.get(baseUrl, {}, { mock: false });
  },
  get(id) {
    return request.get(`${baseUrl}/${encodeURIComponent(id)}`, {}, { mock: false });
  },
  create(data) {
    return request.post(baseUrl, data, { mock: false });
  },
  update(id, data) {
    return request.put(`${baseUrl}/${encodeURIComponent(id)}`, data, { mock: false });
  },
  remove(id) {
    return request.delete(`${baseUrl}/${encodeURIComponent(id)}`, undefined, { mock: false });
  },
};
