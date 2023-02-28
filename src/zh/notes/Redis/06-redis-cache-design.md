---
title: 缓存设计
category:
  - Redis
date: 2023-02-28
---

<!-- more -->

缓存能够有效地加速应用的读写速度， 同时也可以降低后端负载， 对日常应用的开发至关重要。 但是将缓存加入应用架构后也会带来一些问题， 以下将针对这些问题介绍缓存使用技巧和设计方案， 包含如下内容：  



## 1、缓存的收益和成本  

下图左侧为客户端直接调用存储层的架构， 右侧为比较典型的**缓存层+存储层**架构， 下面分析一下缓存加入后带来的收益和成本。  

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084743.png" alt="image-20210526230557858" />

### 1.1 **收益如下**  

- 加速读写：因为缓存通常是全内存的（例如Redis）,而存储层通常读写性能不够强悍（例如MySQL）,通过缓存的使用可以有效地加速读写。
- 降低后端负载：帮助后端减少访问量和复杂计算（例如很复杂的SQL语句），在很大程度降低了后端的负载。

### 1.2 **成本如下**

- 数据不一致性：缓存层和存储层的数据存在着一定时间窗口的不一致性，时间窗口跟更新策略有关。
- 代码维护成本：加入缓存后，需要同时处理缓存层和存储层的逻辑，增大了开发者维护代码的成本。
- 运维成本： 以Redis Cluster为例， 加入后无形中增加了运维成本。  

### 1.3 缓存的使用场景基本包含如下两种  

- 加速请求响应：即使查询单条后端数据足够快（例如select * from table where id=） ， 那么依然可以使用缓存， 以Redis为例子， 每秒可以完成数万次读写， 并且提供的批量操作可以优化整个IO链的响应时间。  
- 开销大的复杂计算： 以MySQL为例子， 一些复杂的操作或者计算（例如大量联表操作、 一些分组计算） ， 如果不加缓存， 不但无法满足高并发量， 同时也会给MySQL带来巨大的负担。  



***

## 2、缓存更新策略  

缓存中的数据通常都是有生命周期的， 需要在指定时间后被删除或更新， 这样可以保证缓存空间在一个可控的范围。 但是缓存中的数据会和数据源中的真实数据有一段时间窗口的不一致， 需要利用某些策略进行更新。 下面从使用场景、 一致性、 开发人员开发/维护成本三个方面介绍三种缓存的更新策略。



### 2.1 LRU/LFU/FIFO算法剔除  

**使用场景：**

剔除算法通常用于缓存使用量超过了预设的最大值时候， 如何对现有的数据进行剔除。 例如Redis使用maxmemory-policy这个配置作为内存最大值后对于数据的剔除策略。    

**一致性  ：**

要清理哪些数据是由具体算法决定， 开发人员只能决定使用哪种算法， **所以数据的一致性是最差的**。

**维护成本  ：**

算法不需要开发人员自己来实现， 通常只需要配置最大 `maxmemory` 和对应的策略即可。 开发人员只需要知道每种算法的含义， 选择适合自己的算法即可。  



### 2.2 超时剔除

**使用场景  :**

超时剔除通过给缓存数据设置过期时间， 让其在过期时间后自动删除， 例如Redis提供的expire命令。 如果业务**可以容忍一段时间内， 缓存层数据和存储层数据不一致， 那么可以为其设置过期时间**。   

**一致性  :**

一段时间窗口内（取决于过期时间长短） 存在一致性问题， 即缓存数据和真实数据源的数据不一致。  

**维护成本  :**

维护成本不是很高， 只需设置expire过期时间即可， 当然前提是应用方允许这段时间可能发生的数据不一致。  



### 2.3 主动更新 

**使用场景  ：** 

应用方对于数据的一致性要求高， 需要在真实数据更新后，立即更新缓存数据。 例如可以利用消息系统或者其他方式通知缓存更新。  

**一致性  ：**

