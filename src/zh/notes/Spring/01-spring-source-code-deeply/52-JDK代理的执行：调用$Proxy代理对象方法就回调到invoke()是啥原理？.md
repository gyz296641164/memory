<h1 align="center">52_JDK代理的执行：调用$Proxy代理对象方法就回调到invoke()是啥原理？</h1>

# 开篇

上篇文章我们分析了jdk动态代理对象生成的过程，简单说就是先生成代理类字节码，然后将代理类字节码加载到JVM，最后通过代理类的构造方法，就可以构造一个代理类对象出来了，这个时候我们就可以拿到动态代理对象了。

拿到jdk动态代理对象之后，我们就可以来调用这个代理对象中的方法了，这个时候我们知道一旦调用代理对象的方法，那么就会回调InvocationHandler的invoke()方法，这个动态代理的调用机制是java中的基础，相信大家都是知道的。

但是大家思考过原因吗？也就是为什么调用代理对象中的方法，就会直接回调到InvocationHandler的invoke()方法呢？为什么如此神奇？这中间又隐藏了哪些细节？

这个目前我们还不清楚，但是通过这篇文章，我们就会清楚这块的玩儿法了，那么今天我们会按照如下思路进行讲解：

1. 首先我们会调用下代理对象的方法来看下执行效果，发现此时增强逻辑都会生效
2. 然后从代理对象被调用的方法入手，来分析下代理类$Proxy13的代码
3. 接着分析下代理类$Proxy13中的核心属性h到底是什么
4. 最后会分析下代理类$Proxy13中的super.h.invoke()这行代码，它就是回调invoke()方法的关键！

---

# 来调用下代理对象的方法看下效果

上篇文章我们分析到了这个位置，大家来看下，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302161444485.png)

通过上边这张图，大家可以看到，这个时候Proxy.newProxyInstance()就会将创建好的代理对象给返回。

接着createProxy()方法也会跟着将创建的代理对象返回，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302161444615.png)

最后就又回到之前的wrapIfNecessary()方法中了，就是下边这个方法

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302161444607.png)

通过之前文章的分析，我们知道这个wrapIfNecessary()方法，就是来负责将普通bean包装为AOP代理的，在这里就会将创建好的AOP作为结果给返回。

最后当我们在调用指定bean时，比如productServiceImpl这个bean，就会获取到一个AOP代理对象，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302161444480.png)

然后我们通过调用这个AOP代理对象productService中的方法，就可以实现增强的效果了

最后我们可以看到上边测试类的打印结果如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302161444619.png)

虽然看到上边的执行结果，在我们的预料之中，但是我们心中不禁产生出一个疑问，那就是：通过动态代理的知识我们知道，当调用代理对象方法的时候，就会回调到InvocationHandler的invoke()方法中，这个已经深深烙在我们潜意识中了，但是这个过程是怎么实现的呢？

在思考这个问题的时候，大家可能有点无从下手的感觉，其实很简单，我们顺着这条线思考下去就行了，那是哪条线呢？

是这样的，现在我们已经生成了代理类，然后我们调用了代理类中的方法，比如这里的addProduct()方法和getProductById()方法，那我们就从代理类的addProduct()方法和getProductById()方法作为入口开始探索，看看能不能发现一些蛛丝马迹。

---

# 怎么查看代理类$Proxy的代码？

那这个时候我们就来看下代理类中的代码吧

但是我们马上就遇到了一个棘手的问题，那就是这个代理类不是我们手动编写的，而是在运行时生成的字节码，这个时候我们该怎么查看代理类的代码呢？

不慌，我们有办法！

是这样的，我们可以通过添加JVM运行参数来解决，我们可以在IDEA中编辑配置，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302161501125.png)

然后在虚拟机参数一栏中添加JVM运行参数：-Dsun.misc.ProxyGenerator.saveGeneratedFiles=true，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302161501565.png)

需要注意的是我这边的测试类是AopTest，大家到时候选择自己的测试类配置就可以了。

