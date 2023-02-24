---
title: 51_JDK代理的创建：深入底层，来看下jdk代理对象的创建过程分享
category:
  - Spring源码
---

# 开篇

大家好，到这里为止，我们已经知道了Spring选择jdk代理和cglib代理的逻辑，由于我们目前既没有开启优化策略，也没有设置基于类的代理，而此时目标类虽然实现了接口但不是SpringProxy类型的，因此这个时候Spring会选择使用jdk动态代理。

那么接下来当然是要生成jdk动态代理对象了，那么今天我们就一起来分析一下jdk动态代理对象创建的过程吧。

学完本篇文章，可以解决以下问题：

1. 首先就是平时我们的java代码是怎么运行起来的？
2. 我们知道平时创建jdk代理都是通过Proxy.newProxyInstance()，那么AOP是不是也是这个套路呢？
3. Proxy.newProxyInstance()方法到底是怎么创建出代理对象的？会不会是通过反射来搞的？
4. 代理类的字节码到底是在哪里生成的？

---

# java代码是怎么运行起来的？

在分析源码之前，让我们先来复习一个java基础知识：“我们写的java代码到底是怎么运行起来的？”

这个知识相信大家刚学习java时都学习过，我们这里就简单复习下这个知识，java代码运行流程大概是这样的：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302161107011.png)

大家可以看到，首先我们根据java规范来编写代码，也就是源码xxx.java文件，接着会使用javac命令将源码文件xxx.java编译生成字节码文件xxx.class，接着有类加载器将字节码xxx.class加载到Java虚拟机中，也就是我们常说的JVM，当字节码xxx.class被加载到JVM中后，这个类就可以被正常调用了，大概就是这个流程。

那现在大家思考一下，我们即将要分析的jdk动态代理是不是也是这样运行的呢？

答案当然是肯定的，jdk动态代理不就是一个代理类蛮，这个代理类也是java代码，只不过我们没有手动编写代理类的xxx.java文件，而是直接生成了代理类的字节码，也就是xxx.class文件，但是要想运行代理类的代码，同样也需要将代理类的字节码通过类加载器给加载到JVM中的。

说白了就是在运行代理类代码之前，一定会先生成代理类的字节码，接着将代理类的字节码通过类加载器加载到JVM，然后才可以运行代理类的构造方法创建出来一个代理对象出来，大概是这样子的流程。

---

# 创建jdk代理对象的入口：Proxy.newProxyInstance()

现在我们就来分析下代理对象的生成过程吧，上篇文章我们分析到了这个地方：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302161119205.png)

这里会通过构造方法创建一个JdkDynamicAopProxy类的实例出来。

而调用的构造方法如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302161119413.png)

大家可以看到，这里主要就是为JdkDynamicAopProxy中的advised属性进行了赋值，就是将之前构造的ProxyFactory给传了进来，也就是AOP代理的核心配置，里边包含了拦截器等核心属性，然后就直接构造了一个JdkDynamicAopProxy对象出来，其他没啥特别的。

接下来就将JdkDynamicAopProxy对象给返回，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302161119706.png)

当createAopProxy()方法执行完后，那么下一步就是调用getProxy()方法了，我们看下边这行代码

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302161119880.png)

由于此时createAopProxy()方法返回的是JdkDynamicAopProxy类型的对象，那么这里就会来调用JdkDynamicAopProxy类的getProxy()方法。

那还有啥好说的，此时我们直接点进去getProxy()方法，就会看到如下代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302161119206.png)

大家可以看到，这里就是使用jdk的Proxy.newProxyInstance()方法创建出来的动态代理对象。

我们都知道Proxy.newProxyInstance()方法有三个比较核心的参数，分别是类加载器、要实现的接口列表以及回调程序。

在这里我们可以看到，Spring先调用completeProxiedInterfaces()方法获取到了要代理的所有接口，然后将这个接口作为入参传了进去。另外我们还看到传给Proxy.newProxyInstance()方法的回调程序竟然是this，说白了就是将当前的JdkDynamicAopProxy对象作为回调程序传了进去。

