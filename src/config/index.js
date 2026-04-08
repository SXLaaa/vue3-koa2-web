/**
 * 环境配置封装
 */
const env = import.meta.env.MODE || "prod";

const isDev = env === "dev";
const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
const wsHost = window.location.host;
const relativeWsApi = `${wsProtocol}//${wsHost}/ws`;

const EnvConfig = {
  dev: {
    baseApi: "/api",
    wsApi: relativeWsApi,
    modelApi: "http://localhost:8089/modelData",
    geoserverApi: "http://localhost:8089/geoserver",
    mockApi:
      "https://www.fastmock.site/mock/4f8a76c109fe7d95e131ee5a72d23dff/api",
  },
  test: {
    baseApi: "//test.futurefe.com/api",
    wsApi: relativeWsApi,
    modelApi: "/modelData",
    geoserverApi: "/geoserver",
    mockApi:
      "https://www.fastmock.site/mock/4f8a76c109fe7d95e131ee5a72d23dff/api",
  },
  prod: {
    baseApi: "/api",
    wsApi: relativeWsApi,
    modelApi: "/modelData",
    geoserverApi: "/geoserver",
    mockApi:
      "https://www.fastmock.site/mock/4f8a76c109fe7d95e131ee5a72d23dff/api",
  },
};

const config = {
  env,
  isDev,
  mock: false,
  namespace: "manager",
  ...EnvConfig[env],
};

config.getModelUrl = (path) => `${config.modelApi}/${path}`;
config.getGeoserverUrl = (path) => `${config.geoserverApi}/${path}`;
config.getWsUrl = () => config.wsApi;

export default config;
