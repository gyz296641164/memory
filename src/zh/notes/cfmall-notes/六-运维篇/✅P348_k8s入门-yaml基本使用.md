---
title: ✅P348_k8s入门-yaml基本使用
category:
  - 谷粒商城
order: 1
date: 2024-05-11
---

<!-- more -->

## yaml输出

### 开篇

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

### 输出yaml示例

```
[root@k8s-node1 ~]# kubectl create deployment tomcat6 --image=tomcat:6.0.53-jre8 --dry-run -o yaml
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
```

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202405/40a3b3624f843cb3.png)

tomcat6.yaml 内容，修改一下副本个数为3

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202405/2d280cd8309b4d60.png)

应用`tomcat6.yaml`

```
[root@k8s-node1 ~]# kubectl apply -f tomcat6.yaml
deployment.apps/tomcat6 created
[root@k8s-node1 ~]# kubectl get pods
NAME                       READY   STATUS    RESTARTS   AGE
tomcat6-5f7ccf4cb9-btxv5   1/1     Running   0          5s
tomcat6-5f7ccf4cb9-htfpw   1/1     Running   0          5s
tomcat6-5f7ccf4cb9-rbg2g   1/1     Running   0          5s
```

查看某个pod的具体信息：

```yaml
[root@k8s-node1 ~]# kubectl get pods tomcat6-5f7ccf4cb9-btxv5 -o yaml
apiVersion: v1
kind: Pod
metadata:
  creationTimestamp: "2024-06-02T18:01:59Z"
  generateName: tomcat6-5f7ccf4cb9-
  labels:
    app: tomcat6
    pod-template-hash: 5f7ccf4cb9
  name: tomcat6-5f7ccf4cb9-btxv5
  namespace: default
  ownerReferences:
  - apiVersion: apps/v1
    blockOwnerDeletion: true
    controller: true
    kind: ReplicaSet
    name: tomcat6-5f7ccf4cb9
    uid: 9c47a4ac-18a5-4bad-8429-cde5abdd9bff
  resourceVersion: "12725"
  selfLink: /api/v1/namespaces/default/pods/tomcat6-5f7ccf4cb9-btxv5
  uid: 18b05d17-23f4-4f1d-8b6e-0e83f8c5231a
spec:
  containers:
  - image: tomcat:6.0.53-jre8
    imagePullPolicy: IfNotPresent
    name: tomcat
    resources: {}
    terminationMessagePath: /dev/termination-log
    terminationMessagePolicy: File
    volumeMounts:
    - mountPath: /var/run/secrets/kubernetes.io/serviceaccount
      name: default-token-q46dx
      readOnly: true
  dnsPolicy: ClusterFirst
  enableServiceLinks: true
  nodeName: k8s-node2
  priority: 0
  restartPolicy: Always
  schedulerName: default-scheduler
  securityContext: {}
  serviceAccount: default
  serviceAccountName: default
  terminationGracePeriodSeconds: 30
  tolerations:
  - effect: NoExecute
    key: node.kubernetes.io/not-ready
    operator: Exists
    tolerationSeconds: 300
  - effect: NoExecute
    key: node.kubernetes.io/unreachable
    operator: Exists
    tolerationSeconds: 300
  volumes:
  - name: default-token-q46dx
    secret:
      defaultMode: 420
      secretName: default-token-q46dx
status:
  conditions:
  - lastProbeTime: null
    lastTransitionTime: "2024-06-02T18:01:59Z"
    status: "True"
    type: Initialized
  - lastProbeTime: null
    lastTransitionTime: "2024-06-02T18:02:02Z"
    status: "True"
    type: Ready
  - lastProbeTime: null
    lastTransitionTime: "2024-06-02T18:02:02Z"
    status: "True"
    type: ContainersReady
  - lastProbeTime: null
    lastTransitionTime: "2024-06-02T18:01:59Z"
    status: "True"
    type: PodScheduled
  containerStatuses:
  - containerID: docker://9347710eae27dd5848ea269ab7802f35a450c405e5c6dc52960895f779c06c94
    image: tomcat:6.0.53-jre8
    imageID: docker-pullable://tomcat@sha256:8c643303012290f89c6f6852fa133b7c36ea6fbb8eb8b8c9588a432beb24dc5d
    lastState: {}
    name: tomcat
    ready: true
    restartCount: 0
    started: true
    state:
      running:
        startedAt: "2024-06-02T18:02:01Z"
  hostIP: 10.0.2.4
  phase: Running
  podIP: 10.244.1.8
  podIPs:
  - ip: 10.244.1.8
  qosClass: BestEffort
  startTime: "2024-06-02T18:01:59Z"
```

