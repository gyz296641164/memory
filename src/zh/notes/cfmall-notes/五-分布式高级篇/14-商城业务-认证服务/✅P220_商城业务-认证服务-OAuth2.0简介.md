---
title: ✅P220_商城业务-认证服务-OAuth2.0简介
category:
  - 谷粒商城
date: 2024-02-14
---

<!-- more -->

## 社交登陆

QQ、微博、github等网站的用户量非常大，别的网站为了简化自我网站的登陆与注册逻辑，引入社交登陆功能；

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202304/image-20230409121219025.png#id=hFlYV&originHeight=511&originWidth=475&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

步骤：

1. 用户点击QQ按钮
2. 引导跳转到QQ授权页
3. 用户主动点击授权，跳回之前网页。

---

## OAuth2.0

**OAuth**

- OAuth（开放授权）是一个开放标准，允许用户授权第三方网站访问他们存储在另外的服务提供者上的信息，而不需要将用户名和密码提供给第三方网站或分享他们数据的所有内容。

**OAuth2.0**

对于用户相关的 OpenAPI（例如获取用户信息，动态同步，照片，日志，分享等），为了保护用户数据的安全和隐私，第三方网站访问用户数据前都需要显式的向用户征求授权。

**官方版流程**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202304/image-20230409121533057.png#id=oFDxu&originHeight=621&originWidth=997&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

（A）用户打开客户端以后，客户端要求用户给予授权；
（B）用户同意给予客户端授权；
（C）客户端使用上一步获得的授权，向认证服务器申请令牌；
（D）认证服务器对客户端进行认证以后，确认无误，同意发放令牌；
（E）客户端使用令牌，向资源服务器申请获取资源；
（F）资源服务器确认令牌无误，同意向客户端开放资源。

**OAuth2.0流程理解**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202304/image-20230409121613409.png#id=AoJob&originHeight=556&originWidth=1188&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

1、使用Code换取AccessToken，Code只能用一次
2、同一个用户的AccessToken一段时间是不会变化的，即使多次获取