参数都设置完毕后，我们就可以通过Proxy.newProxyInstance()方法拿到一个jdk代理对象了。

---

# 代理对象竟然是使用反射创建出来的？

> 涉及方法：
>
> - `java.lang.reflect.Proxy.getProxyClass0(ClassLoader loader, Class<?>... interfaces)`

一般我们分析jdk代理时，只要看到这个Proxy.newProxyInstance()就完事儿了，就不会继续往下探索了，反正我只要知道调用这个Proxy.newProxyInstance()，它就会给我返回一个代理对象，我就可以使用这个代理对象来实现增强逻辑了。

但是这样其实不太好，因为这样就会导致Proxy.newProxyInstance()对我们永远就是个黑盒，我们都不知道它内部是怎么创建出来这个代理对象的，所以我们这里会将Proxy.newProxyInstance()作为入口，继续往下探索，来分析下这个代理对象到底是咋“诞生的”。

由于这块属于jdk本身的源码，而不是Spring的，所以这里就直接将核心源码粘贴过来了，这样也方便写注释。

好了，那我们开始吧，首先我们来看下这个Proxy.newProxyInstance()方法吧，代码如下：

代码所在类的全限定类名：java.lang.reflect.Proxy#newProxyInstance

```java
    public static Object newProxyInstance(ClassLoader loader,
                                          Class<?>[] interfaces,
                                          InvocationHandler h)
        throws IllegalArgumentException
    {
    	// 检查一下回调程序是否为空
        Objects.requireNonNull(h);

		// 要实现的接口数组
        final Class<?>[] intfs = interfaces.clone();
        // 一些安全检查
        final SecurityManager sm = System.getSecurityManager();
        if (sm != null) {
            checkProxyAccess(Reflection.getCallerClass(), loader, intfs);
        }

        /*
         * Look up or generate the designated proxy class.
         */
         // 查找或生成指定的代理类，核心逻辑就在这里
         // 这里主要做两件事儿，其一就是生成代理类字节码，其二将生成的字节码加载到JVM中
        Class<?> cl = getProxyClass0(loader, intfs);

        /*
         * Invoke its constructor with the designated invocation handler.
         */
        try {
            if (sm != null) {
                checkNewProxyPermission(Reflection.getCallerClass(), cl);
            }
			
            // 获取代理类中的构造方法
            final Constructor<?> cons = cl.getConstructor(constructorParams);
            final InvocationHandler ih = h;
            if (!Modifier.isPublic(cl.getModifiers())) {
                AccessController.doPrivileged(new PrivilegedAction<Void>() {
                    public Void run() {
                        cons.setAccessible(true);
                        return null;
                    }
                });
            }
            // 使用反射通过构造方法创建代理类对象，注意这里会将回调程序h传递到代理类中
            return cons.newInstance(new Object[]{h});
        } catch (IllegalAccessException|InstantiationException e) {
            throw new InternalError(e.toString(), e);
        } catch (InvocationTargetException e) {
            Throwable t = e.getCause();
            if (t instanceof RuntimeException) {
                throw (RuntimeException) t;
            } else {
                throw new InternalError(t.toString(), t);
            }
        } catch (NoSuchMethodException e) {
            throw new InternalError(e.toString(), e);
        }
    }
```

通过上边这张图，可以看到，这个就是创建jdk代理的核心方法，我们一块代码一块代码来看

在刚进入方法后会执行下边这块代码：

```java
		// 检查一下回调程序是否为空
        Objects.requireNonNull(h);

		// 要实现的接口数组
        final Class<?>[] intfs = interfaces.clone();
        // 一些安全检查
        final SecurityManager sm = System.getSecurityManager();
        if (sm != null) {
            checkProxyAccess(Reflection.getCallerClass(), loader, intfs);
        }
```

