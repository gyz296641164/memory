---
title: ✅P349_k8s入门-Pod-Service等概念
category:
  - 谷粒商城
order: 1
date: 2024-06-04
---

<!-- more -->

## 概念

Kubernetes Service 是 Kubernetes 集群中的一种抽象，它定义了一种访问容器化应用的方式，无论这些应用如何分布和扩展。Service 为一组具有相同功能的 Pod 提供统一的访问接口，使得外部或内部的访问者可以轻松地找到并访问这些 Pod。

Service 主要有两种类型：

1. **ClusterIP**：这是默认的 Service 类型，它将 Service 暴露为集群内部的 IP，只有集群内部的客户端可以访问它。
2. **NodePort**：这种类型的 Service 会在每个 Node 上的特定端口（NodePort）上暴露 Service，这样外部的客户端就可以通过任何 Node 的 IP 地址和 NodePort 来访问 Service。

此外，还有几种其他类型的 Service：

- **LoadBalancer**：自动配置云提供商的负载均衡器，将 Service 暴露给外部网络。
- **ExternalName**：通过返回 CNAME 和其值，可以将 Service 映射到外部服务。
- **Headless**：不提供负载均衡的 Service，而是返回所有 Endpoints 的 IP 地址。

Service 通过选择器（Selector）来识别一组 Pod，这些 Pod 必须具有与 Service 选择器匹配的标签（Labels）。当 Service 接收到请求时，它会将请求转发到后端的 Pod。

Service 还具有以下特性：

- **负载均衡**：自动分配请求到后端的多个 Pod。
- **服务发现**：通过 DNS 名称，Pod 可以发现并访问其他 Service。
- **自动扩展**：可以与 Kubernetes 的自动扩展器（如 Horizontal Pod Autoscaler）配合使用，根据负载自动调整 Pod 数量。

Service 是 Kubernetes 中非常重要的组件，它使得应用的部署和管理变得更加灵活和强大。

Service能够提供负载均衡的能力，但是在使用上有以下限制：

- 默认只提供 4 层负载均衡能力（IP+端口），而没有 7 层功能（主机名和域名），但有时我们可能需要更多的匹配规则来转发请求，这点上 4 层负载均衡是不支持的
- 后续可以通过Ingress方案，添加7层的能力

---

## 案例

```
# 1、部署一个nginx
[root@k8s-node1 ~]# kubectl create deployment nginx --image=nginx
deployment.apps/nginx created

# 2、暴露nginx访问
[root@k8s-node1 ~]# kubectl expose deployment nginx --port=80 --type=NodePort
service/nginx exposed
```

现在我们使用NodePort的方式暴露，这样访问每个节点的端口，都可以访问各个Pod,如果节点宕机，就会出现问题

前面我们通过命令行的方式，部署和暴露了tomcat，实际上也可以通过yaml的方式来完成这些操作

```
#这些操作实际上是为了获取Deployment的yaml模板
[root@k8s-node1 ~]# kubectl create deployment tomcat6 --image=tomcat:6.0.53-jre8 --dry-run -o yaml >tomcat6-deployment.yaml

[root@k8s-node1 ~]# ls tomcat6-deployment.yaml
tomcat6-deployment.yaml
```

修改`tomcat6-deployment.yaml`内容如下：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app: tomcat6
  name: tomcat6
spec:
  replicas: 3
  selector:
    matchLabels:
      app: tomcat6
  template:
    metadata: 
      labels:
        app: tomcat6
    spec:
      containers:
      - image: tomcat:6.0.53-jre8
        name: tomcat
```

```yaml
[root@k8s-node1 ~]# kubectl apply -f tomcat6-deployment.yaml
deployment.apps/tomcat6 configured

[root@k8s-node1 ~]# kubectl get all
NAME                           READY   STATUS    RESTARTS   AGE
pod/nginx-86c57db685-t7hsd     1/1     Running   0          7m22s
pod/tomcat6-5f7ccf4cb9-btxv5   1/1     Running   1          21h
pod/tomcat6-5f7ccf4cb9-htfpw   1/1     Running   1          21h
pod/tomcat6-5f7ccf4cb9-rbg2g   1/1     Running   1          21h

NAME                 TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)        AGE
service/kubernetes   ClusterIP   10.96.0.1      <none>        443/TCP        23h
service/nginx        NodePort    10.96.5.59     <none>        80:30948/TCP   6m25s
service/tomcat6      NodePort    10.96.38.225   <none>        80:32510/TCP   22h

