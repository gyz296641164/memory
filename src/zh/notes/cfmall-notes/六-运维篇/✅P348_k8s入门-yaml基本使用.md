## yaml输出

官方文档：https://kubernetes.io/zh/docs/reference/kubectl/overview/#资源类型

在此示例中，以下命令将单个 pod 的详细信息输出为 YAML 格式的对象：

```
kubectl get pod web-pod-13je7 -o yaml
```

请记住：有关每个命令支持哪种输出格式的详细信息，请参阅 [kubectl](https://kubernetes.io/docs/user-guide/kubectl/) 参考文档。

**–dry-run：**

> –dry-run=‘none’: Must be “none”, “server”, or “client”. If client strategy, only print the object that would be
>
> sent, without sending it. If server strategy, submit server-side request without persisting the resource.
>
> 值必须为`，`或`。`
>
> - none
> - server：提交服务器端请求而不持久化资源。
> - client：只打印该发送对象，但不发送它。
>
> 也就是说，通过–dry-run选项，并不会真正的执行这条命令。

```
# 输出yaml
[root@k8s-node1 ~]# kubectl create deployment tomcat6 --image=tomcat:6.0.53-jre8 --dry-run -o yaml

W0504 03:39:08.389369    8107 helpers.go:535] --dry-run is deprecated and can be replaced with --dry-run=client.
apiVersion: apps/v1
kind: Deployment
metadata:
  creationTimestamp: null
  labels:
    app: tomcat6
  name: tomcat6
spec:
  replicas: 1
  selector:
    matchLabels:
      app: tomcat6
  strategy: {}
  template:
    metadata:
      creationTimestamp: null
      labels:
        app: tomcat6
    spec:
      containers:
      - image: tomcat:6.0.53-jre8
        name: tomcat
        resources: {}
status: {}
```

实际上我们也可以将这个yaml输出到文件，然后使用`kubectl apply -f`来应用它

输出到tomcat6.yaml 

```
[root@k8s-node1 ~]# kubectl create deployment tomcat6 --image=tomcat:6.0.53-jre8 --dry-run -o yaml >tomcat6.yaml
W0504 03:46:18.180366   11151 helpers.go:535] --dry-run is deprecated and can be replaced with --dry-run=client.
```

tomcat6.yaml 内容，修改一下副本个数为3

```
apiVersion: apps/v1
kind: Deployment
metadata:
  creationTimestamp: null
  labels:
    app: tomcat6
  name: tomcat6
spec:
  replicas: 3 # 修改
  selector:
    matchLabels:
      app: tomcat6
  strategy: {}
  template:
    metadata:
      creationTimestamp: null
      labels:
        app: tomcat6
    spec:
      containers:
      - image: tomcat:6.0.53-jre8
        name: tomcat
        resources: {}
status: {}
```

```
#应用tomcat6.yaml 
[root@k8s-node1 k8s]# kubectl apply -f tomcat6.yaml
deployment.apps/tomcat6 created
[root@k8s-node1 k8s]# kubectl get pods
NAME                       READY   STATUS    RESTARTS   AGE
tomcat6-5f7ccf4cb9-hxqfl   1/1     Running   0          7s
tomcat6-5f7ccf4cb9-ksm4n   1/1     Running   0          7s
tomcat6-5f7ccf4cb9-qlzd4   1/1     Running   0          7s
```

查看某个pod的具体信息：

```
[root@k8s-node1 ~]# kubectl get pods tomcat6-7b84fb5fdc-5jh6t  -o yaml
```