大家可以看到，这里其实就是搞了一波校验，比如先是检查了一下回调程序是否为空，然后又做了一些安全检查

其实就是常规的一些检查，没啥好说的，核心逻辑都在下边，所以我们接着往下看，此时会看到这样一行代码：

```java
		/*
         * Look up or generate the designated proxy class.
         */
         // 查找或生成指定的代理类，核心逻辑就在这里
         // 这里主要做两件事儿，其一就是生成代理类字节码，其二将生成的字节码加载到JVM中
        Class<?> cl = getProxyClass0(loader, intfs);
```

我们可以看到，上边这行代码主要就是调用了getProxyClass0()方法，接着就获取到了一个Class类型的变量cl，那这个cl是什么呢？我们现在还确定不了，所以我们继续往下看，看下会有什么发现没有

然后我们就发现了下边这行代码：

```java
			// 获取代理类中的构造方法
            final Constructor<?> cons = cl.getConstructor(constructorParams);
```

通过上边这张图，可以看到，这里直接获取了cl中的构造方法，到这里我们不禁产生一个疑问：“获取cl的构造方法干嘛？难道是要通过这个构造方法来创建一个cl的实例出来吗？”

不过这个都是我们自己的猜测，我们还是继续往下看，主要就是跟踪下获取到的这个构造方法cons到底是用来干嘛的

这个时候我们就发现了最最重要的一行代码，我们看下边这行代码：

```java
			// 使用反射通过构造方法创建代理类对象，注意这里会将回调程序h传递到代理类中
            return cons.newInstance(new Object[]{h});
```

通过上边这行代码，我们惊奇的发现，这里直接使用反射，通过构造方法创建出了一个对象，并且回调程序h在这里会作为入参传递给这个构造方法，最后将这个创建的对象作为newProxyInstance()方法的结果进行了返回。

到这里我们恍然大悟，这个返回的实例就是创建完成的代理对象啊，那刚才的getProxyClass0()方法返回的Class类型的变量cl，不就是代理类的Class对象吗？

那也就是说真正的核心逻辑是在getProxyClass0()方法中，在这个方法中不但生成了代理类，还将生成的代理类加载到了JVM中，这样我们才可以获取到代理类中的构造方法。

其实这个newProxyInstance()方法的代码还是比较清晰的，就是先获取代理类的Class对象，然后再获取构造方法，最后通过构造方法创建了代理类的对象。

好了，接下来我们就要来探索下getProxyClass0()方法了。

---

# 代理类的字节码是在哪里生成的？

> 设计方法：
>
> - `sun.misc.ProxyGenerator.generateProxyClass(String arg0, Class<?>[] arg1, int arg2)`：生成指定的代理类，也就是生成代理类的字节码
> - ` java.lang.reflect.Proxy.defineClass0(ClassLoader loader, String name, byte[] b, int off, int len)`：将代理类加载到JVM这个过程是由native方法来完成的

此时我们打开getProxyClass0()方法，然后我们会看到下边的代码：

代码所在类的全限定类名：java.lang.reflect.Proxy#getProxyClass0

```java
    /**
     * a cache of proxy classes
     */
	// 初始化proxyClassCache，注意它的value是ProxyClassFactory类型
    private static final WeakCache<ClassLoader, Class<?>[], Class<?>>
        proxyClassCache = new WeakCache<>(new KeyFactory(), new ProxyClassFactory());    


	/**
     * Generate a proxy class.  Must call the checkProxyAccess method
     * to perform permission checks before calling this.
     */
    private static Class<?> getProxyClass0(ClassLoader loader,
                                           Class<?>... interfaces) {
        if (interfaces.length > 65535) {
            throw new IllegalArgumentException("interface limit exceeded");
        }

        // If the proxy class defined by the given loader implementing
        // the given interfaces exists, this will simply return the cached copy;
        // otherwise, it will create the proxy class via the ProxyClassFactory
        // 缓存中存在就从缓存中获取代理类，缓存中不存在就使用ProxyClassFactory创建代理类
        return proxyClassCache.get(loader, interfaces);
    }
```