一致性最高， 但如果主动更新发生了问题， 那么这条数据很可能很长时间不会更新， 所以**建议结合超时剔除一起使用效果会更好**。  

**维护成本  ：**

维护成本会比较高， 开发者需要自己来完成更新， 并保证更新操作的正确性。  



### 2.4 三种常见更新策略的对比  

![image-20210526232846745](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084744.png)



### 2.5 最佳实践  

**有两个建议：**  

- 低一致性业务建议配置最大内存和淘汰策略的方式使用。  
- 高一致性业务可以结合使用超时剔除和主动更新， 这样即使主动更新出了问题， 也能保证数据过期时间后删除脏数据。  



***

## 3、缓存粒度控制

很多项目缓存比较常用的选型：缓存层选用Redis， 存储层选用MySQL。  

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084745.png" alt="image-20210526234306093" />



例如现在需要将MySQL的用户信息使用Redis缓存， 可以执行如下操作：  

- 从MySQL获取用户信息：  

  ```sql
  select * from user where id={id}
  ```

- 将用户信息缓存到Redis中：  

  ```sql
  set user:{id} 'select * from user where id={id}'
  ```

假设用户表有100个列， 需要缓存到什么维度呢？  

- 缓存全部列：  

  ```
  set user:{id} 'select * from user where id={id}'
  ```

- 缓存部分重要列 :

  ```
  set user:{id} 'select {importantColumn1}, {importantColumn2} ... {importantColumnN} from user where id={id}'
  ```

  

  上述这个问题就是缓存粒度问题， 究竟是缓存全部属性还是只缓存部分重要属性呢？ 下面将从通用性、 空间占用、 代码维护三个角度进行说明。  

  

  1. 通用性 : 缓存全部数据比部分数据更加通用， 但从实际经验看， 很长时间内应用只需要几个重要的属性。  
  2. 空间占用  : 缓存全部数据要比部分数据占用更多的空间， 可能存在以下问题：
     - 全部数据会造成内存的浪费。  
     - 全部数据可能每次传输产生的网络流量会比较大， 耗时相对较大， 在极端情况下会阻塞网络。  
     - 全部数据的序列化和反序列化的CPU开销更大。  
  3. 代码维护：全部数据的优势更加明显， 而部分数据一旦要加新字段需要修改业务代码， 而且修改后通常还需要刷新缓存数据。    



<div align="center">缓存全部数据和部分数据对比  </div>

![image-20210526235018618](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084746.png)



***

## 4、穿透优化  



### 4.1 **缓存穿透**

是指查询一个根本不存在的数据，缓存层和存储层都不会命中。通常出于容错的考虑，如果从存储层查不到数据则不写入存储层，如图所示整个过程分为如下3步：

1）缓存不命中

2）存储层不命中，不将结果写回缓存

3）返回空结果

缓存穿透将导致不存在的数据每次请求都要到存储层去查询， 失去了缓存保护后端存储的意义。  

缓存穿透问题可能会使后端存储负载加大， 由于很多后端存储不具备高并发性， 甚至可能造成后端存储宕掉。 通常可以在程序中分别统计总调用数、 缓存层命中数、 存储层命中数， 如果发现大量存储层空命中， 可能就是出现了缓存穿透问题。  

**造成缓存穿透的基本原因有两个**： 第一， 自身业务代码或者数据出现问题， 第二， 一些恶意攻击、 爬虫等造成大量空命中。   



### 4.2 如何解决缓存穿透问题  

1. **缓存空对象**  

   如图11-4所示， 当第2步存储层不命中后， 仍然将空对象保留到缓存层中， 之后再访问这个数据将会从缓存中获取， 这样就保护了后端数据源。  

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084747.png" alt="image-20210527000952946" />

​	当第2步存储层不命中后， 仍然将空对象保留到缓存层中， 之后再访问这个数据将会从缓存中获取， 这样就保护了后端数据源。  

