---
title: ✅P124_全文检索-ElasticSearch-分词-自定义扩展词库
category:
  - 谷粒商城
date: 2024-02-13
---

<!-- more -->

## Docker安装 nginx
自定义的词库需要部署到Nginx中，因此，需要先安装Nginx
### 创建要挂载的配置目录

```shell
mkdir -p /mydata/nginx/conf
```

### 启动临时nginx容器

```shell
docker run -p 80:80 --name nginx -d nginx:1.10
```

### 拷贝出 Nginx 容器的配置

```shell
# 将nginx容器中的nginx目录复制到本机的/mydata/nginx/conf目录
docker container cp nginx:/etc/nginx /mydata/nginx/conf

# 复制的是nginx目录，将该目录的所有文件移动到 conf 目录
mv /mydata/nginx/conf/nginx/* /mydata/nginx/conf/

# 删除多余的 /mydata/nginx/conf/nginx目录
rm -rf /mydata/nginx/conf/nginx
```

### 删除临时nginx容器

```shell
# 停止运行 nginx 容器
docker stop nginx

# 删除 nginx 容器
docker rm nginx
```

### 启动 nginx 容器

```shell
docker run -p 80:80 --name nginx \
-v /mydata/nginx/html:/usr/share/nginx/html \
-v /mydata/nginx/logs:/var/log/nginx \
-v /mydata/nginx/conf/:/etc/nginx \
-d nginx:1.10
```

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241750150.png#id=AFVcF&originHeight=135&originWidth=683&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

### 设置 nginx 随 Docker 启动

```shell
docker update nginx --restart=always
```

### 测试 nginx

`/mydata/nginx/html` 目录下新建 `index.html`，编辑内容如下进行保存：

```shell
<h1>Cf_Mall</h1>
```

访问：[http://192.168.56.10/](http://192.168.56.10/)	
![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241750752.png#id=eitbw&originHeight=366&originWidth=794&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

---

## 自定义词库

> 首先在 /mydata/nginx/html/es 下新建 “fenci.txt”


![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241750450.png#id=Fm62y&originHeight=133&originWidth=519&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)
定义文本如下
![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241750603.png#id=H7LCM&originHeight=65&originWidth=364&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

> 容器内的`/usr/share/elasticsearch/plugins/ik/config/`中的 `IKAnalyzer.cfg.xml`
已经挂载到宿主机`/mydata/elasticsearch/plugins/ik/config` 下，直接修改即可。


![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241750446.png#id=Ay6Z0&originHeight=368&originWidth=778&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

修改后的内容如下

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241750487.png#id=YWDrO&originHeight=316&originWidth=808&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

重启ES容器

```shell
docker restart <esID>
```

> 测试

可以看到“元宇宙”这个词元被分出来了！

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241750286.png#id=UyKLJ&originHeight=903&originWidth=1920&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)
