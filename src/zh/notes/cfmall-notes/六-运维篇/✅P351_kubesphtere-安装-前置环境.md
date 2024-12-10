## 安装 helm（master 节点执行）

Helm 是 Kubernetes 的包管理器。包管理器类似于我们在 Ubuntu 中使用的 apt、Centos中使用的 yum 或者 Python 中的 pip 一样，能快速查找、下载和安装软件包。Helm 由**客户端组件 helm** 和**服务端组件 Tiller** 组成，能够将一组 K8S 资源打包统一管理, 是查找、共享和使用为 Kubernetes 构建的软件的最佳方式。

### 安装方式1

```
curl -L https://git.io/get_helm.sh | bash
```

墙原因，上传我们给定的 `get_helm.sh`，`chmod 700` 然后`./get_helm.sh`

可能有文件格式兼容性问题，用 vi 打开该 sh 文件，输入：`:set ff`

回车，显示 `fileformat=dos`，重新设置下文件格式：

```
:set ff=unix
```

保存退出：

```
:wq
```

但是这样执行同样失败了

![image-20241209232631941](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202412/image-20241209232631941.png)

### 安装方式2

安装方式1的解决办法：手动下载Helm的安装包

```
# 可以去这里下载压缩包 https://github.com/helm/helm/releases/tag/v2.16.3
# helm--linux-amd64.tar.gz
ll helm-v2.17.0-linux-amd64.tar.gz 

# 解压
tar xf helm-v2.17.0-linux-amd64.tar.gz 
# 拷贝执行程序到指定目录
cp linux-amd64/helm /usr/local/bin
cp linux-amd64/tiller /usr/local/bin

# 查看helm版本
helm version

# 输出如下:

# Client: &version.Version{SemVer:"v2.17.0"}
# Error: could not find tiller
```

