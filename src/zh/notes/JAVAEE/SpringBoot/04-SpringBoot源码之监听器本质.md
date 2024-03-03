---
title: 04_SpringBoot源码之监听器设计
category:
  - SpringBoot
date: 2024-03-03
---

<!-- more -->

## 1.观察者模式

监听器的设计会使用到Java设计模式中的观察者模式，所以在搞清楚SpringBoot中的监听器的设计之前我们还是非常有必要把观察者模式先弄清楚。

观察者模式又称为发布/订阅(Publish/Subscribe)模式,在对象之间定义了一对多的依赖，这样一来，当一个对象改变状态，依赖它的对象会收到通知并自动更新.

在java.util包中包含有基本的Observer接口和Observable抽象类.功能上和Subject接口和Observer接口类似.不过在使用上,就方便多了,因为许多功能比如说注册,删除,通知观察者的那些功能已经内置好了.

### 1.1 定义具体被观察者

```java
package com.dpb.observer2;

import java.util.Observable;

/**
 * 目标对象
 * 继承 Observable
 * @author dengp
 *
 */
public class ConcreteSubject extends Observable {

	private int state; 

	public void set(int s){
		state = s;  //目标对象的状态发生了改变
		setChanged();  //表示目标对象已经做了更改
		notifyObservers(state);  //通知所有的观察者
	}

	public int getState() {
		return state;
	}

	public void setState(int state) {
		this.state = state;
	}
}

```

观察者只需要继承Observable父类。发送消息的方式执行如下两行代码即可

```java
setChanged();  //表示目标对象已经做了更改
notifyObservers(state);  //通知所有的观察者
```

Observable源码对应的是：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/088a08e3ff72c78b.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/dbae9d417b0647cc.png)

### 1.2 定义具体观察者

```java
package com.dpb.observer2;

import java.util.Observable;
import java.util.Observer;
/**
 * 观察者模式：观察者(消息订阅者)
 * 实现Observer接口
 * @author dengp
 *
 */
public class ObserverA implements Observer {

	private int myState;

	@Override
	public void update(Observable o, Object arg) {
		myState = ((ConcreteSubject)o).getState();
	}
	public int getMyState() {
		return myState;
	}
	public void setMyState(int myState) {
		this.myState = myState;
	}
}
```

观察者也就是订阅者只需要实现Observer接口并重写相关update方法即可，在目标实现中我们发现触发的时候执行的就是观察者的update方法。

### 1.3 测试

```java
package com.dpb.observer2;

public class Client {
	public static void main(String[] args) {
		//创建目标对象Obserable
		ConcreteSubject subject = new ConcreteSubject();

		//创建观察者
		ObserverA obs1 = new ObserverA();
		ObserverA obs2 = new ObserverA();
		ObserverA obs3 = new ObserverA();

		//将上面三个观察者对象添加到目标对象subject的观察者容器中
		subject.addObserver(obs1);
		subject.addObserver(obs2);
		subject.addObserver(obs3);

		//改变subject对象的状态
		subject.set(3000);
		System.out.println("===============状态修改了！");
		//观察者的状态发生了变化
		System.out.println(obs1.getMyState());
		System.out.println(obs2.getMyState());
		System.out.println(obs3.getMyState());

		subject.set(600);
		System.out.println("===============状态修改了！");
		//观察者的状态发生了变化
		System.out.println(obs1.getMyState());
		System.out.println(obs2.getMyState());
		System.out.println(obs3.getMyState());

		//移除一个订阅者
		subject.deleteObserver(obs2);
		subject.set(100);
		System.out.println("===============状态修改了！");
		//观察者的状态发生了变化
		System.out.println(obs1.getMyState());
		System.out.println(obs2.getMyState());
		System.out.println(obs3.getMyState());
	}
}

```

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/36c4dd0a9ea07b48.png)

这样就实现了官方提供观察者模式。

---

## 2.SpringBoot中监听器的设计

然后我们来看下SpringBoot启动这涉及到的监听器这块是如何实现的。

### 2.1 初始化操作

通过前面的介绍我们知道在SpringApplication的构造方法中会加载所有声明在spring.factories中的监听器。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/5b5440e646a36f60.png)

通过Debug模式我们可以看到加载的监听器有哪些。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/06a98cc50f97e2a2.png)

其实就是加载的spring.factories文件中的key为ApplicationListener的value

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/1e6fea9482d64ef2.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/c78db99b387e9879.png)

通过对这些内置监听器的源码查看我们发现这些监听器都实现了 `ApplicationEvent`接口。也就是都会监听 `ApplicationEvent`发布的相关的事件。ApplicationContext事件机制是观察者设计模式的实现，通过ApplicationEvent类和ApplicationListener接口，可以实现ApplicationContext事件处理。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/4882c9bd782378cd.png)

### 2.2 run方法

然后我们来看下在SpringApplication.run()方法中是如何发布对应的事件的。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/fc65d856e95da0fd.png)

首先会通过getRunListeners方法来获取我们在spring.factories中定义的SpringApplicationRunListener类型的实例。也就是EventPublishingRunListener.

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/b8aea47eeccec81d.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/78afc1b16793abfe.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/9ddb20bfafed4fd3.png)

加载这个类型的时候会同步的完成实例化。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/686091e3b9fb5a14.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/ad56efccd253d99d.png)

实例化操作就会执行EventPublishingRunListener.

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/222245b7c46aa399.png)

在这个构造方法中会绑定我们前面加载的11个过滤器。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/8074b74033cf5cc6.png)

到这其实我们就已经清楚了EventPublishingRunListener和我们前面加载的11个监听器的关系了。然后在看事件发布的方法。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/a306714959b4400f.png)

查看starting()方法。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/927efd05faea8498.png)

再进入

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/ce68d86a055edd17.png)

进入到multicastEvent中方法中我们可以看到具体的触发逻辑

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/b8696e3b6325f351.png)

在这儿以ConfigFileApplicationListener为例。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/74077760d641dcc7.png)

触发会进入ConfigFileApplicationListener对象的onApplicationEvent方法中，

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/eef6568e4ad482b5.png)

通过代码我们可以发现当前的事件是ApplicationStartingEvent事件，都不满足，所以ConfigFileApplicationListener在SpringBoot项目开始启动的时候就不会做任何的操作。而当我们在配置环境信息的时候，会发布对应的事件来触发

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/ef938b5fa8cd3d5b.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/2faf7db882a35998.png)

继续进入

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/20f3e9917d21a9cf.png)

继续进入

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/c6c9cc7da627b5bb.png)

然后再触发ConfigFileApplicationListener监听器的时候就会触发如下方法了

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/fbe32e8638d11ee9.png)

其实到这儿，后面的事件发布与监听器的处理逻辑就差不多是一致了。到这儿对应SpringBoot中的监听器这块就分析的差不错了。像SpringBoot的属性文件中的信息什么时候加载的就是在这些内置的监听器中完成的。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/83eee0573145ffef.png)

官方内置的事件有：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/4e3f144ca1bdc652.png)

好了本文就给大家介绍到这里，希望能对你有所帮助哦。
