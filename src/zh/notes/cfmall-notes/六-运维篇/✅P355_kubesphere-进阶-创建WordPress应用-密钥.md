## 创建并部署 WordPress

官网：https://www.kubesphere.io/zh/docs/v4.1/02-quickstart/05-deploy-wordpress/

---

## 创建密钥

### 创建 MySQL 密钥

MySQL的环境变量`MYSQL_ROOT_PASSWORD`即root用户的密码属于敏感信息，不适合以明文的方式表现在步骤中，因此以创建密钥的方式来代替该环境变量。创建的密钥将在创建MySQL的容器组设置时作为环境变量写入。

1、使用 `project-regular` 帐户登录 KubeSphere 控制台，访问 `demo-project` 的详情页并导航到**配置中心**。在**密钥**中，点击右侧的**创建**

![image-20241220071441668](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202412/image-20241220071441668.png)

2、输入基本信息（例如，将其命名为 `mysql-secret`）并点击**下一步**

![image-20241220071448247](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202412/image-20241220071448247.png)

选择 **类型** 为 **Opaque（默认）**，然后点击 **添加数据** 来添加键值对。输入如下所示的键 (Key) `MYSQL_ROOT_PASSWORD` 和值 (Value) `123456`，点击右下角 **√** 进行确认。完成后，点击 **创建** 按钮以继续。

![image-20241220071455277](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202412/image-20241220071455277.png)

### 创建 WordPress 密钥

操作步骤如上，创建一个名为 `wordpress-secret` 的 WordPress 密钥，输入键 (Key) `WORDPRESS_DB_PASSWORD` 和值 (Value) `123456`。创建的密钥显示在列表中，如下所示：

![image-20241220072143458](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202412/image-20241220072143458.png)

---

## 创建存储卷

1、访问 **存储管理** 下的 **存储卷**，点击 **创建**

![image-20241220072846406](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202412/image-20241220072846406.png)

2、输入卷的基本信息（例如，将其命名为 `wordpress-pvc`），然后点击**下一步**。在**存储卷设置**中，需要选择一个可用的**存储类型**，并设置**访问模式**和**存储卷容量**。您可以直接使用如下所示的默认值，点击**下一步**继续

![image-20241220072852564](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202412/image-20241220072852564.png)

3、对于**高级设置**，您无需为当前步骤添加额外的配置，点击**创建**完成即可

4、创建的 wordpress-pvc和 mysql-pvc 如下：

![image-20241220073208189](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202412/image-20241220073208189.png)



