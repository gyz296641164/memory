---
title: ✅P140_商城业务-nginx-搭建域名访问环境---负载均衡到网关
category:
  - 谷粒商城
date: 2024-02-13
---

<!-- more -->

## 开篇

随着服务的增多，每次都配置将会很麻烦，因此，需要将访问cfmall.com的请求转发给网关，由网关处理。

ngixn负载均衡配置文档：[Using nginx as HTTP load balancer](http://nginx.org/en/docs/http/load_balancing.html)

---

## 修改nginx.conf

`vim /mydata/nginx/conf/nginx.conf`

修改 http 块，配置了上流服务的名称cfmall，服务块的地址为本机的网关地址，新配置内容如下：

```
    upstream cfmall {
        server 192.168.189.1:88;
    }
```

完整`nginx.conf`

```nginx
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

    upstream cfmall {
        server 192.168.189.1:88;
    }

    include /etc/nginx/conf.d/*.conf;
}
```

---

## 修改cfmall.conf

配置代理地址为上面配置的上游服务器名称cfmall：`proxy_pass http://cfmall;`

会自动去上游服务的组中查找

```java
server {
    listen       80;
    server_name  cfmall.com;

    #charset koi8-r;
    #access_log  /var/log/nginx/log/host.access.log  main;

    location / {
      # 寻找nginx.conf中配置的上游服务cfmall
      proxy_pass http://cfmall;
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

重启nginx：`docker retsart nginx`

---

## 配置路由

gateway host 路由规则配置文档：[Spring Cloud Gateway](https://docs.spring.io/spring-cloud-gateway/docs/current/reference/html/#the-host-route-predicate-factory)

`cfmall-gateway`模块`application.yml`，新增如下配置，

```java
        - id: cfmall_host_route
          uri: lb://cfmall-product
          predicates:
            - Host=**.cfmall.com,cfmall.com
```

**注意**：host配置必须置于其它配置之后，否则位于host配置之前的配置将会失效！

重启网关服务；

---

## 测试

出现问题：访问域名报错404，访问api接口可以访问成功，

问题分析：nginx已经将请求反向代理给网关，但是网关的host路由断言未起作用

问题原因：nginx将请求交由网关处理的时候会丢失host

解决方法：`cfmall.conf`设置请求头

```
    location / {
      #nginx代理给网关的时候，会丢失请求的host信息
      proxy_set_header Host $host;
      # 寻找nginx.conf中配置的上游服务cfmall
      proxy_pass http://cfmall;
    }
```

重启nginx，访问 [http://cfmall.com](http://cfmall.com) 成功

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311301719258.png#id=tB2EW&originHeight=459&originWidth=770&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

---

## 访问跳转分析

> **未配置路由前的跳转分析**


当前通过域名的方式，请求 cfmall.com ；

1. 根据 hosts 文件的配置，请求 cfmall.com 域名时会请求虚拟机 ip

```java
192.168.17.130 cfmall.com
```

2.  当请求到 `192.168.17.130:80` 时，会被 nginx 转发到我们配置的主机 `x.x.x.x:8200` 路径，该路径为运行商品服务的 windows 主机 ip 地址，至此达到通过域名访问商品服务的目的。 
```
server {
    listen       80;
    server_name  cfmall.com;
    location / {
      # x为主机ip，8200为cfmall-product服务端口,
      proxy_pass http://x.x.x.x:8200; 
    }
}
```
 

> **配置路由后的跳转分析**


之后为了统一管理我们的各种服务，我们将通过配置网关作为 nginx 转发的目标。最后通过配置网关根据不同的域名来判断跳转对应的服务。

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311301737231.png#id=b8FIi&originHeight=342&originWidth=577&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)