JVM运行参数配置完毕后，再执行一下测试类，比如我这里是AopTest，这个时候就会将运行时生成的代理类给保存到com.sun.proxy目录，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302161501999.png)

此时我们看到了这么多的代理类，那么哪个才是productServiceImpl这个bean的代理类呢？

其实这个也简单，我们直接在测试类AopTest中打个断点看下就知道了，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302161501426.png)

通过上边这张图，我们可以看到，productServiceImpl这个bean对应的代理类是$Proxy13

那这个时候就简单了，我们直接来看下代理类$Proxy13的代码，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302161501492.png)

大家可以看到，代理类$Proxy13的代码是比较多的，因为$Proxy13同时实现了ProductService, SpringProxy, Advised, DecoratingProxy这四个接口。

---

# 通过构造方法设置父类h属性

为了方便我们研究它的代码，我们这里只提取我们关心的代码，也就是和ProductService接口相关的代码，我们看这里

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

通过上边的代码，我们可以看到，这个代理类$Proxy13不但继承了父类Proxy，还分别实现了ProductService, SpringProxy, Advised, DecoratingProxy接口，不过我们主要关心的是ProductService这个接口。

然后我们发现代理类$Proxy13有一个带参数的构造方法如下：

```java
	// 创建代理会调用Proxy.newProxyInstance(classLoader, proxiedInterfaces, this)
    // 而在newProxyInstance()中又调用了cons.newInstance(new Object[]{h})来创建$Proxy13对象
    // 而这个被调用的cons构造方法就是下边这个构造方法，入参this其实就是JdkDynamicAopProxy
    public $Proxy13(InvocationHandler var1) throws  {
        // 将JdkDynamicAopProxy设置给父类Proxy中的h属性
        super(var1);
    }
```

通过上边的代码，可以看到这个构造方法的入参是InvocationHandler类型的，那这个构造方法会在哪里使用呢？

其实会在之前分析的newProxyInstance()方法中使用，我们看下之前讲过的一块代码，如下：

```java
    public static Object newProxyInstance(ClassLoader loader,
                                          Class<?>[] interfaces,
                                          InvocationHandler h)
        throws IllegalArgumentException
    {
    	// 省略部分代码
			
            // 获取代理类中的构造方法
            final Constructor<?> cons = cl.getConstructor(constructorParams);
            
            // 省略部分代码
            
            // 使用反射通过构造方法创建代理类对象，注意这里会将回调程序h传递到代理类中
            return cons.newInstance(new Object[]{h});
        // 省略部分代码
    }
```

大家可以看到，其实当我们创建代理时，就会通过cl.getConstructor(constructorParams)来获取代理类$Proxy13中的构造方法，而且我们还发现获取构造方法的时候，还有一个入参constructorParams，而这个入参constructorParams的定义如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302161506195.png)

这下就真相大白了，说白了cl.getConstructor(constructorParams)就是要获取$Proxy13类中入参是InvocationHandler类型的构造方法，也就是我们刚才在$Proxy13类中看到的构造方法，然后通过这个构造方法来创建$Proxy13类的实例。

不过我们发现在$Proxy13类的构造方法中执行了super(var1)这行代码，说白了这个就是在执行父类Proxy的构造方法，并且此时将接收到的InvocationHandler类型的入参var1传递给了父类Proxy，此时我们来看下父类Proxy的构造方法吧，代码如下：

```java
public class Proxy implements java.io.Serializable {
	// 回调程序，被设置为了JdkDynamicAopProxy
    protected InvocationHandler h;

    // 子类$Proxy13会调用父类这个构造方法将h属性设置为JdkDynamicAopProxy
    protected Proxy(InvocationHandler h) {
        Objects.requireNonNull(h);
        this.h = h;
    }
}
```

我们可以看到，父类的这个构造方法非常简单，其实就是将子类传递过来的InvocationHandler赋值给了h属性，而子类此时传递过来的InvocationHandler其实就是JdkDynamicAopProxy，也就是说此时**父类中的这个h属性就是`JdkDynamicAopProxy`**。

---

# 通过父类h属性回调JdkDynamicAopProxy的invoke()方法

