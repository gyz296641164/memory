---
title: ✅P139_商城业务-nginx-搭建域名访问环境---反向代理配置
category:
  - 谷粒商城
date: 2024-02-13
---

<!-- more -->

## 正向代理与反向代理

正向代理：如科学上网，隐藏客户端信息

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311301526480.png#id=IopXd&originHeight=262&originWidth=1233&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

反向代理：屏蔽内网服务器信息，负载均衡访问

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311301526094.png#id=voGD6&originHeight=271&originWidth=1201&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

---

## host文件配置域名

域名解析的规则：

- 先解析本机是否有相应的映射规则
- host文件配置内容：`# 127.0.0.1 localhost`，含义为访问localhost即访问127.0.0.1
- DNS域名解析获取相应的ip地址

host文件位置：`C:\Windows\System32\drivers\etc`

添加配置内容：

```java
# 虚拟机ip
192.168.17.130 cfmall.com
```

修改host文件时注意将：右键->属性->只读去掉，允许编辑

---

## Nginx+Windows搭建域名访问环境

让nginx帮我们进行反向代理，所有来自原`cfmall.com`的请求，都转到商品服务

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311301538798.png#id=gR7TY&originHeight=562&originWidth=1188&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

---

## 域名映射效果

- 请求接口 cfmall.com
- 请求页面 cfmall.com
- nginx直接代理给网关，网关判断 
   - 如果`/api/****`，转交给对应的服务器
   - 如果是满足域名，转交给对应的服务

---

## Nginx配置文件

### 组成

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311301539560.png#id=mei9x&originHeight=705&originWidth=1380&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

### 内容详解

`cat /mydata/nginx/conf/nginx.conf`

```java
user  nginx;
worker_processes  1;

error_log  /var/log/nginx/error.log warn;
pid        /var/run/nginx.pid;


events {
    worker_connections  1024;
}


http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile        on;
    #tcp_nopush     on;

    keepalive_timeout  65;

    #gzip  on;

    include /etc/nginx/conf.d/*.conf;
}
```

`include /etc/nginx/conf.d/*.conf;`说明在 conf.d 目录下所有 .conf 后缀的文件内容都会作为 nginx 配置文件 http 块中的配置。这是为了防止主配置文件太复杂，也可以对不同的配置进行分类。

---

## 配置cfmall.conf

默认配置下，我们访问 cfmall.com 会请求 nginx 默认的 index 页面，现在我们要做的是当访问 cfmall.com 的时候转发到我们的商品模块的商城首页界面。

参考 `/mydata/nginx/conf/conf.d` 目录下`default.conf`配置，来配置 cfmall 的 server 块配置。

`cp default.conf cfmall.conf`

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311301614954.png#id=Jrx5q&originHeight=94&originWidth=515&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

`cfmall.conf`内容如下

```java
server {
    listen       80;
    server_name  cfmall.com;

    #charset koi8-r;
    #access_log  /var/log/nginx/log/host.access.log  main;

    location / {
	  # x为主机ip，8200为cfmall-product服务端口,
      proxy_pass http://x.x.x.x:8200; 
    }

    #error_page  404              /404.html;

    # redirect server error pages to the static page /50x.html
    #
    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   /usr/share/nginx/html;
    }
}
```

**重启nginx**：`docker restart nginx`

---

## 测试

[http://cfmall.com/](http://cfmall.com/)

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311301615372.png#id=hXJct&originHeight=485&originWidth=1400&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

---

## 附录

给配置文件添加行数显示：

`ESC`  ---> `:set number`
