import { navbar } from "vuepress-theme-hope";

export const zhNavbar = navbar([
  "/zh/",
  { text: "演示", icon: "discover", link: "/zh/demo/" },
  {
    text: "博文",
    icon: "edit",
    prefix: "/zh/notes/",
    children: [
      {
        text: "JVM",
        icon: "edit",
        prefix: "JVM/",
        children: [
          { text: "1_JVM发展史和Java体系结构", icon: "edit", link: "01-JVM-devlopment/README.md" },
          { text: "2_内存结构", icon: "edit", link: "02-JVM-memory/README.md" },
          { text: "3_垃圾回收", icon: "edit", link: "03-JVM-garbage-collection/README.md" },
          { text: "4_类加载与字节码技术", icon: "edit", link: "04-ClassLoader-ByteCode/README.md" },
          { text: "5_细节补充", icon: "edit", link: "05-JVM-detail-analyse/README.md" },
        ],
      },
      {
        text: "Linux常用命令",
        icon: "edit",
        link: "Linux",
      },
    ],
  }
]);
