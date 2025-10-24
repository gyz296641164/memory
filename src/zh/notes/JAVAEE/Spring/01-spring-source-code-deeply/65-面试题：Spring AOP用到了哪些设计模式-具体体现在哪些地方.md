---
title: 65_面试题：Spring AOP用到了哪些设计模式？具体体现在哪些地方？
category:
  - Spring源码
star: true
sticky: true
date: 2023-03-24
---

<!-- more -->

## 开篇

大家好，到这里为止呢，AOP的核心源码我们就分析完毕了，作为AOP章节的最后一讲，我们会一起来看下，AOP中是怎么来玩儿设计模式的。

这里呢，先给大家抛出来一个问题：那就是我们为什么要看源码呢？

可能有的同学说，是为了面试，也有的同学说，是为了知己知彼，这样才能更好的使用框架。

其实呢，这些都是正确的，不过最重要的，其实是通过看别人设计的源码，我们可以学习到多种场景下不同的解决方案，达到开阔思维，提升架构设计能力的目的。

因为往往优秀的开源框架，都会通过使用一些设计模式，来达到良好的扩展性，那么在我们刚刚学习的AOP中，都使用到了哪些设计模式呢？我们这节就来一起看看。

在开始之前呢，先介绍下本节的主要内容，如下：

1. 首先我们会简单再现一下面试场景，作为我们这节的前菜，接着就会轮到我们下边的主菜
2. 主菜一：代理模式在AOP中是怎么来玩儿的？
3. 主菜二：策略模式在AOP中是怎么来玩儿的？
4. 主菜三：适配器模式在AOP中是怎么来玩儿的？
5. 主菜四：责任链模式在AOP中是怎么来玩儿的？
6. 主菜五：模板模式在AOP中是怎么来玩儿的？

---

## 面试场景再现

现在假如你正在参加一场技术面试，刚刚呢，你和面试官聊了一下AOP代理的整个创建过程和执行过程的源码，此时面试官对你赞赏有加，接着面试官提出了下一个问题。

面试官：“非常不错，看来你确实踏实的研究过AOP的源码，那么你可以简单说下，在AOP中都用到了哪些设计模式吗？”

听到这个问题后，你心里想：“纳尼？AOP用到了哪些设计模式？之前压根儿没思考过啊，这下完蛋了”

此时你口中慢慢回答：“呃...  嗯... 应该用到了单例模式和工厂模式”

面试官：“不错，Spring确实使用到了单例模式和工厂模式，还有其他的设计模式吗？”

此时你尬的一笑：“呃... 暂时想不起来了”

面试官：“没事儿，我给你个提示，AOP中的动态代理用到了哪种设计模式？”

听到这个提示后，你心里想：“窝草，动态代理用到的是代理模式啊，我竟然把这个都忘了，我这脑袋”

心里犯完嘀咕后，赶紧回答：“AOP中的动态代理使用到了代理模式！”

面试官：“说的对，这不是知道吗？刚才没回答出来，是因为你平时在设计模式这块思考的比较少，后边多注意设计模式这块的积累就好了，好了，我们继续聊下一个问题吧”

然后你和面试官又聊了起来......

在上边的这个场景中，本来你将要从源码层面征服面试官了，可谁想，被一个简单的设计模式问题给难住了，真的是太亏了。

其实在面试中，还是有相当一部分面试官喜欢问设计模式的，因为这个东西，平时你写代码会经常使用到，合理的运用设计模式，可以大大提升代码的可扩展性。

好了，那回到主线，在AOP中到底使用到了哪些设计模式呢？我们接下来就一起来看下

---

## 代理模式在AOP中是怎么来玩儿的？

首先我们要看的，当然是代理模式啦，这里我们以jdk代理为例来分析下，我们看下边这张图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303241109412.png)

通过上边这行代码，就可以创建出来一个jdk代理类，创建出来的jdk代理类核心代码如下：