我们发现在getProxyClass0()方法中主要是调用了proxyClassCache的get()方法获取的代理类，而这个proxyClassCache是通过 new WeakCache<>(new KeyFactory(), new ProxyClassFactory())来构造的，构造方法如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302161201103.png)

我们可以看到，这里通过构造方法初始化了subKeyFactory和valueFactory属性，subKeyFactory被赋值为了new KeyFactory()，而valueFactory属性被赋值为了new ProxyClassFactory()，但是这俩属性有啥用，起码这里我们还不知道，但是这里我们先有个印象再说，万一后边用到了呢。

好了，我们继续往下看，现在通过构造方法构造了一个proxyClassCache，然后接着就调用了它的get()方法来获取代理类，那我们就点开它的get()方法来一探究竟，代码如下：

代码所在类的全限定类名：java.lang.reflect.WeakCache#get

```java
    public V get(K key, P parameter) {
        // 省略部分代码

        // create subKey and retrieve the possible Supplier<V> stored by that
        // subKey from valuesMap
        Object subKey = Objects.requireNonNull(subKeyFactory.apply(key, parameter));
        Supplier<V> supplier = valuesMap.get(subKey);
        Factory factory = null;

        // 这里是一个死循环
        while (true) {
            // 第一次进来的时候supplier可能为null
            // 在下边的处理，当supplier为null时，就将刚创建的factory赋值给supplier
            if (supplier != null) {
                // supplier might be a Factory or a CacheValue<V> instance
                // 调用supplier的get()方法获取代理类，supplier本质就是一个Factory
                V value = supplier.get();
                // 获取到代理类并退出死循环
                if (value != null) {
                    return value;
                }
            }
            // else no supplier in cache
            // or a supplier that returned null (could be a cleared CacheValue
            // or a Factory that wasn't successful in installing the CacheValue)

            // lazily construct a Factory
            // 第一次进来的时候factory为null，此时就创建一个factory实例出来
            if (factory == null) {
                factory = new Factory(key, parameter, subKey, valuesMap);
            }

            if (supplier == null) {
                supplier = valuesMap.putIfAbsent(subKey, factory);
                // 当supplier为null时，就将刚创建的factory赋值给supplier
                if (supplier == null) {
                    // successfully installed Factory
                    supplier = factory;
                }
                // else retry with winning supplier
            } else {
                if (valuesMap.replace(subKey, supplier, factory)) {
                    // successfully replaced
                    // cleared CacheEntry / unsuccessful Factory
                    // with our Factory
                    supplier = factory;
                } else {
                    // retry with current supplier
                    supplier = valuesMap.get(subKey);
                }
            }
        }
    }
```

通过上边的代码，可以看到，这里的核心逻辑其实就是一个while (true)死循环

我们简单来分析一下，首先第一次进来的时候supplier可能为null，如果supplier为null，就会执行下边这块代码：

```java
			// lazily construct a Factory
            // 第一次进来的时候factory为null，此时就创建一个factory实例出来
            if (factory == null) {
                factory = new Factory(key, parameter, subKey, valuesMap);
            }

            if (supplier == null) {
                supplier = valuesMap.putIfAbsent(subKey, factory);
                // 当supplier为null时，就将刚创建的factory赋值给supplier
                if (supplier == null) {
                    // successfully installed Factory
                    supplier = factory;
                }
                // else retry with winning supplier
            } else {
                // 省略部分代码
            }
```

其实第一次循环的时候，这个factory肯定是个null，此时就会执行factory = new Factory(key, parameter, subKey, valuesMap)这行代码来创建一个factory实例出来。由于此时supplier也为null，那么就会执行supplier = factory这行代码，说白了就是将刚创建的factory对象赋值给supplier，接着开始第二轮循环。

而在第二轮循环中supplier就不为null了，那么此时就会执行下边这块代码：

