---
title: ✅P344_k8s-集群搭建-NAT网络和前置环境
category:
  - 谷粒商城
order: 1
date: 2024-05-11
---

<!-- more -->

## 设置NAT 网络

利用 `ip addr`命令查看默认网卡，三个node的ip地址都是相同的

需要重新生成MAC地址，配置不同的网卡IP。前提是节点关机才能操作

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202405/b067c995c6cecde5.png)

重启三个节点后查看默认网卡eth0如下

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202405/e573b4f5d6b40294.png)

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202405/17782e30509acfbf.png)

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202405/e0b9ef4df4d948c8.png)

利用 `ping www.baidu.com`命令测试外网连通性；

---

## 设置 linux 环境(三个节点都执行)

关闭防火墙：

- `systemctl stop firewalld`
- `systemctl disable firewalld`

关闭 selinux：

- `sed -i 's/enforcing/disabled/' /etc/selinux/config`
- `setenforce 0`

关闭 swap：

- `swapoff -a`：临时
- `sed -ri 's/.*swap.*/#&/' /etc/fstab`： 永久
- `free -g` 验证，swap 必须为 0；

添加主机名与 IP 对应关系：

`vi /etc/hosts`

```
10.0.2.15 k8s-node1
10.0.2.4 k8s-node2
10.0.2.5 k8s-node3
```

> `hostnamectl set-hostname <newhostname>`：指定新的 hostname
>
> su 切换过来
>
> (编辑上方文件就不用执行此命令了)

将桥接的 IPv4 流量传递到 iptables 的链：

```
cat > /etc/sysctl.d/k8s.conf << EOF
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
EOF
```

`sysctl --system`

疑难问题：

- 遇见提示是只读的文件系统，运行如下命令

  `mount -o remount rw /`

- date 查看时间 （可选）

  `yum install -y ntpdate`	

  `ntpdate time.windows.com` 同步最新时间

---

## 生成备份

防止配置好的环境在后续操作中损坏，生成备份，在需要时进行**备份恢复**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202405/f328bf62e6dd0ee2.png)