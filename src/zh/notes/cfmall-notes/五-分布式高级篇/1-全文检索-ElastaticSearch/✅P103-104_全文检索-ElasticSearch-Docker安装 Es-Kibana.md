---
title: ✅P103-104_全文检索-ElasticSearch-Docker安装 Es-Kibana
category:
  - 谷粒商城
date: 2024-02-13
---

<!-- more -->

## Docker 安装 Elasticsearch

### 1、下载镜像文件

```shell
# 存储和检索数据
docker pull elasticsearch:7.4.2 
# 可视化检索数据
docker pull kibana:7.4.2
```

### 2、创建实例

```shell
mkdir -p /mydata/elasticsearch/config
mkdir -p /mydata/elasticsearch/data
echo "http.host: 0.0.0.0" >> /mydata/elasticsearch/config/elasticsearch.yml

# 保证权限
chmod -R 777 /mydata/elasticsearch/ 

docker run --name elasticsearch -p 9200:9200 -p 9300:9300 \
-e "discovery.type=single-node" \-e ES_JAVA_OPTS="-Xms64m -Xmx512m" \
-v /mydata/elasticsearch/config/elasticsearch.yml:/usr/share/elasticsearch/config/elasticsearch.yml \
-v /mydata/elasticsearch/data:/usr/share/elasticsearch/data \
-v /mydata/elasticsearch/plugins:/usr/share/elasticsearch/plugins \
-d elasticsearch:7.4.2
```

特别注意：

```shell
-e ES_JAVA_OPTS="-Xms64m -Xmx256m" \
```

测试环境下， 设置 ES 的初始内存和最大内存， 否则导致过大启动不了 ES 。

### 3、测试

完成安装后，通过访问：`http:// + 虚拟机ip + 9200` 端口测试是否成功

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241724637.png#id=gFAp9&originHeight=443&originWidth=553&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

### 4、问题

在执行 `docker run ...` 报磁盘空间不足错误：

`docker: Error response from daemon: mkdir /var/lib/docker/overlay2/b909e8bef85ab4e44f031ead848b922346f9955070ae79c72c24e25834243a3d: no space left on device.`

具体解决方法详见以下文章：[创建实例磁盘空间不足【no space left on device】](https://www.yuque.com/lasted_memory/uoi5s5/zou3dv#tKOcI)

---

## Docker 安装Kibana

> docker run --name kibana -e ELASTICSEARCH_HOSTS=http://192.168.56.10:9200 -p 5601:5601 -d kibana:7.4.2


> [http://192.168.56.10:9200](http://192.168.56.10:9200) 一定改为自己虚拟机的地址


> 完成安装后，通过访问：`http://虚拟机ip:5601` 端口测试是否成功


---

## 自动重启Elasticsearch、Kibana

命令如下：

```shell
docker update <容器id> --restart=always
```