```java
public final class $Proxy13 extends Proxy implements ProductService, SpringProxy, Advised, DecoratingProxy {
    private static Method m4;
    private static Method m3;
    
    // 创建代理会调用Proxy.newProxyInstance(classLoader, proxiedInterfaces, this)
    // 而在newProxyInstance()中又调用了cons.newInstance(new Object[]{h})来创建$Proxy13对象
    // 而这个被调用的cons构造方法就是下边这个构造方法，入参this其实就是JdkDynamicAopProxy
    public $Proxy13(InvocationHandler var1) throws  {
        // 将JdkDynamicAopProxy设置给父类Proxy中的h属性
        super(var1);
    }

    // 实现了ProductService接口的getProductById()方法
    public final Product getProductById(Integer var1) throws  {
        try {
            // 主要就是为了生成下边这行代码的字节码
            // m4为getProductById()方法的method对象
            return (Product)super.h.invoke(this, m4, new Object[]{var1});
        } catch (RuntimeException | Error var3) {
            throw var3;
        } catch (Throwable var4) {
            throw new UndeclaredThrowableException(var4);
        }
    }

    // 实现了ProductService接口的addProduct()方法
    public final void addProduct(Product var1) throws  {
        try {
            // 主要就是为了生成下边这行代码的字节码
            // m3为addProduct()方法的method对象
            super.h.invoke(this, m3, new Object[]{var1});
        } catch (RuntimeException | Error var3) {
            throw var3;
        } catch (Throwable var4) {
            throw new UndeclaredThrowableException(var4);
        }
    }

    static {
        try {
            // 通过反射获取getProductById()方法的method对象
            m4 = Class.forName("com.ruyuan.aop.service.ProductService").getMethod("getProductById", Class.forName("java.lang.Integer"));
            // 通过反射获取addProduct()方法的method对象
            m3 = Class.forName("com.ruyuan.aop.service.ProductService").getMethod("addProduct", Class.forName("com.ruyuan.aop.model.Product"));
        } catch (NoSuchMethodException var2) {
            throw new NoSuchMethodError(var2.getMessage());
        } catch (ClassNotFoundException var3) {
            throw new NoClassDefFoundError(var3.getMessage());
        }
    }
}
```

上边这个就是生成的jdk代理类，而这个代理类会去调用InvocationHandler的involve()方法，然后在involve()方法中，进一步调用目标类的方法，这些细节我们之前都讲过了，这里就不再赘述了。

我们这里就用一张图，以jdk代理为例，来看下代理模式，我们看这张图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303241110738.png)

其实上图中的代理类Proxy，就是通过Proxy.newProxyInstance()方法生成的代理类，客户端调用的就是这个代理类，而代理类呢，其实还是依赖于目标类来完成功能，但是代理类可以在目标类的基础功能之上，添加一些增强逻辑，比如记录日志等。

这个就是AOP中的代理模式的使用。

---

## 策略模式在AOP中是怎么来玩儿的？

接下来是策略模式，那么可能有的同学会有疑问，在AOP中，哪里使用到了策略模式？

是这样的，我们知道，在AOP中是有两种动态代理的，分别是jdk代理和cglib代理，在运行的过程中，Spring会选择不同的动态代理实现方式，这个就是策略模式典型的应用场景

实现的方法其实也很简单，首先就是要定义一个策略接口，然后让不同的策略类都实现这个策略接口。

而具体到Spring源码的话，AopProxy就是策略接口，实现了AopProxy接口的策略类分别是JdkDynamicAopProxy和CglibAopProxy，类继承图如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303241110222.png)

同时AopProxy接口的定义如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303241110562.png)

而选择具体策略类的逻辑，在DefaultAopProxyFactory类的createAopProxy()方法中，我们看这里：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303241110527.png)

上边的代码，其实就是根据一些条件，来决定使用哪个策略类！在选择完策略类之后，就会使用策略类的getProxy()方法获取动态代理对象，而不同策略类的getProxy()方法有不同的实现，但是对于外界是透明的，外界要的只是一个代理对象，而不关心你内部是怎么生成的。

这个就是策略模式在AOP中的玩儿法。

---

## 适配器模式在AOP中是怎么来玩儿的？

然后就是适配器模式的使用了，那么适配器又体现在了哪里呢？

其实很简单，我们知道，在AOP中的Advice其实就是增强逻辑，而具体实现的时候，这些增强都需要转换为拦截器MethodInterceptor类型才行，其中需要转换的有MethodBeforeAdvice、AfterReturningAdvice以及ThrowsAdvice。