好了，看完了$Proxy13类的构造方法后，我们来看下它里边的方法。

由于$Proxy13类实现了ProductService接口，所以在代理类$Proxy13中根据要实现的接口，分别生成了addProduct()方法和getProductById()方法。

那么此时当调用代理类$Proxy13的addProduct()方法时，就会执行方法里边的这行代码super.h.invoke(this, m3, new Object[]{var1})，代码如下：

```java
public final class $Proxy13 extends Proxy implements ProductService, SpringProxy, Advised, DecoratingProxy {
    // 省略部分代码

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

    // 省略部分代码
}
```

通过上边的代码，我们可以看到，在调用$Proxy13类的addProduct()方法时，直接调用了父类h属性的invoke()方法，我们知道现在父类Proxy中的h属性是JdkDynamicAopProxy，所以只要$Proxy13类的addProduct()方法被调用，那么就会执行JdkDynamicAopProxy类的invoke()方法！

而且我们发现$Proxy13类中的所有方法其实都没有具体的实现，全部是直接调用了父类h属性的invoke()方法，这下真相大白了吧？

**之所以调用代理对象的方法会自动回调到InvocationHandler的invoke()方法，是因为jdk在生成代理类时，为每个方法都生成了一行 super.h.invoke() 这样的代码，而这个h其实就是一个InvocationHandler，因此才可以回调到InvocationHandler的invoke()方法了。**

而我们代理类$Proxy13中的h，当时指定的InvocationHandler是JdkDynamicAopProxy，所以一旦代理类$Proxy13的方法被调用时，就会回调到JdkDynamicAopProxy的invoke()方法，代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302161513065.png)

通过上边的代码，我们可以看到，invoke()方法中有很多逻辑，它们具体是干嘛的，我们这篇文章先不深究，我们下篇文章会详细来分析这个invoke()方法的，大家不要着急。

最后我们来看下这个invoke()方法的三个参数分别传的是什么，我们再回头看下代理类$Proxy13，代码如下：

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

以addProduct()方法为例，此时会执行super.h.invoke(this, m3, new Object[]{var1})这行代码

第一个参数this没啥好说的，就是当前代理对象自己，也就是$Proxy13类的对象，

而第二个参数m3是在一个static代码块中初始化的，初始化代码为m3 = Class.forName("com.ruyuan.aop.service.ProductService").getMethod("addProduct", Class.forName("com.ruyuan.aop.model.Product"))，说白了就是使用反射获取到了addProduct()方法的method对象，也就是目标方法的method对象

而第三个参数很简单，其实就是将入参封装到了一个数组中

好了，也就是说当调用到代理对象的方法时，就会回调到JdkDynamicAopProxy类的invoke()方法，同时会将`代理对象本身`、`目标方法的method对象`以及`参数数组`都传递给invoke()方法，接着invoke()方法就利用传递进来的参数来做各种处理了。

---

# 总结

好了，今天的知识点，我们就讲到这里了，我们来总结一下吧。

一张图来梳理下AOP代理的执行流程

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302161514807.png)

上图就是我们今天分析的AOP代理执行流程的源码图

我们来总结一下，今天我们主要分析了下，调用代理类$Proxy13的方法时，回调到JdkDynamicAopProxy中invoke()方法的原理。

说白了就是生成的代理类$Proxy13，不仅根据接口生成了各个接口中的方法，并且在每个方法中都生成了一行**super.h.invoke()**的代码，这样就可以实现在调用代理类$Proxy13任何一个方法时，都可以回调到指定InvocationHandler的invoke()方法。

而这里的h在构建代理对象时，就被赋值为了JdkDynamicAopProxy，因此在调用代理类$Proxy13的方法时，就会回调到JdkDynamicAopProxy类的invoke()方法了。

并且我们还知道，在回调invoke()方法时，会将代理对象本身、目标方法以及参数列表都会传递过去，然后invoke()方法就会利用这些入参来执行目标方法和增强逻辑了，至于invoke()方法到底是怎么来玩儿的，我们下篇文章接着分析。