```java
			if (supplier != null) {
                // supplier might be a Factory or a CacheValue<V> instance
                // 调用supplier的get()方法获取代理类，supplier本质就是一个Factory
                V value = supplier.get();
                // 获取到代理类并退出死循环
                if (value != null) {
                    return value;
                }
            }
```

通过上边的代码，大家可以看到，其实核心就是会执行V value = supplier.get()这行代码，因为supplier本质就是一个Factory，所以其实这里就是调用了Factory的get()方法来获取代理类，如果正常获取到了代理类，那么就会直接将这个代理类作为出参返回，此时while (true)死循环就结束了。

分析到这里，我们就知道了，获取代理类的核心逻辑是在Factory的get()方法中，那么此时我们就继续深入，其实就是来看下Factory的get()方法，此时我们会看到下面的代码

代码所在类的全限定类名：java.lang.reflect.WeakCache.Factory#get

```java
    // 在前边通过new KeyFactory()进行的赋值
	private final BiFunction<K, P, ?> subKeyFactory;
	// 在前边通过new ProxyClassFactory()进行的赋值
    private final BiFunction<K, P, V> valueFactory;

	// WeakCache类的构造方法
    public WeakCache(BiFunction<K, P, ?> subKeyFactory,
                     BiFunction<K, P, V> valueFactory) {
        this.subKeyFactory = Objects.requireNonNull(subKeyFactory);
        this.valueFactory = Objects.requireNonNull(valueFactory);
    }


	/**
     * A factory {@link Supplier} that implements the lazy synchronized
     * construction of the value and installment of it into the cache.
     */
	// Factory是WeakCache类中的一个内部类
    private final class Factory implements Supplier<V> {
        // 省略部分代码
        
        @Override
        public synchronized V get() { // serialize access
            // 省略部分代码

            // create new value
            V value = null;
            try {
                // 这个valueFactory是外部类WeakCache中的一个属性，是通过构造方法赋值的
                // 具体是在Proxy类中使用new WeakCache<>(new KeyFactory(), new ProxyClassFactory())进行构造的
                // 因此这个valueFactory其实就是ProxyClassFactory类的一个实例
                value = Objects.requireNonNull(valueFactory.apply(key, parameter));
            } finally {
                if (value == null) { // remove us on failure
                    valuesMap.remove(subKey, this);
                }
            }
            // 省略部分代码
            return value;
        }
    }
```

通过上边的代码，我们可以看到，其实在这个get()方法中没啥核心逻辑，主要就是调用了valueFactory.apply(key, parameter)这行代码获取到了代理类，而这个valueFactory我们看着是不是有点眼熟？

对了，就是前边我们通过构造方法赋值的那个属性，这个valueFactory当时被赋值为了ProxyClassFactory类的一个实例！

到这里为止，虽然我们还没有看到真正的核心逻辑，也就是创建代理类的代码，不过感觉也快了，那我们继续往下看呗，此时我们打开ProxyClassFactory类的apply()方法，此时会看到下边的代码：

代码所在类的全限定类名：java.lang.reflect.Proxy.ProxyClassFactory

