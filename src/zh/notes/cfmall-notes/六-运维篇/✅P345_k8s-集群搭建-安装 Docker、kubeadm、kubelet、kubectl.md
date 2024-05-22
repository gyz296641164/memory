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

> [CentOS Docker卸载不掉]([centos docker卸载不掉_mob64ca12f6aae1的技术博客_51CTO博客](https://blog.51cto.com/u_16213458/8929102))

### 安装 Docker-CE

安装必须的依赖

```
sudo yum install -y yum-utils \
	device-mapper-persistent-data \
	lvm2
```

设置 docker repo 的 yum 位置。（不要换行，直接按如下一行命令执行即可，否则yum源添加不成功）

```
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
```

安装 docker，以及 docker-cli

> 注意：要指定Docker安装版本，否则在后续**部署 k8s-master**时，会发生Docker版本与k8s版本不兼容问题！

```
#注释掉sudo yum install -y docker-ce docker-ce-cli containerd.io
sudo yum install -y docker-ce-19.03.13 docker-ce-cli-19.03.13 containerd.io
```

### 配置 docker 加速

全部复制，回车执行即可

```
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF' 
{ 
	"registry-mirrors": ["https://docker.mirrors.ustc.edu.cn"]
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

```
yum list|grep kube
yum install -y kubelet-1.17.3 kubeadm-1.17.3 kubectl-1.17.3
systemctl enable kubelet
systemctl start kubelet
```

查看kubelet状态并未启动成功，处于重启中，这是因为其它配置未完成，正常现象！

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202405/86deeeff10885159.png)
