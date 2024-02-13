---
title: ✅P145_性能压测-性能监控-jvisualvm使用
category:
  - 谷粒商城
date: 2024-02-13
---

<!-- more -->

## 一、jvisualvm

Jdk 的两个小工具 jconsole、 jvisualvm（升级版的 jconsole）；通过命令行启动， 可监控本地和远程应用。 远程应用需要配置。

---

### 1.1 jvisualvm 能干什么

监控内存泄露， 跟踪垃圾回收， 执行时内存、 cpu 分析， 线程分析...
![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202312011033730.png#id=bJZj1&originHeight=54&originWidth=402&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

- 运行： 正在运行的
- 休眠： sleep
- 等待： wait
- 驻留： 线程池里面的空闲线程
- 监视： 阻塞的线程， 正在等待锁

---

### 1.2 下载jvisualvm

直接打开：在cmd窗口中输入`jvisualvm`命令，回车即可，

报错：输入命令提示 jvisualvm不是内部或外部命令，也不是可运行的程序或批处理文件

原因：

1. 如果你的jconsole可以打开，然而jvisualvm不可以，那是因为有的版本jdk不包含jvisualvm，需要下载；
2. 另一种情况是环境变量有没有配AVA_HOME为个人的JDK安装目录，Path是否配置`%JAVA_HOME%\bin;%JAVA_HOME%\jre\bin;`

问题解决：

我使用的是open-jdk，并不包含jvisualvm，需要自己手动下载，下载地址：[jvisualvm官网下载](https://visualvm.github.io/)

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311302049760.png#id=fmNr0&originHeight=485&originWidth=900&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311302050690.png#id=PwphT&originHeight=63&originWidth=430&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

下载后在`visualvm_139\visualvm_139\etc`目录下的`visualvm.conf`文件中配置jdk目录，

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311302052869.png#id=ZJVAJ&originHeight=37&originWidth=646&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

启动jvisualvm，双击`visualvm.exe`

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311302052275.png#id=i4gMI&originHeight=122&originWidth=537&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

### 1.3 安装Visual GC插件

查看jdk版本号，小版本为151

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311302054317.png#id=XohMT&originHeight=80&originWidth=491&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

找到jdk版本对应的Visual GC插件，

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311302055815.png#id=kVQF5&originHeight=303&originWidth=989&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

本地jdk小版本号151在131-381之间，点击红框地址

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311302055850.png#id=YX94v&originHeight=344&originWidth=966&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

复制以下地址

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311302057625.png#id=HmVhU&originHeight=208&originWidth=823&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

打开jvisualvm界面，选择Tools-Plugins

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311302058663.png#id=lwBz0&originHeight=578&originWidth=1169&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

Settings->Edit
![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311302059189.png#id=dYXXo&originHeight=559&originWidth=900&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

远程下载插件

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311302103512.png#id=PxU9Q&originHeight=474&originWidth=899&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

远程下载不下来，使用导入功能

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311302104850.png#id=Z1GPQ&originHeight=525&originWidth=830&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311302105292.png#id=BaBrb&originHeight=687&originWidth=959&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

安装之后需要重启jvisualvm

### 1.4 使用

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311302107338.png#id=O6YDh&originHeight=557&originWidth=1920&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

---

## 二、jconsole

> **使用**


Windows + R，输入框中输入`jconsole`命令，

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311302021877.png#id=R3bLm&originHeight=229&originWidth=396&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

选择一个进程，

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311302022104.png#id=lhfw4&originHeight=744&originWidth=884&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

选择”不安全连接“，压测的时候可以实时的查看堆内存、线程、CPU的使用情况

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311302023358.png#id=uBxmm&originHeight=740&originWidth=883&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

选择导航栏的“内存”选项，

第一个堆则显示老年代的内存情况，点击第二个显示的是新生代/伊甸园，点击第三个则是幸存区

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311302020835.png#id=jBC1i&originHeight=782&originWidth=884&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)
