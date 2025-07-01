// 该文件专门用于创建整个应用的路由器
import VueRouter from 'vue-router'

// 创建路由器并暴露
const router = new VueRouter({
  mode: "history",
  routes: [
    {
      path: "/",
      component: () => import("@/views/Home.vue"),
      meta: {
        title: "首页",
        // requireAuth: true
      }
    },
    {
      path: "/annotation",
      component: () => import("@/components/ImageMarker.vue"),
      meta: {
        title: "标注页",
        // requireAuth: true
      }
    }
  ]
});

// 全局后置路由守卫
router.afterEach((to) => {
  document.title = to.meta.title || '测试';
});

export default router;