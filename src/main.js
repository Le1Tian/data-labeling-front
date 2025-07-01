// 引入Vue
import Vue from "vue"
// 引入App
import App from "./App"
// 引入ElementUI组件库
import ElementUI from "element-ui"
// 引入ElementUI全部样式
import "element-ui/lib/theme-chalk/index.css"
import VueRouter from "vue-router"
import router from './router'
import axios from 'axios'
import store from './store'


Vue.config.productionTip = false

// Vue.use(ElementUI)
// Vue.use(VueRouter)
//
//
// new Vue({
//   el: "#app",
//   render: h => h(App),
//   router: router,
// })


// 使用Element UI
Vue.use(ElementUI)
Vue.use(VueRouter)

// 配置axios
axios.defaults.baseURL = '/api'
axios.defaults.timeout = 10000

// 请求拦截器
axios.interceptors.request.use(
    config => {
      // 可以在这里添加token等认证信息
      return config
    },
    error => {
      return Promise.reject(error)
    }
)

// 响应拦截器
axios.interceptors.response.use(
    response => {
      return response.data
    },
    error => {
      console.error('请求错误:', error)
      return Promise.reject(error)
    }
)

Vue.prototype.$http = axios

new Vue({
  store,
  render: h => h(App),
  router: router
}).$mount('#app')
