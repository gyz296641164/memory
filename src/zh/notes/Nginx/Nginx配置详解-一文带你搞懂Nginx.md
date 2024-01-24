---
title: Nginx配置详解
category:
  - Nginx
order: 2
date: 2024-01-24
---

<!-- more -->

# Nginx配置详解，一文带你搞懂Nginx

文章来源：[https://www.toutiao.com/article/7120973453053788675/](https://www.toutiao.com/article/7120973453053788675/)

学习日期：2022/12/29

---

# 1 基本概念

## 1.1 Nginx简介

Nginx是一个高性能的HTTP和反向代理服务器，特点是占用内存少，并发能力强，事实上Nginx的并发能力确实在同类型的网页服务器中表现好。Nginx专为性能优化而开发，性能是其最重要的考量，实现上非常注重效率，能经受高负载的考验，有报告表明能支持高达50000个并发连接数。

## 1.2 正向代理

需要客户自己在浏览器配置代理服务器地址。

例如：在大陆访问www.google.com，我们需要一个代理服务器，我们通过代理服务器去访问谷歌，这个过程就是正向代理。

## 1.3 反向代理

反向代理，客户端对代理是无感知的，因为客户端不需要任何配置就可以访问，我们只需要将请求发送到反向代理服务器，由反向代理服务器去选择目标服务器获取数据后，在返回给客户端，此时反向代理服务器和目标服务器对外就是一个服务器，暴露的是代理服务器地址，隐藏了真实服务器IP地址。

## 1.4 负载均衡

单个服务器解决不了，我们增加服务器的数量，然后将请求分发到各个服务器上，将原先请求集中到单个服务器上的情况改为将请求分发到多个服务器上，将负载分发到不同的服务器，也就是我们说的负载均衡。

## 1.5 动静分离

为了加快网站的解析速度，可以把动态页面和静态页面由不同的服务器来解析，加快解析速度。降低原来单个服务器的压力。

---

# 2 常用命令

进入到下面的目录，然后使用命令

```
cd /usr/local/nginx/sbin
```

## 2.1 查看Nginx版本号

```
./nginx -v
```

## 2.2 启动Nginx

```
./nginx
```

## 2.3 关闭Nginx

```
./nginx -s stop
```

## 2.4 重新加载Nginx

```
./nginx -s reload
```

## 2.5 重启Nginx

```
./nginx -s reopen
```

## 2.6 优雅停止Nginx

```
./nginx -s quit
```

## 2.7 测试配置文件是否正确

```
./nginx -t
```

---

# 3 配置文件

配置文件所在位置：

`/usr/local/nginx/conf/nginx.conf`

## 3.1 配置文件组成

由`全局块`+`events块`+`http块`组成

## 3.2 全局块

从配置文件开始到events之间的内容，主要会设置一些影响Nginx服务器整体运行的配置指令，主要包括配置运行Nginx服务器的用户（组）、允许生成的worker process数，进程pid存放路径、日志存放路径和类型以及配置文件的引入等。

```
worker_processes  1;
#这个是Nginx服务器并发处理服务的关键配置，worker_processes值越大，可以支持的并发处理量越多，但是会受到硬件、软件等设备的制约。
```

## 3.3 events块

events块设计的指令主要影响Nginx服务器与用户的网络连接，常用的设置包括是否开启对多work process下的网络连接进行序列化，是否允许同时接收多个网络连接，选取哪种事件驱动模型来处理连接请求，每个work process可以同时支持的最大连接数等。下面的例子表示每个work process支持的最大连接数为1024。这部分配置对Nginx的性能影响较大，在实际中应该灵活配置。

```
events {
    worker_connections  1024;
}
```

## 3.4 http块

Nginx服务器配置中最频繁的部分，代理、缓存和日志定义等绝大多数功能和第三方模块的配置都在这里，http块又包括http全局块和server块。

### 3.4.1 http全局块

http全局块配置的指令包括文件引入、MIME-TYPE定义、日志自定义、连接超时时间、单链接请求数上限等。

### 3.4.2 server块

这块和虚拟主机有密切关系，虚拟主机从用户角度看，和一台独立的硬件主机是完全一样的，该技术的产生是为了节省互联网服务器硬件成本。

**每个http块可以包括多个server块，而每个server块就相当于一个虚拟主机**。

每个server块也可以分为全局server块，以及可以同时包含多个location块。

#### 3.4.2.1 全局server块

最常见的配置时本虚拟主机的监听配置和本虚拟主机的名称或IP配置。

#### 3.4.2.2 location块

一个server块可以配置多个location块。

这块的主要作用是基于Nginx服务器接收到的请求字符串（例如server_name/uri-string），对虚拟主机名称（也可以是IP别名）之外的字符串（例如前面的/uri-string）进行匹配，对特定的请求进行处理。地址定向、数据缓存和应答控制等功能，还有许多第三方模块的配置也在这里进行。

---

# 4 配置实例

## 4.1 反向代理

### 4.1.1 实例一

#### 4.1.1.1 目标

访问http://ip，访问到的是Tomcat的主页面http://ip:8080。

#### 4.1.1.2 环境

Nginx+JDK8+Tomcat

#### 4.1.1.3 配置文件

```nginx
worker_processes  1;

events {
    worker_connections  1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile        on;
    keepalive_timeout  65;
    server {
        listen       80;
        #server_name localhost;
        server_name  192.168.71.167;
        location / {
            root   html;
            #添加下面的一句话
			proxy_pass http://127.0.0.1:8080;
            index  index.html index.htm;
        }
        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }
    }
}
```

#### 4.1.1.4 重新加载Nginx配置文件

```
/usr/local/nginx/sbin/nginx -s reload
```

#### 4.1.1.5 测试

访问：http://192.168.71.167/，看到的是Tomcat的首页。

### 4.1.2 实例二

#### 4.1.2.1 目标

根据访问的路径跳转到不同的服务器中去。

访问http://ip:9001/edu 直接跳到http://127.0.0.1:8080/edu

访问http://ip:9001/vod 直接跳到http://127.0.0.1:9090/vod

#### 4.1.2.2 环境

Nginx+JDK8+配置两个Tomcat，Tomcat的配置不再讲述。

#### 4.1.2.3 配置文件

```nginx
worker_processes  1;

events {
    worker_connections  1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile        on;
    keepalive_timeout  65;
    #实例一的配置
    server {
        listen       80;
        #server_name localhost;
        server_name  192.168.71.167;
        location / {
            root   html;
            #添加下面的一句话
			proxy_pass http://127.0.0.1:8080;
            index  index.html index.htm;
        }
        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }
    }
    #实例二的配置
    server {
        listen       9001;
        server_name  192.168.71.167;
        location ~/edu/ {
                proxy_pass http://127.0.0.1:8080;
        }
        location ~/vod/ {
                proxy_pass http://127.0.0.1:9090;
        }
    }
    
}
```

#### 4.1.2.4 重新加载Nginx配置文件

```
/usr/local/nginx/sbin/nginx -s reload
```

#### 4.1.2.5 测试

访问
http://192.168.71.167:9001/edu/a.html跳到了http://127.0.0.1:8080/edu/a.html页面。

访问
http://192.168.71.167:9001/vod/a.html跳到了http://127.0.0.1:9090/vod/a.html页面。

### 4.1.3 proxy_set_header

假如Nginx代理服务器Server的配置为：192.168.71.167:9001，跳到：127.0.0.1:8080，访问者的IP为：192.168.71.200:20604。

#### 4.1.3.1 Host

```
proxy_set_header Host $host:$server_port;
# Host的值为192.168.71.167:9001
```

#### 4.1.3.2 X-Real-IP

```
proxy_set_header X-Real-IP $remote_addr;
# X-Real-IP的值为：192.168.71.200
```

#### 4.1.3.3 X-Real-PORT

```
proxy_set_header X-Real-PORT $remote_port;
# X-Real-PORT的值为：20604
```

#### 4.1.3.4 X-Forwarded-For

```
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
# X-Forwarded-For的值为：192.168.71.200
```

## 4.2 负载均衡

### 4.2.1 目标

通过访问
http://192.168.71.167/edu/a.html，实现负载均衡的效果，平均分摊到8080和8081端口中。

### 4.2.2 环境

Nginx+JDK8+2台Tomcat，一台8080，一台8081。

### 4.2.3 配置文件

```nginx
worker_processes  1;

events {
    worker_connections  1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile        on;
    keepalive_timeout  65;

    upstream myserver{
      #ip_hash;
      server 192.168.71.167:8080 weight=1;
      server 192.168.71.167:8081 weight=1;
    }

    server {
        listen       80;
        #server_name localhost;
        server_name  192.168.71.167;
        location / {
            root   html;
						proxy_pass http://myserver;
						proxy_connect_timeout 10;
            index  index.html index.htm;
        }
        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }
    }
}
```

### 4.2.4 测试

访问：
http://192.168.71.167/edu/a.html，8080和8081交替访问。

### 4.2.5 策略

1 轮询（默认）

每个请求按时间顺序逐一分配到不同的后端服务器，如果后端服务器down掉，能自动剔除。

2 weight

weight代表权重，默认为1，权重越高被分配的客户端越多。

指定轮询几率，weight和访问比率成正比，用于后端服务器性能不均的情况。

3 ip_hash

每个请求按访问IP的hash结果分配，这样每个访客固定访问一个后端服务器，可以解决session的问题，示例如下：

```
upstream myserver{
  ip_hash;
  server 192.168.71.167:8080 weight=1;
  server 192.168.71.167:8081 weight=1;
}
```

4 fair（第三方）

按后端服务器的响应时间来分配请求，响应时间短的优先分配。

```
upstream myserver{
  fair;
  server 192.168.71.167:8080 weight=1;
  server 192.168.71.167:8081 weight=1;
}
```

## 4.3 动静分离

### 4.3.1 准备工作

```
mkdir /data
cd /data
mkdir www #在www文件夹里放个a.html
mkdir image #在image文件夹里放个1.jpg
```

### 4.3.2 配置文件

```nginx
worker_processes  1;

events {
    worker_connections  1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile        on;
    keepalive_timeout  65;
    server {
        listen       80;
        server_name  192.168.71.167;
        
        location /www/ {
            root   /data/;
            index  index.html index.htm;
        }

        location /image/ {
            root   /data/;
						autoindex on;
        }
        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }
    }
}
```

### 4.3.3 测试

访问图片：
[http://192.168.71.167/image/1.jpg](http://192.168.71.167/image/1.jpg)

访问页面：
[http://192.168.71.167/www/a.html](http://192.168.71.167/www/a.html)

访问目录：
http://192.168.71.167/image/（因为设置了autoindex on;）

## 4.4 高可用集群

### 4.4.1 环境准备

两台机器，每台机器都装有keepalived+Nginx+Tomcat。

### 4.4.2 安装keepalived

```
yum -y install keepalived
#检查是否安装
rpm -q -a keepalived
#安装的配置文件位置
/etc/keepalived/keepalived.conf
#启动和关闭
systemctl start keepalived
systemctl stop keepalived
```

### 4.4.3 完成高可用配置

主备keepalived服务器中只有master一台机器会出现VIP地址，否则会出现脑裂问题。

#### 4.4.3.1 主keepalived的配置

```nginx
global_defs {
  notification_email {
    acassen@firewall.loc
    failover@firewall.loc
    sysadmin@firewall.loc
  }
  notification_email_from Alexandre.Cassen@firewall.loc
  smtp_server 192.168.200.1
  smtp_connect_timeout 30
  router_id 192.168.71.167
}
vrrp_script nginx_check
{
  script "/usr/local/src/nginx_check.sh"
  #(每秒检查一次)
  interval 1
  weight -30
}
vrrp_instance VI_1 {
  state MASTER
  interface ens33
  #虚拟路由ID，小于255，最终用于构成虚拟MAC地址，必须与backup一致  
  virtual_router_id 51
  #优先级，0-254
  priority 100
  advert_int 1
  authentication {
  	auth_type PASS
  	auth_pass 1111
  }
  virtual_ipaddress {
  	192.168.71.100
  }
  track_script {
    nginx_check
  }
}
```

#### 4.3.3.2 备keepalived的配置

```nginx
global_defs {
  notification_email {
    acassen@firewall.loc
    failover@firewall.loc
    sysadmin@firewall.loc
  }
  notification_email_from Alexandre.Cassen@firewall.loc
  smtp_server 192.168.200.1
  smtp_connect_timeout 30
  router_id 192.168.71.168
}
vrrp_script nginx_check
{
  script "/usr/local/src/nginx_check.sh"
  #(每秒检查一次)
  interval 1
  weight 2
}
vrrp_instance VI_1 {
  state backup
  interface ens33
  #虚拟路由ID，小于255，最终用于构成虚拟MAC地址，必须与backup一致  
  virtual_router_id 51
  #优先级，0-254
  priority 80
  advert_int 1
  authentication {
      auth_type PASS
      auth_pass 1111
  }
  virtual_ipaddress {
      192.168.71.100
  }
  track_script {
    nginx_check
  }
}
```

#### 4.3.3.3 chk_nginx.sh脚本

```
#!/bin/bash
A=`ps -C nginx --no-header |wc -l`
if [ $A -eq 0 ];then
	#发现停止后，自动启动
  /usr/local/nginx/sbin/nginx
  sleep 2
  #重启不成功，则kill掉keepalived
  if[ `ps -C nginx --no-header |wc -l` -eq 0 ];then
    systemctl stop keepalived
  fi
fi
```

【提示】脚本要加+x的执行权限：chmod +x chk_nginx.sh

### 4.4.4 Nginx里配置

在Nginx里把虚拟IP配置进去即可。

---

# 5 原理介绍

## 5.1 master&worker

一个Nginx是由一个master进程和多个worker进程组成的。

## 5.2 worker如何工作的

客户端发送请求到Master，然后给worker，再由这些work争抢处理这个请求。

## 5.3 一个master多个worker的好处

1 可以使用`nginx -s reload`进行热部署方式；

2 每个worker是独立的进程，如果有其中的一个worker出现了问题，其他worker独立的继续进行争抢，实现请求的过程，不会造成服务的中断；

## 5.4 设置多少个worker合适

Nginx和Redis类似，都采用了io多路复用机制。每个worker进程都可以把CPU发挥到极致，**一般来说worker数和服务器的CPU数相等是最为适宜的**。

```
# 如4个CPU
worker_processes 4;
```

## 5.5 worker_connection连接数

### 5.5.1 请求占用的连接数

发送请求：访问静态资源占用2个连接，反向代理占用4个连接。

### 5.5.2 最大并发

```
访问静态资源：最大连接数=worker_processes*worker_connections/2
反向代理：最大连接数=worker_processes*worker_connections/4
```

---

# 总结

这篇文章是我从事Java服务端开发多年的经验和总结，都是亲自执行过并且配置成功的。
