---
title: ✅P225_商城业务-认证服务-分布式session不共享不同步问题
category:
  - 谷粒商城
date: 2024-02-14
---

<!-- more -->

## 开篇
### 正常登录

登录成功后，NickName不会显示，

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202312/d626135d12d4691b0fe1055023fbcba9.png#id=YVbBr&originHeight=125&originWidth=883&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

在之前的单体应用中，会将登录成功后的属性保存到session中，

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202312/3aacdb5767a01d1c64fedf41150ee103.png#id=PtJQR&originHeight=855&originWidth=1047&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

Thymeleaf取出session，

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202312/b55dfeed2ce0f814a839b75114132ee8.png#id=VN4p5&originHeight=239&originWidth=887&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

### 出现问题

NickName未显示，

问题原因：Session不能跨域使用

`auth.cfmall`域下的session作用域只限于`auth.cfmall`域，cfmall域是获取不到的，不共享的

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202312/3bde617a3655f18f2614ac29531ce0c3.png#id=fwWA3&originHeight=685&originWidth=1319&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202312/86b4116b2da8b65c7e94cffda91b9d80.png#id=zQ8uK&originHeight=452&originWidth=1477&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

---

## session原理

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202312/fe15df5acd4a732db18c819c8048f849.png#id=NGklv&originHeight=541&originWidth=957&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

---

## 分布式下session共享问题

同一个服务，复制多份，session不同步问题

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202312/27fc0161ef623a31c96eda704dea911a.png#id=te8Rt&originHeight=230&originWidth=475&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

不同服务，session不能共享问题

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202312/2a20ee31b444abecc5bf80ac64da7d47.png#id=qpVIQ&originHeight=202&originWidth=431&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)