**缓存空对象会有两个问题：**   

- 第一， 空值做了缓存， 意味着缓存层中存了更多的键， 需要更多的内存空间（如果是攻击， 问题更严重） ， 比较有效的方法是针对这类数据设置一个较短的过期时间， 让其自动剔除。   
- 第二， 缓存层和存储层的数据会有一段时间窗口的不一致， 可能会对业务有一定影响。例如过期时间设置为5分钟， 如果此时存储层添加了这个数据， 那此段时间就会出现缓存层和存储层数据的不一致， 此时可以利用消息系统或者其他方式清除掉缓存层中的空对象。  



**缓存空对象的实现代码：**  

```java
String get(String key) {
// 从缓存中获取数据
String cacheValue = cache.get(key);
// 缓存为空
if (StringUtils.isBlank(cacheValue)) {
	// 从存储中获取
	String storageValue = storage.get(key);
	cache.set(key, storageValue);
// 如果存储数据为空， 需要设置一个过期时间(300秒)
if (storageValue == null) {
	cache.expire(key, 60 * 5);
}
    return storageValue;
} else {
	// 缓存非空
	return cacheValue;
  }
}
```



2. **布隆过滤器拦截**（具体实现细节待补充）  

在访问缓存层和存储层之前， 将存在的key用布隆过滤器提前保存起来， 做第一层拦截。   最新的用户由于没有历史行为， 就会发生缓存穿透的行为， 为此可以将所有推荐数据的用户做成布隆过滤器。 如果布隆过滤器认为该用户id不存在， 那么就不会访问存储层， 在一定程度保护了存储层。  

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084748.png" alt="image-20210527001625648" />



### 4.3 两种方案对比  

通过下表从适用场景和维护成本两个方面对两种方案进行分析。  

![image-20210527001737293](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084749.png)

<div align="center">缓存空对象和布隆过滤器方案对比  </div>



***

## 5、无底洞优化

为了满足业务要求添加了大量新Memcache节点， 但是发现性能不但没有好转反而下降了， 当时将这种现象称为**缓存的“无底洞”现象**！

为什么会产生这种现象呢 ？

- 键值数据库由于通常采用哈希函数将key映射到各个节点上， 造成key的分布与业务无关， 但是由于数据量和访问量的持续增长， 造成需要添加大量节点做水平扩容， 导致键值分布到更多的节点上， 所以无论是Memcache还是Redis的分布式， 批量操作通常需要从不同节点上获取， 相比于单机批量操作只涉及一次网络操作， **分布式批量操作会涉及多次网络时间**。  

- 如图展示了在分布式条件下， 一次mget操作需要访问多个Redis节点，需要多次网络时间。  

  

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084750.png" alt="image-20210527224340901" />         

​								分布式存储批量操作多次网络时间

- 而下图由于所有键值都集中在一个节点上， 所以一次批量操作只需要一次网络时间。 

   

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084751.png" alt="image-20210527224615365" />

<div align="center">当一个节点存储批量操作只需一次网络时间  </div>

**无底洞问题分析：**  

- 客户端一次批量操作会涉及多次网络操作，也就意味着批量操作会随着节点的增多，耗时会不断增大。
- 网络连接数变多，对节点的性能也有一定影响。



下面介绍如何在分布式条件下优化批量操作。 在介绍具体的方法之前，我们来看一下常见的IO优化思路：  

- 命令本身的优化， 例如优化SQL语句等。
- 减少网络通信次数。
- 降低接入成本， 例如客户端使用长连/连接池、 NIO等 。



这里假设命令、 客户端连接已经为最优， 重点讨论减少网络操作次数。以Redis批量获取n个字符串为例， 有三种实现方法， 如图所示。    

- 客户端n次get：n次网络 + n次get命令本身
- 客户端1次pipeline get：1次网络 + n次get命令本身
- 客户端1次mget：1次网络 + 1次mget命令本身



