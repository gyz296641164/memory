---
title: ✅P253_商城业务-消息队列-Direct-Exchange
  - 谷粒商城
date: 2024-02-14
---

<!-- more -->

## 直接交换机

**完全匹配路由键**

**根据下图创建所有要用的交换机、队列、以及绑定关系**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/202306291531988.png#id=Ae4sC&originHeight=359&originWidth=931&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

**依次创建4个队列**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/202306291532180.png#id=MwFD3&originHeight=937&originWidth=1920&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

**创建直接交换机**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/202306291533426.png#id=n2Aqt&originHeight=937&originWidth=1920&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

**绑定关系**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/202306291534079.png#id=lOWQe&originHeight=937&originWidth=1920&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

**查看消息**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/202306291535488.png#id=vLS9o&originHeight=937&originWidth=1920&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

**Nack：表示收到了消息不告诉服务器，消息队列中的消息数量不会减少**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/202306291535409.png#id=xDvaD&originHeight=937&originWidth=1920&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

**服务器收到了消息，队列中的消息就没了**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/202306291536658.png#id=gmo6v&originHeight=937&originWidth=1920&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)
