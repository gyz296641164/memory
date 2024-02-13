---
title: ✅P148_性能压测-优化-nginx动静分离
category:
  - 谷粒商城
date: 2024-02-13
---

<!-- more -->

## Nginx动静分离

1、以后将所有项目的静态资源都应该放在nginx里面

2、规则：`/static/**`所有请求都由nginx直接返回

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202312011646797.png#id=HcpUA&originHeight=386&originWidth=1197&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

---

## 删除index静态文件

将`cfmall-product/src/main/resources/static/index`中的`index`静态资源移动到虚拟机 `/mydata/nginx/html/static`目录下

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202312011650357.png#id=ilynN&originHeight=236&originWidth=804&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

删除static文件夹下的index

---

## 修改超链接地址

index.html主要修改点：

`cfmall-product/src/main/resources/templates/index.html`

（1）将script src中的路径加上/static/，ctrl+r 点击Replace All 进行替换

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202312011715535.png#id=kkSve&originHeight=232&originWidth=786&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

（2）将img src、href等加上/static/

```
href="
href="/static/

src="
src="/static/
```

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202312011717959.png#id=vcjHB&originHeight=267&originWidth=932&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

（3）将url中的路径的加上单引号

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202312011719769.png#id=gv2od&originHeight=316&originWidth=978&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

---

## 关闭模板缓存

`cfmall-product/src/main/resources/application.yml`

```java
spring:
  thymeleaf:
    cache: false  #关闭页面缓存
```

---

## 修改nginx配置文件

`vi /mydata/nginx/conf/conf.d/cfmall.conf`

新增静态资源配置：

```java
    location /static/ {
        root /usr/share/nginx/html;
    }
```

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202312011708872.png#id=LmSan&originHeight=521&originWidth=670&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

注意：`/usr/share/nginx/html` 是nginx容器内地址，由宿主机挂载到容器的

重启nginx服务

```java
docker restart nginx
```

---

## 测试

访问[http://cfmall.com/](http://cfmall.com/)，效果如下：

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202312011711632.png#id=UvxGZ&originHeight=584&originWidth=1358&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

如果某些js资源加载不到，可能是`index.html`中引入路径不对！修改为`/static/...` 即可