```java
/**
     * A factory function that generates, defines and returns the proxy class given
     * the ClassLoader and array of interfaces.
     */
    private static final class ProxyClassFactory
        implements BiFunction<ClassLoader, Class<?>[], Class<?>>
    {
        // prefix for all proxy class names
        // 代理类名称的前缀，拼接代理类名使用
        private static final String proxyClassNamePrefix = "$Proxy";

        // next number to use for generation of unique proxy class names
        // 代理类的计数器，用于生成代理类名称下一个唯一编号使用
        private static final AtomicLong nextUniqueNumber = new AtomicLong();

        @Override
        public Class<?> apply(ClassLoader loader, Class<?>[] interfaces) {

            Map<Class<?>, Boolean> interfaceSet = new IdentityHashMap<>(interfaces.length);
            // 对代理类接口的一些校验
            for (Class<?> intf : interfaces) {
                /*
                 * Verify that the class loader resolves the name of this
                 * interface to the same Class object.
                 */
                Class<?> interfaceClass = null;
                try {
                    interfaceClass = Class.forName(intf.getName(), false, loader);
                } catch (ClassNotFoundException e) {
                }
                if (interfaceClass != intf) {
                    throw new IllegalArgumentException(
                        intf + " is not visible from class loader");
                }
                /*
                 * Verify that the Class object actually represents an
                 * interface.
                 */
                if (!interfaceClass.isInterface()) {
                    throw new IllegalArgumentException(
                        interfaceClass.getName() + " is not an interface");
                }
                /*
                 * Verify that this interface is not a duplicate.
                 */
                if (interfaceSet.put(interfaceClass, Boolean.TRUE) != null) {
                    throw new IllegalArgumentException(
                        "repeated interface: " + interfaceClass.getName());
                }
            }

			// 代理类的包名，默认为空，会在下边进行赋值
            String proxyPkg = null;     // package to define proxy class in
            int accessFlags = Modifier.PUBLIC | Modifier.FINAL;

            /*
             * Record the package of a non-public proxy interface so that the
             * proxy class will be defined in the same package.  Verify that
             * all non-public proxy interfaces are in the same package.
             */
            // 赋值包名的一些逻辑
            for (Class<?> intf : interfaces) {
                int flags = intf.getModifiers();
                if (!Modifier.isPublic(flags)) {
                    accessFlags = Modifier.FINAL;
                    String name = intf.getName();
                    int n = name.lastIndexOf('.');
                    String pkg = ((n == -1) ? "" : name.substring(0, n + 1));
                    if (proxyPkg == null) {
                        proxyPkg = pkg;
                    } else if (!pkg.equals(proxyPkg)) {
                        throw new IllegalArgumentException(
                            "non-public interfaces from different packages");
                    }
                }
            }

			// 赋值包名
            if (proxyPkg == null) {
                // if no non-public proxy interfaces, use com.sun.proxy package
                // 如果代理接口都是public，那么代理类包名就会使用com.sun.proxy，也就是代理类会放在这个包下
                proxyPkg = ReflectUtil.PROXY_PACKAGE + ".";
            }

            /*
             * Choose a name for the proxy class to generate.
             */
            
            // 生成代理类名称的唯一编号，比如13
            long num = nextUniqueNumber.getAndIncrement();
            // 拼接代理类的类名，比如com.sun.proxy.$Proxy13
            String proxyName = proxyPkg + proxyClassNamePrefix + num;

            /*
             * Generate the specified proxy class.
             */
            // 生成指定的代理类，也就是生成代理类的字节码
            byte[] proxyClassFile = ProxyGenerator.generateProxyClass(
                proxyName, interfaces, accessFlags);
            try {
            	// 调用native方法将代理类加载到JVM中
                return defineClass0(loader, proxyName,
                                    proxyClassFile, 0, proxyClassFile.length);
            } catch (ClassFormatError e) {
                /*
                 * A ClassFormatError here means that (barring bugs in the
                 * proxy class generation code) there was some other
                 * invalid aspect of the arguments supplied to the proxy
                 * class creation (such as virtual machine limitations
                 * exceeded).
                 */
                throw new IllegalArgumentException(e.toString());
            }
        }
    }
```

大家可以看到，上边的代码就有意思多了，我们还是分开来看。

进入这个apply()方法后，我们会看到下边这块代码：

