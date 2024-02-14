---
title: ✅P251_商城业务-消息队列-RabbitMQ安装
category:
  - 谷粒商城
date: 2024-02-14
---

<!-- more -->

## 一、Docker安装RabbitMQ

docker安装RabbitMQ命令：

```
docker run -d --name rabbitmq -p 5671:5671 -p 5672:5672 -p 4369:4369 -p 25672:25672 -p 15671:15671 -p 15672:15672 rabbitmq:management
```

开机自启动

```
docker update rabbitmq --restart=always
```

官网介绍：[https://www.rabbitmq.com/networking.html](https://www.rabbitmq.com/networking.html)

```
4369, 25672 (Erlang发现&集群端口)
5672, 5671 (AMQP端口)
15672 (web管理后台端口)
61613, 61614 (STOMP协议端口)
1883, 8883 (MQTT协议端口)
```

登录地址： [http://192.168.56.10:15672/](http://192.168.56.10:15672/)

首次登录的账号密码都是：**guest**

---

## 二、页面介绍

**OverView介绍：**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/829f579b6c194465b204a3fc19b87204.png#id=ecxLO&originHeight=936&originWidth=2028&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=) **查看对应的协议和端口号**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/5edfc6fb0f544bd0b6e3ba056e52a835.png#id=tTtJi&originHeight=866&originWidth=1509&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

**RabbitMQ配置文件的迁移，从老版本的RabbitMQ中下载配置文件**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/3235ec6671bb43c2ae8cbfc1b205c5b5.png#id=QvqGd&originHeight=792&originWidth=1859&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

**上传至新版本的RabbitMQ配置文件**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/c4eb9d29d9d748f98b97c1ba6a133735.png#id=utbCz&originHeight=881&originWidth=1550&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

**Connections介绍：**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/3a9aff828d2e480b91f609fab250871c.png#id=Hlig5&originHeight=502&originWidth=1998&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

**Channels介绍：**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/bacd5e07af304cd683378b11ca050004.png#id=BoXog&originHeight=503&originWidth=2015&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

**Exchanges介绍：**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/2cc8d6b040974029958911f658e142a2.png#id=LpZFi&originHeight=848&originWidth=1688&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

**添加新的交换机**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/9d13618e94e7440db076c82e69f9f86c.png#id=Ty295&originHeight=931&originWidth=1664&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)![](https://img-blog.csdnimg.cn/27e11d573f6e4648a0b051dbd0267310.png#id=Do0JE&originHeight=725&originWidth=1909&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

**队列介绍：**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/6e455a5ddb504fc9ac88e35b97ac63c7.png#id=RzQzE&originHeight=936&originWidth=1633&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

**Admin介绍：**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/8d72dcb181cb4e9c83ce66451499c229.png#id=jm41H&originHeight=848&originWidth=2044&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

**虚拟主机介绍：**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/21254a2c4d044a9d82a7d8b9652d0781.png#id=c4ch9&originHeight=797&originWidth=2034&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

**查看自己创建的虚拟主机：**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/df49af5c206e47a2b78b0dc99018fb19.png#id=LMqlh&originHeight=781&originWidth=1687&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

**进入后可配置权限**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/d4a0c78954164171818fa474c7793412.png#id=prBT9&originHeight=942&originWidth=1548&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)**删除虚拟主机**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/f9c104ffa4ba499bb37d242aa21fc569.png#id=WYekn&originHeight=922&originWidth=1517&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

**设置最大连接数**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/e99595c9450841e08ebcc565f6eb6e9f.png#id=zu6Gn&originHeight=666&originWidth=2012&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

**显示集群消息**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/7aa5b1e9d4c34051bfda7f06b72669b0.png#id=PHtP3&originHeight=771&originWidth=2037&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)