然后每个类型 Advice 都有各自对应的拦截器，分别为MethodBeforeAdviceInterceptor、AfterReturningAdviceInterceptor、ThrowsAdviceInterceptor

那具体是怎么转换的呢？

其实此时就需要使用适配器模式对 Advice 进行转换了，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303241110146.png)

其实说白了，就是专门搞个适配器类，而这个适配器类就是专门用于转换接口或类的，比如将AfterAdvice类型转换为MethodInterceptor类型。

具体到代码的话，我们看这里：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303241110904.png)

通过上图，我们可以看到这个adapters中，会默认添加进去3个适配器，那么这些适配器是怎么使用的呢？

用法其实也很简单，我们看下边这张图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303241110010.png)

然后我们这里以MethodBeforeAdviceAdapter为例，来看下适配器是怎么来做转换的，MethodBeforeAdviceAdapter的代码如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303241110986.png)

通过上图，可以看到，其实MethodBeforeAdviceAdapter干的事儿，说白了就是将一个MethodBeforeAdvice转换为了MethodBeforeAdviceInterceptor类型。

而MethodBeforeAdviceInterceptor的代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303241111703.png)

通过上边的代码，可以看到，在这个MethodBeforeAdviceInterceptor中，实际负责完成功能的，还是刚才传进来的MethodBeforeAdvice

其实说白了，客户端期望的接口类型是MethodBeforeAdviceInterceptor，而源接口是MethodBeforeAdvice类型，所以需要适配器MethodBeforeAdviceAdapter来做一下转换，就是这个意思。

这个呢，就是适配器模式在AOP中的使用

---

## 责任链模式在AOP中是怎么来玩儿的？

在AOP代理执行时，我们知道有一个非常关键的数据结构，那就是拦截器链，而这个拦截器链的本质，其实是使用了责任链模式。

其中在拦截器链执行时，最核心的代码就是ReflectiveMethodInvocation类中的proceed()方法了，代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303241111153.png)

在上边的代码中，interceptorsAndDynamicMethodMatchers就是拦截器链的数据结构，其实就是一个List集合，在拦截器链执行时，就是通过这个List集合将各个拦截器串成了一根链条，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303241111431.png)

其实啊，AOP中拦截器链这一块的本质，就是使用了责任链模式，只不过这里是通过递归调用ReflectiveMethodInvocation的方式，将所有的拦截器组成了一根调用链条，但是本质它还是一个责任链模式的玩儿法。

---

## 模板方法模式在AOP中是怎么来玩儿的？

最后我们来看一个非常简单的设计模式，那就是模板方法模式，说白了就是将不变的代码，也就是通用代码放到父类中，这样可以有效减少子类中的重复代码，并且我们还可以在父类中定义好骨架，将细节交给子类去实现，从而方便后续扩展。

那么具体到代码的话，我们看下边这块代码，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303241111875.png)

上边的代码呢，是为目标类匹配增强的逻辑，可以看到，在这个findEligibleAdvisors()方法中，骨架已经定义好了，而红框中的extendAdvisors()方法的定义如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303241111452.png)

我们可以看到，上边抽象类AbstractAdvisorAutoProxyCreator中的extendAdvisors()方法竟然是个空实现，那有什么意义呢？

其实啊，这个extendAdvisors()方法是留给子类扩展的，我们看下边的实现：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303241111574.png)

通过上图，可以看到，子类AspectJAwareAdvisorAutoProxyCreator中重写了extendAdvisors()方法，从而扩展了findEligibleAdvisors()方法的功能。

可以看到，其实这里的模板方法模式的实现，并不是标准的抽象方法的实现方式，而是一个空实现的普通方法，但我们要知道的是，其实思想是一样的，对于设计模式，我们要知道，其实我们学的是其思想，而不是死的实现方式。

好了，到这里，AOP中使用到的一些设计模式就介绍差不多了，至于工厂模式，其实到处都是，所以这里就不单独拉出来讲了。

---

## 总结

好了，今天的知识点，我们就讲到这里了，我们来总结一下吧。

今天呢，我们主要梳理了一下，AOP中使用到的一些设计模式，其中主要介绍了代理模式、策略模式、适配器模式、责任链模式、模板方法模式，并且对于每种设计模式，我们也都具体到代码层面了，大家下去后，可以找到相应的代码走读体会一下，相信大家一定会有新的收获。