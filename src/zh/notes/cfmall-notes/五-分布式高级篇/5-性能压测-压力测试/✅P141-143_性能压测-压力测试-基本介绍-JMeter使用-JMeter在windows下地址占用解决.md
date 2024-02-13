---
title: ✅P141-143_性能压测-压力测试-基本介绍-JMeter使用-JMeter在windows下地址占用解决
category:
  - 谷粒商城
date: 2024-02-13
---

<!-- more -->

## 开篇

压力测试考察当前软硬件环境下系统所能承受的最大负荷并帮助找出系统瓶颈所在。 压测都是为了系统在线上的处理能力和稳定性维持在一个标准范围内， 做到心中有数。

使用压力测试， 我们有希望找到很多种用其他测试方法更难发现的错误。 有两种错误类型是：内存泄漏， 并发与同步。

有效的压力测试系统将应用以下这些关键条件：重复， 并发， 量级， 随机变化。

---

## 一、性能指标

-  响应时间（Response Time: RT） 
   - 响应时间指用户从客户端发起一个请求开始， 到客户端接收到从服务器端返回的响应结束， 整个过程所耗费的时间。
-  HPS（Hits Per Second）：每秒点击次数， 单位是次/秒。 
-  TPS（Transaction per Second） ： 系统每秒处理交易数， 单位是笔/秒。 
-  QPS（Query per Second）：系统每秒处理查询次数， 单位是次/秒。 
   - 对于互联网业务中， 如果某些业务有且仅有一个请求连接， 那么 TPS=QPS=HPS， 一般情况下用 TPS 来衡量整个业务流程， 用 QPS 来衡量接口查询次数， 用 HPS 来表示对服务器单击请求。
-  无论 TPS、 QPS、 HPS，此指标是衡量系统处理能力非常重要的指标， 越大越好， 根据经验， 一般情况下： 
   - 金融行业： 1000TPS~50000TPS， 不包括互联网化的活动
   - 保险行业： 100TPS~100000TPS， 不包括互联网化的活动
   - 制造行业： 10TPS~5000TPS
   - 互联网电子商务： 10000TPS~1000000TPS
   - 互联网中型网站： 1000TPS~50000TPS
   - 互联网小型网站： 500TPS~10000TPS
-  最大响应时间（Max Response Time） 指用户发出请求或者指令到系统做出反应（响应）的最大时间。 
-  最少响应时间（Mininum ResponseTime） 指用户发出请求或者指令到系统做出反应（响应） 的最少时间。 
-  90%响应时间（90% Response Time） 是指所有用户的响应时间进行排序， 第 90%的响应时间。 
-  从外部看， 性能测试主要关注如下三个指标 
   - 吞吐量： 每秒钟系统能够处理的请求数、 任务数。
   - 响应时间： 服务处理一个请求或一个任务的耗时。
   - 错误率： 一批请求中结果出错的请求所占比例。

---

## 二、JMeter

### 1、 JMeter 安装

