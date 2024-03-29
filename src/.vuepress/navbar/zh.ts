import { navbar } from "vuepress-theme-hope";

export const zhNavbar = navbar([
  {
    text: "谷粒商城",
    icon: "/icon/mall.svg",
    link: "/zh/notes/cfmall-notes/",
    // activeMatch: "^/zh/notes/cfmall-notes",
  },
  {
    text: "博文",
    icon: "/icon/note-pad.svg",
    prefix: "/zh/notes/",
    children: [
      {
        text: "网络安全",
        icon: "edit",
        prefix: "BASE/Safety-Concept/",
        children: [
          { text: "HTTPS_TLS1.2握手流程-及证书链", icon: "note", link: "浅析TLS协议的握手流程及证书链路验证过程.md" },
          { text: "密钥-加密算法-数字证书等相关概念", icon: "note", link: "密钥-加密算法-数字证书等相关概念.md" },
          { text: "密码学-公钥密码系统", icon: "note", link: "密码学-公钥密码系统.md" },
          { text: "密码学-数字证书与PKI", icon: "note", link: "密码学-数字证书与PKI.md" },
        ],
      },
      {
        text: "Linux常用命令",
        icon: "note",
        link: "Linux",
      },
    ],
  },
  {
    text: "Spring源码",
    icon: "/icon/spring.svg",
    link: "/zh/notes/Spring/01-spring-source-code-deeply/",
  },
  {
    text: "SpringCloud基础教程",
    icon: "/icon/springcloud.svg",
    link: "/zh/notes/SpringCloud/",
  },
  {
    text: "面试专区",
    icon: "/icon/interview.svg",
    link: "/zh/notes/Interview/",
  },
  {
    text: "工具",
    icon: "/icon/tools.svg",
    children: [
      {
        text: "JSON格式化",
        icon: "/icon/json.svg",
        link: "https://tools.fun/json.html",
      },
      {
        text: "UUID在线生成器",
        icon: "/icon/uuid.svg",
        link: "https://www.zxgj.cn/g/uuid",
      },
      {
        text: "在线对比工具",
        icon: "/icon/compare.svg",
        link: "https://www.fly63.com/tool/textdiff/",
      },
      {
        text: "在线Nginx配置工具",
        icon: "/icon/vscode-icons--folder-type-nginx.svg",
        link: "https://www.digitalocean.com/community/tools/nginx?global.app.lang=zhCN",
      },
    ],
  },
]);