NAME                      READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/nginx     1/1     1            1           7m22s
deployment.apps/tomcat6   3/3     3            3           21h

NAME                                 DESIRED   CURRENT   READY   AGE
replicaset.apps/nginx-86c57db685     1         1         1       7m22s
replicaset.apps/tomcat6-5f7ccf4cb9   3         3         3       21h
```

```yaml
[root@k8s-node1 ~]# kubectl expose deployment tomcat6 --port=80 --target-port=8080 --type=NodePort  --dry-run -o yaml
apiVersion: v1
kind: Service
metadata:
  creationTimestamp: null
  labels:
    app: tomcat6
  name: tomcat6
spec:
  ports:
  - port: 80
    protocol: TCP
    targetPort: 8080
  selector:
    app: tomcat6
  type: NodePort
status:
  loadBalancer: {}
```

### 关联部署和service

将这段输出和`tomcat6-deployment.yaml`用`---`进行拼接，表示部署完毕并进行暴露服务：

```yaml
[root@k8s-node1 ~]# cat tomcat6-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app: tomcat6
  name: tomcat6
spec:
  replicas: 3
  selector:
    matchLabels:
      app: tomcat6
  template:
    metadata:
      labels:
        app: tomcat6
    spec:
      containers:
      - image: tomcat:6.0.53-jre8
        name: tomcat
---
apiVersion: v1
kind: Service
metadata:
  creationTimestamp: null
  labels:
    app: tomcat6
  name: tomcat6
spec:
  ports:
  - port: 80
    protocol: TCP
    targetPort: 8080
  selector:
    app: tomcat6
  type: NodePort
status:
  loadBalancer: {}
```

上面类型一个是Deployment，一个是Service；

部署并暴露服务：

```
[root@k8s-node1 ~]# kubectl apply -f tomcat6-deployment.yaml
deployment.apps/tomcat6 unchanged
```

查看服务和部署信息：

```
[root@k8s-node1 ~]# kubectl get all
NAME                           READY   STATUS    RESTARTS   AGE
pod/nginx-86c57db685-t7hsd     1/1     Running   0          9m32s
pod/tomcat6-5f7ccf4cb9-btxv5   1/1     Running   1          21h
pod/tomcat6-5f7ccf4cb9-htfpw   1/1     Running   1          21h
pod/tomcat6-5f7ccf4cb9-rbg2g   1/1     Running   1          21h

NAME                 TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)        AGE
service/kubernetes   ClusterIP   10.96.0.1      <none>        443/TCP        23h
service/nginx        NodePort    10.96.5.59     <none>        80:30948/TCP   8m35s
service/tomcat6      NodePort    10.96.38.225   <none>        80:32510/TCP   22h

NAME                      READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/nginx     1/1     1            1           9m32s
deployment.apps/tomcat6   3/3     3            3           21h

NAME                                 DESIRED   CURRENT   READY   AGE
replicaset.apps/nginx-86c57db685     1         1         1       9m32s
replicaset.apps/tomcat6-5f7ccf4cb9   3         3         3       21h
```

访问node1，node1和node3的32510端口：

```shell
[root@k8s-node1 ~]# curl -I http://192.168.56.{100,101,102}:32510/
HTTP/1.1 200 OK
Server: Apache-Coyote/1.1
Accept-Ranges: bytes
ETag: W/"7454-1491118183000"
Last-Modified: Sun, 02 Apr 2017 07:29:43 GMT
Content-Type: text/html
Content-Length: 7454
Date: Mon, 03 Jun 2024 15:56:43 GMT

HTTP/1.1 200 OK
Server: Apache-Coyote/1.1
Accept-Ranges: bytes
ETag: W/"7454-1491118183000"
Last-Modified: Sun, 02 Apr 2017 07:29:43 GMT
Content-Type: text/html
Content-Length: 7454
Date: Mon, 03 Jun 2024 15:56:44 GMT

HTTP/1.1 200 OK
Server: Apache-Coyote/1.1
Accept-Ranges: bytes
ETag: W/"7454-1491118183000"
Last-Modified: Sun, 02 Apr 2017 07:29:43 GMT
Content-Type: text/html
Content-Length: 7454
Date: Mon, 03 Jun 2024 15:56:44 GMT
[root@k8s-node1 ~]#
```

现在的问题是service的3个pod都可以访问，但怎么创建个总的管理者，以便负载均衡
