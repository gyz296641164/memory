---
title: ✅P350_k8s-入门-Ingress
category:
  - 谷粒商城
order: 1
date: 2024-06-14
---

<!-- more -->

## Ingress

官方文档：[Ingress](https://kubernetes.io/zh-cn/docs/concepts/services-networking/ingress/)

通过Ingress发现pod进行关联。基于域名访问；

通过Ingress controller实现POD负载均衡；

支持TCP/UDP 4层负载均衡和HTTP 7层负载均衡；

- Ingress管理多个service
- service管理多个pod

---

## 案例

### 部署Ingress controller

执行k8s文件夹下的`ingress-controller.yaml`文件，内容如下：

```shell
[root@k8s-node1 k8s]# kubectl apply -f ingress-controller.yaml
namespace/ingress-nginx created
configmap/nginx-configuration created
configmap/tcp-services created
configmap/udp-services created
serviceaccount/nginx-ingress-serviceaccount created
clusterrole.rbac.authorization.k8s.io/nginx-ingress-clusterrole created
role.rbac.authorization.k8s.io/nginx-ingress-role created
rolebinding.rbac.authorization.k8s.io/nginx-ingress-role-nisa-binding created
clusterrolebinding.rbac.authorization.k8s.io/nginx-ingress-clusterrole-nisa-binding created
daemonset.apps/nginx-ingress-controller created
service/ingress-nginx created
[root@k8s-node1 k8s]# 
```

查看pods

```shell
[root@k8s-node1 k8s]# kubectl get pods --all-namespaces
NAMESPACE       NAME                                READY   STATUS              RESTARTS   AGE
default         nginx-86c57db685-t7hsd              1/1     Running             0          26m
default         tomcat6-5f7ccf4cb9-btxv5            1/1     Running             1          22h
default         tomcat6-5f7ccf4cb9-htfpw            1/1     Running             1          22h
default         tomcat6-5f7ccf4cb9-rbg2g            1/1     Running             1          22h
ingress-nginx   nginx-ingress-controller-4wqjj      0/1     ContainerCreating   0          21s
ingress-nginx   nginx-ingress-controller-fz45v      0/1     ContainerCreating   0          21s
kube-system     coredns-7f9c544f75-prjtp            1/1     Running             2          23h
kube-system     coredns-7f9c544f75-sbchb            1/1     Running             1          22h
kube-system     etcd-k8s-node1                      1/1     Running             8          23h
kube-system     kube-apiserver-k8s-node1            1/1     Running             8          23h
kube-system     kube-controller-manager-k8s-node1   1/1     Running             9          23h
kube-system     kube-flannel-ds-49tjl               1/1     Running             3          23h
kube-system     kube-flannel-ds-98mgg               1/1     Running             2          23h
kube-system     kube-flannel-ds-amd64-2khx8         1/1     Running             5          23h
kube-system     kube-flannel-ds-amd64-5jtfr         1/1     Running             3          23h
kube-system     kube-flannel-ds-amd64-k426h         1/1     Running             3          23h
kube-system     kube-flannel-ds-fvss2               1/1     Running             3          23h
kube-system     kube-proxy-bsgqt                    1/1     Running             5          23h
kube-system     kube-proxy-fwdgg                    1/1     Running             3          23h
kube-system     kube-proxy-tbdxl                    1/1     Running             2          23h
kube-system     kube-scheduler-k8s-node1            1/1     Running             9          23h
```

这里master节点负责调度，具体执行交给node2和node3来完成，能够看到它们正在下载镜像：

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202405/7fcf12b2e2bc9d34.png)

### 创建Ingress规则

`ingress-tomcat6.yaml`

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
	name: web
spec:
	rules:
	- host:tomcat6.atguigu.com
	  http:
	  	paths:
	  		-backend:
	  			serviceName: tomcat6
	  			servicePort: 80
```

```
[root@k8s-node1 k8s]# touch ingress-tomcat6.yaml

#将上面的规则，添加到ingress-tomcat6.yaml文件中
[root@k8s-node1 k8s]# vi ingress-tomcat6.yaml

[root@k8s-node1 k8s]# kubectl apply -f ingress-tomcat6.yaml
ingress.extensions/web created
```

修改本机的hosts文件(`vi /etc/hosts`)，添加如下的域名转换规则：

```
192.168.56.102 tomcat6.atguigu.com
```

测试: http://tomcat6.atguigu.com/

并且集群中即便有一个节点不可用，也不影响整体的运行。