JMeter下载地址：[https://jmeter.apache.org/download_jmeter.cgi](https://jmeter.apache.org/download_jmeter.cgi)
![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202312011059430.png#id=AcVmm&originHeight=220&originWidth=667&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

下载对应的压缩包， 解压运行 `jmeter.bat` 即可
![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202312011100422.png#id=KMGLx&originHeight=415&originWidth=611&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=) 

JMeter中文设置
![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202312011107327.png#id=agKzN&originHeight=438&originWidth=783&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

### 2、 JMeter 压测示例

#### 2.1 添加线程组

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311301947686.png#id=uWEZt&originHeight=372&originWidth=690&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)
![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311301947378.png#id=I3NCw&originHeight=484&originWidth=1420&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

线程组参数详解：

- 线程数： 虚拟用户数。 一个虚拟用户占用一个进程或线程。 设置多少虚拟用户数在这里也就是设置多少个线程数。
- Ramp-Up Period(in seconds)准备时长： 设置的虚拟用户数需要多长时间全部启动。 如果线程数为 10， 准备时长为 2， 那么需要 2 秒钟启动 10 个线程， 也就是每秒钟启动 5 个线程。
- 循环次数： 每个线程发送请求的次数。 如果线程数为 10， 循环次数为 100， 那么每个线程发送 100 次请求。 总请求数为 10*100=1000 。 如果勾选了“永远”， 那么所有线程会一直发送请求， 一到选择停止运行脚本。
- Delay Thread creation until needed： 直到需要时延迟线程的创建。
- 调度器： 设置线程组启动的开始时间和结束时间(配置调度器时， 需要勾选循环次数为永远)
- 持续时间（秒） ： 测试持续时间， 会覆盖结束时间
- 启动延迟（秒） ： 测试延迟启动时间， 会覆盖启动时间
- 启动时间： 测试启动时间， 启动延迟会覆盖它。 当启动时间已过， 手动只需测试时当前时间也会覆盖它。
- 结束时间： 测试结束时间， 持续时间会覆盖它。

#### 2.2 添加 HTTP 请求

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311301948845.png#id=r7zzd&originHeight=599&originWidth=699&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)
![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311301948912.png#id=OUTVw&originHeight=605&originWidth=1906&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

#### 2.3 添加监听器

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311301948668.png#id=jQLrs&originHeight=725&originWidth=775&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

#### 2.4 启动压测&查看分析结果

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311301948120.png#id=IZAm9&originHeight=481&originWidth=1208&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

结果分析：

- 有错误率同开发确认， 确定是否允许错误的发生或者错误率允许在多大的范围内；
- Throughput 吞吐量每秒请求的数大于并发数， 则可以慢慢的往上面增加； 若在压测的机器性能很好的情况下， 出现吞吐量小于并发数， 说明并发数不能再增加了， 可以慢慢的往下减， 找到最佳的并发数；
- 压测结束， 登陆相应的 web 服务器查看 CPU 等性能指标， 进行数据的分析;
- 最大的 tps， 不断的增加并发数， 加到 tps 达到一定值开始出现下降， 那么那个值就是最大的 tps。
- 最大的并发数： 最大的并发数和最大的 tps 是不同的概率， 一般不断增加并发数， 达到一个值后， 服务器出现请求超时， 则可认为该值为最大的并发数。
- 压测过程出现性能瓶颈， 若压力机任务管理器查看到的 cpu、 网络和 cpu 都正常， 未达到 90%以上， 则可以说明服务器有问题， 压力机没有问题。
- 影响性能考虑点包括： 
   - 数据库、 应用程序、 中间件（tomact、 Nginx） 、 网络和操作系统等方面
- 首先考虑自己的应用属于 **CPU 密集型**还是 **IO 密集型**

#### 2.5 聚合报告参数分析

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311301948056.png#id=GI9fQ&originHeight=315&originWidth=1915&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

| **Label** | 每个 JMeter 的 element（例如 HTTP Request）都有一个 Name 属性，这里显示的就是 Name 属性的值； |
| --- | --- |
| **#Samples** | 表示这次测试中一共发出了多少个请求，**值 = 线程数 _ 循环次数_ |
| **Average** | 平均响应时间——默认情况下是单个 Request 的平均响应时间（ms），当使用了 Transaction Controller时，也可以以Transaction 为单位显示平均响应时间；**值 = 总运行时间 / 发送到服务器的总请求数** |
| **Median** | 中位数，也就是 50％ 用户的响应时间（ms）； |
| **90% Line ~ 99% Line** | 90％ ~99%用户的响应时间（ms）； |
| **Min** | 最小响应时间（ms）； |
| **Maximum** | 最大响应时间（ms）； |
| **Error%** | 本次测试中出现的错误率，即 错误的请求的数量/请求的总数； |
| **Throughput** | 吞吐量——默认情况下表示每秒完成的请求数（Request per Second）； |
| **Received KB/sec** | 每秒从服务器端接收到的数据量； |
| **Sent KB/sec** | 每秒从客户端发送的请求的数量。 |


---

## 三、JMeter Address Already in use 错误解决

windows 本身提供的端口访问机制的问题。

- Windows 提供给 TCP/IP 链接的端口为 `1024-5000`， 并且要四分钟来循环回收他们。 就导致我们在短时间内跑大量的请求时将端口占满了。

解决方法：

- cmd 中， 用 `regedit` 命令打开注册表
- 在 `HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters` 下， 
   - 右击 `parameters`， 添加一个新的 `DWORD`， 名字为 `MaxUserPort`
   - 然后双击 `MaxUserPort`， 输入数值数据为 `65534`， 基数选择十进制（如果是分布式运行的话， 控制机器和负载机器都需要这样操作哦）
   - 以同样方式添加 `TCPTimedWaitDelay`： 30
- 修改配置完毕之后记得重启机器才会生效
- [配置参考]([https://support.microsoft.com/zh-cn/help/196271/when-you-try-to-connect-from-tcp-ports-grea](https://support.microsoft.com/zh-cn/help/196271/when-you-try-to-connect-from-tcp-ports-grea) ter-than-5000-you-receive-t)
