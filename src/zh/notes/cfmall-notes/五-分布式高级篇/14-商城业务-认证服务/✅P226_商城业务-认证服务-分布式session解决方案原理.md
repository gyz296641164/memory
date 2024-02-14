## Session共享问题解决-session复制

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202312/8163416707fdc9a55456471c94783331.png#id=MrrSS&originHeight=282&originWidth=397&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

优点：

- web-server（Tomcat）原生支持，只需要修改配置文件

缺点：

- session同步需要数据传输，占用大量网络带宽降低了服务器集群的业务处理能力
- 任意一台web-server保存的数据都是所有web-server的session总和，受到内存限制无法水平扩展更多的web-server
- 大型分布式集群情况下，由于所有web-server都全量保存数据，所以此方案不可取。

---

## Session共享问题解决-客户端存储

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202312/26b1609ddc7bc24af870eb00f2a2d7bb.png#id=WwajW&originHeight=271&originWidth=376&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

优点：

- 服务器不需存储session，用户保存自己的session信息到cookie中。节省服务端资源

缺点：

- 都是缺点，这只是一种思路。
- 具体如下： 
   - 每次http请求，携带用户在cookie中的完整信息， 浪费网络带宽
   - session数据放在cookie中，cookie有长度限制  4K，不能保存大量信息
   - session数据放在cookie中，存在泄漏、篡改、窃取等安全隐患
- 这种方式不会使用。

---

## Session共享问题解决-hash一致性

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202312/a923133f1d1f21e31396f6433949bdc4.png#id=mwhhD&originHeight=566&originWidth=447&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

优点：

- 只需要改nginx配置，不需要修改应用代码
- 负载均衡，只要hash属性的值分布是均匀的，多台web-server的负载是均衡的
- 可以支持web-server水平扩展（session同步法是不行 的，受内存限制）

缺点：

- session还是存在web-server中的，所以web-server重
- 启可能导致部分session丢失，影响业务，如部分用户需要重新登录
- 如果web-server水平扩展，rehash后session重新分布，也会有一部分用户路由不到正确的session

但是以上缺点问题也不是很大，因为session本来都是有有效期的。所以这两种反向代理的方式可以使用

---

## Session共享问题解决-统一存储

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202312/08c2411c515406f188cab2ca749c2023.png#id=Wc3qa&originHeight=403&originWidth=489&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

优点：

- 没有安全隐患
- 可以水平扩展，数据库/缓存水平切分即可
- web-server重启或者扩容都不会有session丢失

不足：

- 增加了一次网络调用，并且需要修改应用代码；如将所有的getSession方法替换为从Redis查数据的方式。redis获取数据比内存慢很多

---

## Session共享问题解决-不同服务，子域session共享

jsessionid这个cookie默认是当前系统域名的。当我们拆分服务，不同域名部署的时候，我们可以使用如下解决方案；

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202312/9bcc3af4a79a335df2dacea90e82cb0c.png#id=fyoGM&originHeight=375&originWidth=738&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

放大域名，SpringSession也为我们做好了

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202312/0168c06bf47e9745caf2413414936594.png#id=KDssB&originHeight=528&originWidth=1169&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202312/da36077e736a9525f25cb4247ebe6fb5.png#id=uGI07&originHeight=461&originWidth=1242&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)
