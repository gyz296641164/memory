---
title: ✅P345_k8s-集群搭建-安装 Docker、kubeadm、kubelet、kubectl
category:
  - 谷粒商城
order: 1
date: 2024-05-11
---

<!-- more -->

Kubernetes 默认 CRI（容器运行时）为 Docker，因此先安装 Docker。

## 1、安装 docker

1、卸载系统之前的 docker

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

2、安装 Docker-CE

```
安装必须的依赖
sudo yum install -y yum-utils \
	device-mapper-persistent-data \
	lvm2
```

```
设置 docker repo 的 yum 位置
sudo yum-config-manager \ 
	--add-repo \
	https://download.docker.com/linux/centos/docker-ce.repo
```

```
安装 docker，以及 docker-cli
sudo yum install -y docker-ce docker-ce-cli containerd.io
```

3、配置 docker 加速

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

4、启动 docker & 设置 docker 开机自启

```
systemctl enable docker
```

基础环境准备好，可以给三个虚拟机备份一下；为 node3 分配 16g，剩下的 3g。方便未来侧测试

## 2、添加阿里云 yum 源

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

## 3、安装 kubeadm，kubelet 和 kubectl

```
yum list|grep kube
yum install -y kubelet-1.17.3 kubeadm-1.17.3 kubectl-1.17.3
systemctl enable kubelet
systemctl start kubelet
```