我起始下载了[客户端v2.17.0版本](https://github.com/helm/helm/releases?page=8) ，导致报错如下：

这个错误表明 `kubectl` 客户端版本（v2.17.0）与 Kubernetes 服务器版本（v2.16.3）不兼容。

![image-20241209235322288](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202412/image-20241209235322288.png)

解决方案：

1. 升级服务器版本
2. 或降级客户端版本：下载[客户端v2.16.3版本](https://github.com/helm/helm/releases?page=11)

![image-20241209235452798](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202412/image-20241209235452798.png)

### 创建权限（master 执行）

创建 `helm-rbac.yaml`，写入如下内容

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: tiller
  namespace: kube-system
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: tiller
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
  - kind: ServiceAccount
    name: tiller
    namespace: kube-system
```

应用配置

```
kubectl apply -f helm-rbac.yaml
```

### 安装 Tiller（master 执行）

1、初始化

```
helm init --service-account=tiller --tiller-image=jessestuart/tiller:v2.16.3 --history-max 300
```

--tiller-image 指定镜像 jessestuart/tiller:v2.16.3，否则会被墙。大家使用这个镜像比较好

等待节点上部署的 tiller 完成即可

2、测试

```
helm install stable/nginx-ingress --name nginx-ingress
helm ls
helm delete nginx-ingress
```

3、使用语法

\#创建一个 chart 范例

```
helm create helm-chart
```

\#检查 chart 语法

```
helm lint ./helm-chart
```

\#使用默认 chart 部署到 k8s

```
helm install --name example1 ./helm-chart --set service.type=NodePort
```

\#kubectl get pod 查看是否部署成功

### 安装 OpenEBS（master 执行）

\# 去掉污点，污点会影响OpenEBS安装

```
kubectl describe node k8s-node1 | grep Taint
```

\# 如果上面有输出就取消taint，比如输出了 Taints:    node-role.kubernetes.io/master:NoSchedule

```
kubectl taint nodes k8s-node1 node-role.kubernetes.io/master:NoSchedule-
```

```
kubectl describe node k8s-node1 | grep Taint

# 输出为none
```

安装 openebs，openebs-operator-1.7.0.yaml内容见最后

```
kubectl apply -f openebs-operator-1.7.0.yaml
```

查看storageclass，显示false和Delete正常

```
kubectl get sc
```

将 openebs-hostpath 设置为 默认的 StorageClass：

```
kubectl patch storageclass openebs-hostpath -p '{"metadata": {"annotations":{"storageclass.kubernetes.io/is-default-class":"true"}}}'
```

验证 

```
kubectl get pod -n openebs kubectl get sc
```

注意：此时不要给master加上污点，否者导致后面的pods安装不上(openldap,redis)，待kubesphere安装完成后加上污点

至此，OpenEBS 的 LocalPV 已作为默认的存储类型创建成功。

---

## 最小化安装 kubesphere

[官网](https://kubesphere.io/zh/docs/v3.4/installing-on-kubernetes/introduction/overview/)

[ks-installer-v2.1.1安装教程](https://github.com/kubesphere/ks-installer/tree/v2.1.1?tab=readme-ov-file)

若您的集群可用的资源符合 CPU > 1 Core，可用内存 > 2 G，可以参考以下命令开启

KubeSphere 最小化安装：

```
kubectl apply -f kubesphere-minimal.yaml
```

查看pod状态

```
kubectl get pods --all-namespaces
```

![image-20241210232117882](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202412/image-20241210232117882.png)

检查详细错误信息

```
kubectl describe pod ks-installer-75b8d89dff-hgs7k -n kubesphere-system
```

发现镜像拉取失败

解决方法：手动拉取镜像

```
docker pull <image>
```

删除处于 `ImagePullBackOff` 状态的 Pod

```
kubectl delete pod ks-installer-75b8d89dff-hgs7k -n kubesphere-system
```

监控ks安装进度、是否正常

```
kubectl logs -n kubesphere-system $(kubectl get pod -n kubesphere-system -l app=ks-install -o jsonpath='{.items[0].metadata.name}') -f
```

正确输出内容如下：

```
Start installing monitoring
**************************************************
task monitoring status is successful
total: 1     completed:1
**************************************************
#####################################################
###              Welcome to KubeSphere!           ###
#####################################################

Console: http://10.0.2.15:30880
Account: admin
Password: P@88w0rd

NOTES：
  1. After logging into the console, please check the
     monitoring status of service components in
     the "Cluster Status". If the service is not
     ready, please wait patiently. You can start
     to use when all components are ready.
  2. Please modify the default password after login.

#####################################################
```

使用 `kubectl get pod --all-namespaces`，查看pods状态，如果全部为Running，那么可以登录 kubesphere控制台，

- Console: http://192.168.56.100:30880
- Account: admin
- Password: P@88w0rd

![image-20241211002004987](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202412/image-20241211002004987.png)

---

## 卸载KubeSphere

如果安装过程中存在问题，那么需要卸载KubeSphere[我采用的脚本卸载]，重新安装，卸载方式有以下两种。别的方式删不干净，会使得ks安装不成功，以及后续使用service有差异

### 脚本卸载

官方文档：[从 Kubernetes 上卸载 KubeSphere](https://www.kubesphere.io/zh/docs/v3.3/installing-on-kubernetes/uninstall-kubesphere-from-k8s/)

卸载脚本：[kubesphere-delete.sh](https://github.com/kubesphere/ks-installer/blob/release-3.1/scripts/kubesphere-delete.sh)

```sh
#!/usr/bin/env bash

function delete_sure(){
  cat << eof
$(echo -e "\033[1;36mNote:\033[0m")

Delete the KubeSphere cluster, including the module kubesphere-system kubesphere-devops-system kubesphere-monitoring-system kubesphere-logging-system openpitrix-system.
eof

read -p "Please reconfirm that you want to delete the KubeSphere cluster.  (yes/no) " ans
while [[ "x"$ans != "xyes" && "x"$ans != "xno" ]]; do
    read -p "Please reconfirm that you want to delete the KubeSphere cluster.  (yes/no) " ans
done

if [[ "x"$ans == "xno" ]]; then
    exit
fi
}


delete_sure

# delete ks-install
kubectl delete deploy ks-installer -n kubesphere-system 2>/dev/null

# delete helm
for namespaces in kubesphere-system kubesphere-devops-system kubesphere-monitoring-system kubesphere-logging-system openpitrix-system kubesphere-monitoring-federated
do
  helm list -n $namespaces | grep -v NAME | awk '{print $1}' | sort -u | xargs -r -L1 helm uninstall -n $namespaces 2>/dev/null
done

# delete kubefed
kubectl get cc -n kubesphere-system ks-installer -o jsonpath="{.status.multicluster}" | grep enable
if [[ $? -eq 0 ]]; then
  helm uninstall -n kube-federation-system kubefed 2>/dev/null
  #kubectl delete ns kube-federation-system 2>/dev/null
fi


helm uninstall -n kube-system snapshot-controller 2>/dev/null

# delete kubesphere deployment
kubectl delete deployment -n kubesphere-system `kubectl get deployment -n kubesphere-system -o jsonpath="{.items[*].metadata.name}"` 2>/dev/null

# delete monitor statefulset
kubectl delete prometheus -n kubesphere-monitoring-system k8s 2>/dev/null
kubectl delete statefulset -n kubesphere-monitoring-system `kubectl get statefulset -n kubesphere-monitoring-system -o jsonpath="{.items[*].metadata.name}"` 2>/dev/null
# delete grafana
kubectl delete deployment -n kubesphere-monitoring-system grafana 2>/dev/null
kubectl --no-headers=true get pvc -n kubesphere-monitoring-system -o custom-columns=:metadata.namespace,:metadata.name | grep -E kubesphere-monitoring-system | xargs -n2 kubectl delete pvc -n 2>/dev/null

# delete pvc
pvcs="kubesphere-system|openpitrix-system|kubesphere-devops-system|kubesphere-logging-system"
kubectl --no-headers=true get pvc --all-namespaces -o custom-columns=:metadata.namespace,:metadata.name | grep -E $pvcs | xargs -n2 kubectl delete pvc -n 2>/dev/null


# delete rolebindings
delete_role_bindings() {
  for rolebinding in `kubectl -n $1 get rolebindings -l iam.kubesphere.io/user-ref -o jsonpath="{.items[*].metadata.name}"`
  do
    kubectl -n $1 delete rolebinding $rolebinding 2>/dev/null
  done
}

# delete roles
delete_roles() {
  kubectl -n $1 delete role admin 2>/dev/null
  kubectl -n $1 delete role operator 2>/dev/null
  kubectl -n $1 delete role viewer 2>/dev/null
  for role in `kubectl -n $1 get roles -l iam.kubesphere.io/role-template -o jsonpath="{.items[*].metadata.name}"`
  do
    kubectl -n $1 delete role $role 2>/dev/null
  done
}

# remove useless labels and finalizers
for ns in `kubectl get ns -o jsonpath="{.items[*].metadata.name}"`
do
  kubectl label ns $ns kubesphere.io/workspace-
  kubectl label ns $ns kubesphere.io/namespace-
  kubectl patch ns $ns -p '{"metadata":{"finalizers":null,"ownerReferences":null}}'
  delete_role_bindings $ns
  delete_roles $ns
done

# delete clusters
for cluster in `kubectl get clusters -o jsonpath="{.items[*].metadata.name}"`
do
  kubectl patch cluster $cluster -p '{"metadata":{"finalizers":null}}' --type=merge
done
kubectl delete clusters --all 2>/dev/null

# delete workspaces
for ws in `kubectl get workspaces -o jsonpath="{.items[*].metadata.name}"`
do
  kubectl patch workspace $ws -p '{"metadata":{"finalizers":null}}' --type=merge
done
kubectl delete workspaces --all 2>/dev/null

# delete devopsprojects
for devopsproject in `kubectl get devopsprojects -o jsonpath="{.items[*].metadata.name}"`
do
  kubectl patch devopsprojects $devopsproject -p '{"metadata":{"finalizers":null}}' --type=merge
done

for pip in `kubectl get pipeline -A -o jsonpath="{.items[*].metadata.name}"`
do
  kubectl patch pipeline $pip -n `kubectl get pipeline -A | grep $pip | awk '{print $1}'` -p '{"metadata":{"finalizers":null}}' --type=merge
done

for s2ibinaries in `kubectl get s2ibinaries -A -o jsonpath="{.items[*].metadata.name}"`
do
  kubectl patch s2ibinaries $s2ibinaries -n `kubectl get s2ibinaries -A | grep $s2ibinaries | awk '{print $1}'` -p '{"metadata":{"finalizers":null}}' --type=merge
done

for s2ibuilders in `kubectl get s2ibuilders -A -o jsonpath="{.items[*].metadata.name}"`
do
  kubectl patch s2ibuilders $s2ibuilders -n `kubectl get s2ibuilders -A | grep $s2ibuilders | awk '{print $1}'` -p '{"metadata":{"finalizers":null}}' --type=merge
done

for s2ibuildertemplates in `kubectl get s2ibuildertemplates -A -o jsonpath="{.items[*].metadata.name}"`
do
  kubectl patch s2ibuildertemplates $s2ibuildertemplates -n `kubectl get s2ibuildertemplates -A | grep $s2ibuildertemplates | awk '{print $1}'` -p '{"metadata":{"finalizers":null}}' --type=merge
done

for s2iruns in `kubectl get s2iruns -A -o jsonpath="{.items[*].metadata.name}"`
do
  kubectl patch s2iruns $s2iruns -n `kubectl get s2iruns -A | grep $s2iruns | awk '{print $1}'` -p '{"metadata":{"finalizers":null}}' --type=merge
done

kubectl delete devopsprojects --all 2>/dev/null


# delete validatingwebhookconfigurations
for webhook in ks-events-admission-validate users.iam.kubesphere.io network.kubesphere.io validating-webhook-configuration
do
  kubectl delete validatingwebhookconfigurations.admissionregistration.k8s.io $webhook 2>/dev/null
done

# delete mutatingwebhookconfigurations
for webhook in ks-events-admission-mutate logsidecar-injector-admission-mutate mutating-webhook-configuration
do
  kubectl delete mutatingwebhookconfigurations.admissionregistration.k8s.io $webhook 2>/dev/null
done

# delete users
for user in `kubectl get users -o jsonpath="{.items[*].metadata.name}"`
do
  kubectl patch user $user -p '{"metadata":{"finalizers":null}}' --type=merge
done
kubectl delete users --all 2>/dev/null


# delete helm resources
for resource_type in `echo helmcategories helmapplications helmapplicationversions helmrepos helmreleases`; do
  for resource_name in `kubectl get ${resource_type}.application.kubesphere.io -o jsonpath="{.items[*].metadata.name}"`; do
    kubectl patch ${resource_type}.application.kubesphere.io ${resource_name} -p '{"metadata":{"finalizers":null}}' --type=merge
  done
  kubectl delete ${resource_type}.application.kubesphere.io --all 2>/dev/null
done

# delete workspacetemplates
for workspacetemplate in `kubectl get workspacetemplates.tenant.kubesphere.io -o jsonpath="{.items[*].metadata.name}"`
do
  kubectl patch workspacetemplates.tenant.kubesphere.io $workspacetemplate -p '{"metadata":{"finalizers":null}}' --type=merge
done
kubectl delete workspacetemplates.tenant.kubesphere.io --all 2>/dev/null

# delete federatednamespaces in namespace kubesphere-monitoring-federated
for resource in $(kubectl get federatednamespaces.types.kubefed.io -n kubesphere-monitoring-federated -oname); do
  kubectl patch "${resource}" -p '{"metadata":{"finalizers":null}}' --type=merge -n kubesphere-monitoring-federated
done

# delete crds
for crd in `kubectl get crds -o jsonpath="{.items[*].metadata.name}"`
do
  if [[ $crd == *kubesphere.io ]]; then kubectl delete crd $crd 2>/dev/null; fi
done

# delete relevance ns
for ns in kubesphere-alerting-system kubesphere-controls-system kubesphere-devops-system kubesphere-logging-system kubesphere-monitoring-system kubesphere-monitoring-federated openpitrix-system kubesphere-system
do
  kubectl delete ns $ns 2>/dev/null
done
```

格式化换行符

```
sed -i 's/\r//' kubesphere-delete.sh
```

执行

```
chmod 777 kubesphere-delete.sh
sh kubesphere-delete.sh
```

### 命令卸载

官方文档：[卸载 KubeSphere 和 Kubernetes](https://www.kubesphere.io/zh/docs/v3.3/installing-on-linux/uninstall-kubesphere-and-kubernetes/)

- 按照快速入门 (All-in-One) 安装的 KubeSphere：

```bash
./kk delete cluster
```

- 使用高级模式安装的 KubeSphere（使用配置文件创建）：

```bash
./kk delete cluster [-f config-sample.yaml]
```