```java
			Map<Class<?>, Boolean> interfaceSet = new IdentityHashMap<>(interfaces.length);
            // 对代理类接口的一些校验
            for (Class<?> intf : interfaces) {
                /*
                 * Verify that the class loader resolves the name of this
                 * interface to the same Class object.
                 */
                Class<?> interfaceClass = null;
                try {
                    interfaceClass = Class.forName(intf.getName(), false, loader);
                } catch (ClassNotFoundException e) {
                }
                if (interfaceClass != intf) {
                    throw new IllegalArgumentException(
                        intf + " is not visible from class loader");
                }
                /*
                 * Verify that the Class object actually represents an
                 * interface.
                 */
                if (!interfaceClass.isInterface()) {
                    throw new IllegalArgumentException(
                        interfaceClass.getName() + " is not an interface");
                }
                /*
                 * Verify that this interface is not a duplicate.
                 */
                if (interfaceSet.put(interfaceClass, Boolean.TRUE) != null) {
                    throw new IllegalArgumentException(
                        "repeated interface: " + interfaceClass.getName());
                }
            }
```

上边这块代码，说白了就是对要代理的接口做了一些校验而已，具体是校验什么，这些不是重点，我们大概知道这块代码是做什么的就可以了

然后我们继续往下看，就会看到这么一块代码，如下：

```java
			// 代理类的包名，默认为空，会在下边进行赋值
            String proxyPkg = null;     // package to define proxy class in
            int accessFlags = Modifier.PUBLIC | Modifier.FINAL;

            /*
             * Record the package of a non-public proxy interface so that the
             * proxy class will be defined in the same package.  Verify that
             * all non-public proxy interfaces are in the same package.
             */
            // 赋值包名的一些逻辑
            for (Class<?> intf : interfaces) {
                int flags = intf.getModifiers();
                if (!Modifier.isPublic(flags)) {
                    accessFlags = Modifier.FINAL;
                    String name = intf.getName();
                    int n = name.lastIndexOf('.');
                    String pkg = ((n == -1) ? "" : name.substring(0, n + 1));
                    if (proxyPkg == null) {
                        proxyPkg = pkg;
                    } else if (!pkg.equals(proxyPkg)) {
                        throw new IllegalArgumentException(
                            "non-public interfaces from different packages");
                    }
                }
            }

			// 赋值包名
            if (proxyPkg == null) {
                // if no non-public proxy interfaces, use com.sun.proxy package
                // 如果代理接口都是public，那么代理类包名就会使用com.sun.proxy，也就是代理类会放在这个包下
                proxyPkg = ReflectUtil.PROXY_PACKAGE + ".";
            }
```

上边这块代码，其实就是为了给代理包名proxyPkg进行赋值，从注释上来看，就是如果代理接口都是public的话，那么就将代理包名proxyPkg赋值为ReflectUtil.PROXY_PACKAGE + "."，这个ReflectUtil.PROXY_PACKAGE变量的定义如下

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302161202447.png)

看到上边这个变量后，其实说白了这个代理包名proxyPkg会被赋值为“com.sun.proxy.”

这个时候我们会有疑惑，这里拼接的包名到底是干嘛使的呢？

目前为止我们还不知道，不过没事儿，我们接着往下看，随着我们了解的越来越多，那么最后我们就会将这些串成一条线，所以我们接着往下看，此时会看到这块代码：

```java
			// 生成代理类名称的唯一编号，比如13
            long num = nextUniqueNumber.getAndIncrement();
            // 拼接代理类的类名，比如com.sun.proxy.$Proxy13
            String proxyName = proxyPkg + proxyClassNamePrefix + num;
```

大家可以看到，上边代码首先会执行long num = nextUniqueNumber.getAndIncrement()来生成一个编号，接着执行String proxyName = proxyPkg + proxyClassNamePrefix + num这行代码拼接了一个类名，而拼接这个类名的时候就用到了刚才的那个包名proxyPkg，而这里最终拼接出来的是包名+类名的这么一个东西，说白了就是一个全限定类名。

那这个全限定类名到底是干嘛的呢？其实我们从这个变量名proxyName就可以猜出来了，其实这个proxyName就是即将要生成的代理类的类名。

那这个拼接出来的代理类类名到底长啥样呢？

这个简单，首先这个代理类的类名是由下边三部分拼接而成的，分别是：

- proxyPkg：如果代理接口都是public的，那么它的值为“com.sun.proxy.”
- proxyClassNamePrefix：它是一个static final类型的常量，在代码中可以看到它的值为“$Proxy”
- num：就是一个序列号，比如13

