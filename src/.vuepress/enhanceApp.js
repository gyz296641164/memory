export default ({ router }) => {
    router.beforeEach((to, from, next) => {
      if (typeof _hmt !== "undefined") {
        if (to.path) {
          _hmt.push(["_trackPageview", to.fullPath]);
        }
      }
      
      next();
    });

    // 路由切换后，如果是首页则重新应用旋转动画
    // 特别针对 Microsoft Edge 浏览器，需要强制重新应用动画
    router.afterEach((to) => {
      // 判断是否为首页（路径为 / 或 /index.html）
      if (to.path === '/' || to.path === '/index.html' || to.path === '/zh/' || to.path === '/zh/index.html') {
        // 使用 setTimeout 确保 DOM 更新完成后再应用动画
        // 针对 Edge 浏览器，需要多次延迟执行以确保动画正确应用
        setTimeout(() => {
          if (typeof window !== 'undefined' && window.applyRotateAnimation) {
            window.applyRotateAnimation();
            // 额外延迟，确保 hero 区域完全渲染（Edge 浏览器需要更长的等待时间）
            setTimeout(() => {
              window.applyRotateAnimation();
            }, 100);
            setTimeout(() => {
              window.applyRotateAnimation();
            }, 300);
          }
        }, 0);
      }
    });
  };