下面将结合Redis Cluster的一些特性对四种分布式的批量操作方式进行说明。  

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084752.png" alt="image-20210527225947969" />

<div align="center">客户端批量操作的三种实现  </div>

### 5.1 **串行命令**  

逐次执行n个get命令， 这种操作时间复杂度较高， 它的操作时间 = n次网络时间 + n次命令时间， 网络次数是n。 很显然这种方案不是最优的， 但是实现起来比较简单， 如图所示。  



<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084753.png" alt="image-20210527230552855" />

<div align="center">客户端串行n次命令 </div> 

Jedis客户端示例代码如下：  

```java
List<String> serialMGet(List<String> keys) {
	// 结果集
	List<String> values = new ArrayList<String>();
	// n次串行get
	for (String key : keys) {
		String value = jedisCluster.get(key);
		values.add(value);
	}
    return values;
}
```



### 5.2 **串行IO**  

它的操作时间 = node次网络时间 + n次命令时间， 网络次数是node的个数， 整个过程如下图所示， 很明显这种方案比第一种要好很多， 但是如果节点数太多， 还是有一定的性能问题。  



<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084754.png" alt="image-20210527231400589" />

<div align="center">客户端串行node次网络IO  </div>

Jedis客户端示例代码如下：  

```java
Map<String, String> serialIOMget(List<String> keys) {
	// 结果集
	Map<String, String> keyValueMap = new HashMap<String, String>();
	// 属于各个节点的key列表,JedisPool要提供基于ip和port的hashcode方法
	Map<JedisPool, List<String>> nodeKeyListMap = new HashMap<JedisPool, List<String>>()
	// 遍历所有的key
     for (String key : keys) {
		// 使用CRC16本地计算每个key的slot
		int slot = JedisClusterCRC16.getSlot(key);
		// 通过jedisCluster本地slot->node映射获取slot对应的node
		JedisPool jedisPool = jedisCluster.getConnectionHandler().getJedisPoolFrom
		Slot(slot);
		// 归档
		if (nodeKeyListMap.containsKey(jedisPool)) {
		nodeKeyListMap.get(jedisPool).add(key);
		} else {
			List<String> list = new ArrayList<String>();
			list.add(key);
			nodeKeyListMap.put(jedisPool, list);
		}
}
    // 从每个节点上批量获取， 这里使用mget也可以使用pipeline
	for (Entry<JedisPool, List<String>> entry : nodeKeyListMap.entrySet()) {
		JedisPool jedisPool = entry.getKey();
		List<String> nodeKeyList = entry.getValue();
		// 列表变为数组
		String[] nodeKeyArray = nodeKeyList.toArray(new String[nodeKeyList.size()]);
		// 批量获取， 可以使用mget或者Pipeline
		List<String> nodeValueList = jedisPool.getResource().mget(nodeKeyArray);
		// 归档
		for (int i = 0; i < nodeKeyList.size(); i++) {
			keyValueMap.put(nodeKeyList.get(i), nodeValueList.get(i));
		}
	}
    	return keyValueMap;
}
```



### 5.3 **并行IO**  

此方案是将方案2中的最后一步改为多线程执行， 网络次数虽然还是节点个数， 但由于使用多线程网络时间变为O（1） ， 这种方案会增加编程的复杂度。 它的操作时间为：  

```java
max_slow(node网络时间)+n次命令时间
```

整个过程如图所示。  



<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084755.png" alt="image-20210527231736374" />

<div align="center">客户端并行node次网络IO  </div>



### 5.4 **hash_tag实现**  

它可以将多个key强制分配到一个节点上， 它的操作时间 = 1次网络时间 + n次命令时间， 如图所示(hash_tag将多个key分配到一个节点)。

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084756.png" alt="image-20210527231858827" />  

所有key属于node2节点。  

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084757.png" alt="image-20210527232056234" />



Jedis客户端示例代码如下：

```java
List<String> hashTagMget(String[] hashTagKeys) {
	return jedisCluster.mget(hashTagKeys);
}	
```



