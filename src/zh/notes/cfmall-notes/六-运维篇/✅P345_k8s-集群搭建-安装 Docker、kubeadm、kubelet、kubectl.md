---
title: ✅P345_k8s-集群搭建-安装 Docker、kubeadm、kubelet、kubectl
category:
  - 谷粒商城
order: 1
date: 2024-05-11
---

<!-- more -->

## 开篇

Kubernetes 默认 CRI（容器运行时）为 Docker，因此先安装 Docker。Docker19.03版本适配，否则版本过高和K8S不兼容！

注意：三台Node节点都需要执行以下命令！！！

---

## 安装 docker

### 卸载系统之前的 docker

```
sudo yum remove docker \
                  docker-client \
                  docker-client-latest \
                  docker-common \
                  docker-latest \
                  docker-latest-logrotate \
                  docker-logrotate \
                  docker-engine
```

在卸载后，通过`docker info`看下版本信息，查看是否真正卸载掉了！这个时候，我们需要再看下还有没有未删除的文件：

```
sudo yum list installed  | grep docker
```

并执行命令删除：

```
sudo yum -y remove containerd.io.x86_64
```

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202405/5afd3829fc4ce2de.png)

> [CentOS Docker卸载不掉](https://blog.51cto.com/u_16213458/8929102)

### 安装 Docker-CE

安装必须的依赖

```
sudo yum install -y yum-utils \
	device-mapper-persistent-data \
	lvm2
```

设置 docker repo 的 yum 位置。

```
yum-config-manager \
    --add-repo \
    http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo    
```

安装 docker，以及 docker-cli

> 注意：要指定Docker安装版本，否则在后续**部署 k8s-master**时，会发生Docker版本与k8s版本不兼容问题！

```
# sudo yum install -y docker-ce docker-ce-cli containerd.io
sudo yum install -y docker-ce-19.03.13 docker-ce-cli-19.03.13 containerd.io
```

### 配置 docker 加速

全部复制，回车执行即可

```
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF' 
{
 "registry-mirrors": [
  "https://docker.1panel.live",
  "https://dc.j8.work",
  "https://docker.m.daocloud.io",
  "https://dockerproxy.com",
  "https://docker.mirrors.ustc.edu.cn",
  "https://docker.nju.edu.cn"
 ]
}
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker
```

### 启动 docker & 设置 docker 开机自启

```
systemctl enable docker
```

基础环境准备好，可以给三个虚拟机备份一下；为 node3 分配 16g，剩下的 3g。方便未来侧测试

---

## 添加阿里云 yum 源

k8s-node1、k8s-node2、k8s-node3三个节点都执行

```
$ cat > /etc/yum.repos.d/kubernetes.repo << EOF
[kubernetes]
name=Kubernetes
baseurl=https://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64
enabled=1
gpgcheck=0
repo_gpgcheck=0
gpgkey=https://mirrors.aliyun.com/kubernetes/yum/doc/yum-key.gpg
https://mirrors.aliyun.com/kubernetes/yum/doc/rpm-package-key.gpg
EOF
```

---

## 安装 kubeadm，kubelet 和 kubectl

所有节点都需执行

```
yum list|grep kube
yum install -y kubelet-1.17.3 kubeadm-1.17.3 kubectl-1.17.3
systemctl enable kubelet
systemctl start kubelet
```

查看kubelet状态并未启动成功，处于重启中，这是因为其它配置未完成，正常现象！

```
systemctl status kubelet.service
```

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202405/86deeeff10885159.png)

---

## 问题解决

### Cannot find a valid baseurl for repo: base/7/x86_64

https://blog.csdn.net/weixin_52597907/article/details/141113817

可以通过 vi 命令编辑 `/etc/yum.repos.d/CentOS-Base.repo` 文件，将其中的 `mirrorlist` 行用 # 号注释掉，并将 `baseurl` 行取消注释，并修改为其他可靠的镜像地址。

如将下图四个 baseurl 地址按顺序修改为阿里云的镜像地址：

![image-20241205001955949](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202412/image-20241205001955949.png)

```
baseurl=http://mirrors.aliyun.com/centos/$releasever/os/$basearch/
```

```
baseurl=http://mirrors.aliyun.com/centos/$releasever/updates/$basearch/
```

```
baseurl=http://mirrors.aliyun.com/centos/$releasever/extras/$basearch/
```

```
baseurl=http://mirrors.aliyun.com/centos/$releasever/centosplus/$basearch/
```