那么拼接起来这个代理类名就是“com.sun.proxy.$Proxy13”，看到这个，大家有没有觉得很亲切，似曾相识呢？

没错，大家平时在debug时，会经常看到一些代理对象，然后就会看到类似“com.sun.proxy.$Proxy13”的类名，代理类的类名其实就是这样拼接出来的！

好了，代理类的类名拼接好之后，那下一步是不是就要真正生成代理类了呢？我们继续往下看，此时会看到下边这行代码：

```java
			/*
             * Generate the specified proxy class.
             */
            // 生成指定的代理类，也就是生成代理类的字节码
            byte[] proxyClassFile = ProxyGenerator.generateProxyClass(
                proxyName, interfaces, accessFlags);
```

我们可以看到，此时就会执行ProxyGenerator.generateProxyClass(proxyName, interfaces, accessFlags)这行代码，通过方法名字我们可以知道这个方法就是用来生成代理类的！我们这里将生成的代理类名和要代理的接口作为入参传递进去，然后这个generateProxyClass()方法就会帮我们生成一个代理类，准确的说生成的是代理类的字节码。

好了，到这里为止，创建代理类的地方我们终于找到了，然后这个generateProxyClass()方法就会将创建好的代理类返回，最后还会调用一个defineClass0()方法将生成的代理类加载到JVM中，代码如下：

```java
				// 调用native方法将代理类加载到JVM中
                return defineClass0(loader, proxyName,
                                    proxyClassFile, 0, proxyClassFile.length);
```

那这个defineClass0()方法到底是何方神圣呢？其实defineClass0()方法的代码如下：

代码所在类的全限定类名：java.lang.reflect.Proxy#defineClass0

```java
    private static native Class<?> defineClass0(ClassLoader loader, String name,
                                                byte[] b, int off, int len);
```

通过上边的代码，我们可以看到这个defineClass0()方法其实就是一个native方法，也就是说将代理类加载到JVM这个过程是由native方法来完成的，至于这块的细节根本不需要我们关心。

好了，到这里为止，一旦将代理类加载到JVM中，那么我们就可以调用代理类的构造方法来创建代理对象了！最后，我们再回头看一眼本篇文章开头的java代码运行流程

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302161202956.png)

再回头看一眼后，相信你会有更深的体会

最后的最后，那当然是将创建好的动态代理对象给返回出去了，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302161202955.png)

到这里为止，我们就分析完了newProxyInstance()方法创建动态代理对象的全过程，此时我们就拿到了一个动态代理对象，然后我们就可以通过这个动态代理对象来实现我们的增强逻辑了。

---

# 总结

一张图来梳理下AOP代理的创建流程

![20230216131857](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302161319614.png)

上图是目前为止，我们分析的AOP代理创建流程的源码图，其中红色背景的部分就是我们今天新分析的内容。

我们来总结一下，今天我们主要分析了jdk动态代理对象创建的全过程，其中包括：

- 拼接代理类名、

- 生成代理类字节码、

- 将代理类加载到JVM、

- 获取代理类构造方法、

- 通过构造方法创建代理类实例等过程，

到这里为止，我们就成功拿到一个`jdk动态代理对象`了。

到这里为止，我们通过`getBean("productServiceImpl")`就获取到了一个jdk动态代理对象，为了方便，后边我们就将jdk动态代理对象简称为jdk代理对象吧，那么下一步就要开始使用这个jdk代理对象了，其实就是调用jdk代理对象中的方法。

那我们都知道，一旦我们调用jdk动态代理对象中的方法，就可以实现我们的增强逻辑了，说白了就是会调用到回调程序h的invoke()方法中。

那大家想过没？为啥一调用代理对象中的方法，请求就会被转发到回调程序InvocationHandler的invoke()方法中呢？这个又是啥原理？

别急，我们下篇文章就来揭晓。