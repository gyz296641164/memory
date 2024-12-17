## 开篇

![kubesphere用户系统](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202412/kubesphere%E7%94%A8%E6%88%B7%E7%B3%BB%E7%BB%9F.png)

---

## 创建用户

用户：https://www.kubesphere.io/zh/docs/v4.1/05-users-and-roles/01-users/01-create-a-user/

角色：https://www.kubesphere.io/zh/docs/v4.1/05-users-and-roles/02-platform-roles/01-create-a-platform-role/

KubeSphere 平台提供以下预置平台角色，您也可以创建角色以自定义角色权限。

| 参数                      | 描述                                                         |
| :------------------------ | :----------------------------------------------------------- |
| platform-admin            | 平台管理员，在 KubeSphere 平台具有所有权限，包括平台角色管理、用户管理、平台设置管理、安装和卸载扩展组件等。 |
| platform-regular          | 平台普通用户，在平台级别只有应用查看权限。该角色一般授予不需要其他平台权限的企业空间成员。 |
| platform-self-provisioner | 创建企业空间并成为所创建的企业空间的管理员。                 |

**创建角色**

![image-20241218000433726](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202412/image-20241218000433726.png)

![image-20241218000506984](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202412/image-20241218000506984.png)

![image-20241218000545172](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202412/image-20241218000545172.png)

**创建账户**

- ws-manager 角色 workerspaces-manager
- ws-admin 角色 cluster-regular
- project-admin 角色cluter-regular
- project-regular 角色 cluster-regular

![image-20241218000744009](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202412/image-20241218000744009.png)

登出`admin`后重新登录`gyz-hr`进行账户创建

![image-20241217074003584](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202412/image-20241217074003584.png)

创建用户 `ws-manager`

![image-20241218001201316](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202412/image-20241218001201316.png)

创建用户 `ws-admin`

![image-20241218001232843](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202412/image-20241218001232843.png)

创建用户 `project-regular`

![image-20241218001255807](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202412/image-20241218001255807.png)

创建用户 `project-admin`

![image-20241218001327504](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202412/image-20241218001327504.png)

---

## 创建企业空间

先创建企业空间、然后邀请成员

![image-20241217074052017](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202412/image-20241217074052017.png)

![image-20241217074101053](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202412/image-20241217074101053.png)

用ws-manager账号先登录，邀请ws-admin（workerspace-admin），登录ws-admin，邀请project-regular（ws-viewer只读命名空间）、project-admin（ws-regular角色）

![image-20241217074109277](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202412/image-20241217074109277.png)

![image-20241217074117045](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202412/image-20241217074117045.png)

---

## 创建项目

![image-20241217235543416](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202412/image-20241217235543416.png)

![image-20241217234824088](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202412/image-20241217234824088.png)

![image-20241217234832967](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202412/image-20241217234832967.png)

---

## 邀请成员

登录`project-admin`创建项目，邀请`project-regular`来开发

![image-20241217234626413](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202412/image-20241217234626413.png)

![image-20241217234652608](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202412/image-20241217234652608.png)

---

## 创建devops

创建DevOps工程

![image-20241217235644737](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202412/image-20241217235644737.png)

![image-20241217235709405](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202412/image-20241217235709405.png)

邀请成员

![image-20241217235918197](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202412/image-20241217235918197.png)