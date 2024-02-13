---
title: ✅P122-123_全文检索-ElasticSearch-分词
category:
  - 谷粒商城
date: 2024-02-13
---

<!-- more -->

## 分词

一个 `tokenizer（ 分词器）` 接收一个字符流， 将之分割为独立的 `tokens`（ `词元`， 通常是独立的单词） ， 然后输出 tokens 流。

- 例如， whitespace tokenizer 遇到空白字符时分割文本。 它会将文本 "Quick brown fox!" 分割为 [Quick, brown, fox!]

- 该 tokenizer（分词器） 还负责记录各个 term（词条） 的顺序或 position 位置（用于 phrase 短语和 word proximity 词近邻查询 ，以及 term（词条） 所代表的原始 word（单词） 的 start（起始） 和 end（结束） 的 character offsets（字符偏移量） （用于高亮显示搜索的内容） 。Elasticsearch 提供了很多内置的分词器， 可以用来构建 custom analyzers（自定义分词器） 。

---

## 配置允许账号密码登录

vagrant 默认只允许 ssh 登录方式， 为了后来操作方便， 文件上传等， 我们可以配置允许账号密码登录
```json
cmd窗口vagrant up 启动虚拟机
vagrant ssh 进去系统之后
vi /etc/ssh/sshd_config
修改 PasswordAuthentication yes
重启服务 service sshd restart
```
以后可以使用提供的 ssh 连接工具直接连接（如Xshell）。

---

## 安装 ik 分词器
### 下载

IK 分词器属于 Elasticsearch 的插件，所以 IK 分词器的安装目录是 Elasticsearch 的 plugins 目录，在我们使用Docker启动 Elasticsearch 时，已经将该目录挂载到主机的 /mydata/elasticsearch/plugins 目录。

IK 分词器的版本需要跟 Elasticsearch 的版本对应，当前选择的版本为 `7.4.2`

IK 分词器版本下载地址：[https://github.com/medcl/elasticsearch-analysis-ik/releases](https://github.com/medcl/elasticsearch-analysis-ik/releases)
```json
# 进入挂载的插件目录 /mydata/elasticsearch/plugins
cd /mydata/elasticsearch/plugins

# 安装 wget 下载工具
yum install -y wget

# 下载对应版本的 IK 分词器（这里是7.4.2）
wget https://github.com/medcl/elasticsearch-analysis-ik/releases/download/v7.4.2/elasticsearch-analysis-ik-7.4.2.zip
```
进入到 Elasticsearch 容器内部检查是否成功下载
```json
# 进入容器内部
docker exec -it elasticsearch /bin/bash

# 查看 es 插件目录
ls /usr/share/elasticsearch/plugins

# 可以看到 elasticsearch-analysis-ik-7.4.2.zip
```
### 解压
```json
# 进入到 es 的插件目录
cd /mydata/elasticsearch/plugins

# 解压到 plugins 目录下的 ik 目录
unzip elasticsearch-analysis-ik-7.4.2.zip -d ik

# 删除下载的压缩包
rm -rf elasticsearch-analysis-ik-7.4.2.zip 

# 修改文件夹权限为可读可写可执行
chmod -R 777 ik/
```

---

## 查看安装的ik插件

```json
# 进入 es 容器内部
docker exec -it elasticsearch /bin/bash

# 进入 es bin 目录
cd /usr/share/elasticsearch/bin

# 执行查看命令  显示 ik
elasticsearch-plugin list

# 退出容器
exit

# 重启 Elasticsearch
docker restart elasticsearch
```

---

## 测试分词器

> **使用默认**

```json
POST _analyze
{
  "text": "我是中国人"
}
```
![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241749912.png#id=kQkdv&originHeight=903&originWidth=1920&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

> **使用ik_max_word分词器**

```json
GET my_index/_analyze
{
  "analyzer": "ik_max_word",
  "text": "我是中国人"
}
```
![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241748874.png#id=NE3bp&originHeight=903&originWidth=1920&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

> **使用ik_smart分词器**

```json
GET my_index/_analyze
{
  "analyzer": "ik_smart",
  "text": "我是中国人"
}
```

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241748028.png#id=stexm&originHeight=903&originWidth=1920&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

能够看出不同的分词器， 分词有明显的区别， 所以以后**定义一个索引不能再使用默认的 mapping** 了， 要手工建立 mapping, 因为要选择分词器。

---

## 修改Linux网络设置
> 前提：虚拟机没有网络，yum命令不好用，我的都好使就没配置。

### 修改 linux 的 yum 源

备份原 yum 源
```shell
mv /etc/yum.repos.d/CentOS-Base.repo /etc/yum.repos.d/CentOS-Base.repo.backup
```
使用新 yum 源
```shell
curl -o /etc/yum.repos.d/CentOS-Base.repo  http://mirrors.163.com/.help/CentOS7-Base-163.repo
```
生成缓存
```shell
yum makecache
```

### 配置网卡

修改 `ifcfg-eth1` 文件内容
```shell
# 进入ifcfg-eth1目录
cd /etc/sysconfig/network-scripts
# 配置GATEWAY、DNS1、DNS2
GATEWAY=192.168.56.1
DNS1=114.114.114.114
DNS2=8.8.8.8
```
具体如下

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241747633.png#id=y0wXR&originHeight=331&originWidth=947&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

配置完成保存，重启
```shell
service network restart
```
测试
```shell
ping baidu.com
```
