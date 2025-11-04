import { defineUserConfig } from "vuepress";
import theme from "./theme.js";
import { viteBundler } from '@vuepress/bundler-vite'
import commonjs from '@rollup/plugin-commonjs';


export default defineUserConfig({

  base: '/',

  locales: {
    "/": {
      lang: "zh-CN",
      title: "Memory",
      description: "vuepress-theme-hope 的博客演示",
    },
  },

  bundler: viteBundler({
    viteOptions: {},
    vuePluginOptions: {},
  }),

  // 主题
  theme,

  port: 8099, //自定义项目启动端口号  

  head: [
    // Favicon - GYZ 图标 (使用ICO格式)
    ["link", { rel: "icon", type: "image/x-icon", href: "/favicon.ico" }],
    ["link", { rel: "shortcut icon", href: "/favicon.ico" }],
    
    // 预加载首页图标，确保立即显示
    ["link", { rel: "preload", href: "/logo2.svg", as: "image" }],

    // 字体：导入思源宋体相应链接
    ["link", { rel: "preconnect", href: "https://fonts.googleapis.com" }],
    [
      "link",
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
    ],
    [
      "link",
      {
        href: "https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;700&display=swap",
        rel: "stylesheet",
      },
    ],

    // 添加百度统计
    [
      'script', {}, `
        var _hmt = _hmt || [];
        (function() {
          var hm = document.createElement("script");
          hm.src = "https://hm.baidu.com/hm.js?6cb4b3bacbe228f6c0c1476ee3382b64";
          var s = document.getElementsByTagName("script")[0]; 
          s.parentNode.insertBefore(hm, s);
        })();
        `
    ],
      // 确保首页图标立即显示并开始3D横向旋转，同时禁止导航栏logo旋转
    [
      'script', {}, `
        (function() {
          function applyRotateAnimation() {
            // 排除导航栏logo
            const navLogos = document.querySelectorAll('.vp-nav-logo, nav img, .navbar img');
            navLogos.forEach(function(img) {
              img.style.animation = 'none';
              img.style.transform = 'none';
            });
            
            // 只对首页hero区域的图片应用3D旋转
            const heroImages = document.querySelectorAll('[class*="hero"] img, [class*="Hero"] img, .hero-image, .vp-hero-image, .hero img, .vp-hero img');
            heroImages.forEach(function(img) {
              // 确保不是导航栏的logo
              if (!img.closest('nav') && !img.classList.contains('vp-nav-logo') && !img.closest('.navbar')) {
                img.style.opacity = '1';
                img.style.visibility = 'visible';
                img.style.display = 'block';
                img.style.animation = 'rotate-gyroscope 10s linear infinite';
                img.style.transformOrigin = 'center center';
                img.style.transformStyle = 'preserve-3d';
                img.style.willChange = 'transform';
              }
            });
          }
          
          // 立即执行
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', applyRotateAnimation);
          } else {
            applyRotateAnimation();
          }
          
          // 使用 MutationObserver 监听 DOM 变化，确保动态加载的元素也能应用样式
          const observer = new MutationObserver(applyRotateAnimation);
          observer.observe(document.body, { childList: true, subtree: true });
          
          // 延迟检查，确保所有元素都已加载
          setTimeout(applyRotateAnimation, 100);
          setTimeout(applyRotateAnimation, 500);
        })();
        `
    ],
    
    //SEO优化：供百度等收录
    ["meta", { name: "robots", content: "all" }],
    ["meta", { name: "author", content: "gong_yz" }],

    //禁用浏览器缓存
    [
      "meta",
      {
        "http-equiv": "Cache-Control",
        content: "no-cache, no-store, must-revalidate",
      },
    ],
    ["meta", { "http-equiv": "Pragma", content: "no-cache" }],
    ["meta", { "http-equiv": "Expires", content: "0" }],

    //关键词被搜索
    [
      "meta",
      {
        name: "keywords",
        content:
          "JavaSE, 并发编程, JVM, MySQL, Spring源码, Redis, MyBatis, 谷粒商城",
      },
    ],
    [
      "meta",
      {
        name: "description",
        content:
          "Memory's Notes：不积跬步，无以至千里；不积小流，无以成江海。",
      },
    ],
  ],

  plugins: [
    //解决打包问题
    commonjs() as any, // 要放在第一行，否则不生效
  ],
  shouldPrefetch: false,
});