### 5.5 **四种批量操作解决方案对比**  

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084758.png" alt="image-20210527232211764" />

没有最好的方案只有最合适的方案。  

***

## 6、雪崩优化

### 6.1 什么是雪崩？

由于缓存层承载着大量请求，有效地保护了存储层，但是如果缓存层由于某些原因不能提供服务，于是所有请求都会达到存储层，存储层的调用量会暴增，造成存储层也会级联宕机的情况。下图描述了缓存雪崩。



<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084759.png" alt="image-20210527232845302" />

<div align="center">缓存层不可用引起的雪崩</div>



### 6.2 预防和解决缓存雪崩问题 

1. **保证缓存层服务高可用性。**如果缓存层设计成高可用的， 即使个别节点、 个别机器、 甚至是机房宕掉， 依然可以提供服务， 例如前面介绍过的Redis Sentinel和Redis Cluster都实现了高可用。  

2. **依赖隔离组件为后端限流并降级。**  无论是缓存层还是存储层都会有出错的概率，可以将他们视同为资源。作为作为并发量较大的系统， 假如有一个资源不可用， 可能会造成线程全部阻塞（ hang） 在这个资源上，造成整个系统不可用。 降级机制在高并发系统中是非常普遍的： 比如推荐服务中， 如果个性化推荐服务不可用， 可以降级补充热点数据， 不至于造成前端页面是开天窗。  在实际项目中， 我们需要**对重要的资源（ 例如Redis、 MySQL、HBase、 外部接口） 都进行隔离**， 让每种资源都单独运行在自己的线程池中， 即使个别资源出现了问题， 对其他服务没有影响。Java依赖隔离工具[Hystrix](https://github.com/netflix/hystrix)！

   

   <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084800.png" alt="image-20210527233730662" />

<div align="center">Hystrix示意图</div>



***

## 7、热点key重建优化  

开发人员使用“缓存+过期时间”的策略既可以加速数据读写，又保证数据的定期更新，这种模式基本能满足绝大部分需求。但是以下两个问题的出现可能就会对应用造成致命危害：

- 当前key是一个热点key（例如一个热门的娱乐新闻），并发量非常大！
- 重建缓存不能在短时间完成，可能是一个复杂计算。例如复杂的SQL、多次IO、多个依赖等。

在缓存失效的瞬间，有大量线程来重建缓存（如下图所示），造成后端负载加大，甚至可能会让应用崩溃。

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084801.png" alt="image-20210528234733095" />

<div align="center">热点key失效后大量线程重建缓存  </div>

要解决这个问题也不是很复杂， 但是不能为了解决这个问题给系统带来更多的麻烦， 所以需要制定如下目标：  

- 减少重建缓存的次数
- 数据尽可能一致
- 较少的潜在危险

1. 互斥锁（mutex key）

   此方法只允许一个线程重建缓存，其他线程等待重建缓存的线程执行完，重新从缓存中获取数据即可，整个过程如下图所示：

   <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084802.png" alt="image-20210528235121292" />

   <div align="center">使用互斥锁重建缓存</div>

下面代码使用Redis的setnx命令实现上述功能：  

```java
String get(String key) {
	// 从Redis中获取数据
	String value = redis.get(key);
	// 如果value为空， 则开始重构缓存
	if (value == null) {
	// 只允许一个线程重构缓存， 使用nx， 并设置过期时间ex
	String mutexKey = "mutext:key:" + key;
	if (redis.set(mutexKey, "1", "ex 180", "nx")) {
		// 从数据源获取数据
		value = db.get(key);
		// 回写Redis， 并设置过期时间
		redis.setex(key, timeout, value);
		// 删除key_mutex
		redis.delete(mutexKey);
	}
        // 其他线程休息50毫秒后重试
		else {
			Thread.sleep(50);
			get(key);
	}
 }
    return value;
}
```

1） 从Redis获取数据， 如果值不为空， 则直接返回值； 否则执行下面的 2.1） 和2.2） 步骤。  

2.1） 如果set（ nx和ex） 结果为true， 说明此时没有其他线程重建缓存，那么当整个过程如图11-18所示  前线程执行缓存构建逻辑。

2.2） 如果set（ nx和ex） 结果为false， 说明此时已经有其他线程正在执行构建缓存的工作， 那么当前线程将休息指定时间（ 例如这里		  是50毫秒， 取决于构建缓存的速度） 后， 重新执行函数， 直到获取到数据。   



2. 永远不过期  

   “永远不过期”包含两层意思：  

   - 从缓存层面来看， 确实没有设置过期时间， 所以不会出现热点key过期后产生的问题， 也就是“物理”不过期。  

   - 从功能层面来看， 为每个value设置一个逻辑过期时间， 当发现超过逻辑过期时间后， 会使用单独的线程去构建缓存。  

     

   整个过程如图所示。

   

   <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084803.png" alt="image-20210528235644639" />  

   ​									“永远不过期”策略  

从实战看， 此方法有效杜绝了热点key产生的问题， 但唯一不足的就是重构缓存期间， 会出现数据不一致的情况， 这取决于应用方是否容忍这种不一致。 下面代码使用Redis进行模拟：  

```java
String get(final String key) {
	V v = redis.get(key);
	String value = v.getValue();
	// 逻辑过期时间
    long logicTimeout = v.getLogicTimeout();
	// 如果逻辑过期时间小于当前时间， 开始后台构建
	if (v.logicTimeout <= System.currentTimeMillis()) {
		String mutexKey = "mutex:key:" + key;
		if (redis.set(mutexKey, "1", "ex 180", "nx")) {
			// 重构缓存
			threadPool.execute(new Runnable() {
		public void run() {
			String dbValue = db.get(key);
			redis.set(key, (dbvalue,newLogicTimeout));
			redis.delete(mutexKey);
		}}
	  );
	}
  }
    return value;
}
```

作为一个并发量较大的应用， 在使用缓存时有三个目标：   

1）第一， 加快用户访问速度， 提高用户体验。 

2）第二， 降低后端负载， 减少潜在的风险， 保证系统平稳。 

3）第三， 保证数据“尽可能”及时更新。   

下面将按照这三个维度对上述两种解决方案进行分析 。

- 互斥锁（mutex key） ： 这种方案思路比较简单， 但是存在一定的隐患， 如果构建缓存过程出现问题或者时间较长， **可能会存在死锁和线程池阻塞的风险**， 但是这种方法**能够较好地降低后端存储负载， 并在一致性上做得比较好。**  
- “永远不过期”： 这种方案由于没有设置真正的过期时间， 实际上**已经不存在热点key产生的一系列危害， 但是会存在数据不一致的情况**， 同时代码复杂度会增大。  

两种解决方法对比如表所示。  

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084804.png" alt="image-20210529000236687" />



***



## 8、重点回顾

- 缓存的使用带来的收益是能够加速读写， 降低后端存储负载。

  

- 缓存的使用带来的成本是缓存和存储数据不一致性， 代码维护成本增大， 架构复杂度增大。

  

- 比较推荐的缓存更新策略是结合剔除、 超时、 主动更新三种方案共同完成。

  

- 穿透问题： 使用缓存空对象和布隆过滤器来解决， 注意它们各自的使用场景和局限性。

  

- 无底洞问题： 分布式缓存中， 有更多的机器不保证有更高的性能。有四种批量操作方式： 串行命令、 串行IO、 并行IO、hash_tag。

  

- 雪崩问题： 缓存层高可用、 客户端降级、 提前演练是解决雪崩问题的重要方法。

  

- 热点key问题： 互斥锁、 “永远不过期”能够在一定程度上解决热点key问题， 开发人员在使用时要了解它们各自的使用成本。  
