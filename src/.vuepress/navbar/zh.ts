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
        text: "JVM",
        icon: "edit",
        prefix: "JVM/",
        children: [
          { text: "1_JVM发展史和Java体系结构", icon: "note", link: "01-JVM-devlopment/README.md" },
          { text: "2_内存结构", icon: "note", link: "02-JVM-memory/README.md" },
          { text: "3_垃圾回收", icon: "note", link: "03-JVM-garbage-collection/README.md" },
          { text: "4_类加载与字节码技术", icon: "edit", link: "04-ClassLoader-ByteCode/README.md" },
          { text: "5_细节补充", icon: "note", link: "05-JVM-detail-analyse/README.md" },
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
        text: "iP地址归属地查询",
        icon: "/icon/IP.svg",
        link: "https://www.ip138.com/", 
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
