---
title: 类加载子系统
order: 4
category:
  - JVM
date: 2023-02-26
---

<!-- more -->



# 1. 类加载子系统图示

## 1.1. 运行时数据区域

![image-20240226163958305](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202402/9829e34e62427071.png)

## 1.2. 类加载图示

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202207121359207.png" alt="image-20210615162944141" />

**注意**：方法区只有HotSpot虚拟机有，J9，JRockit都没有。

如果自己想手写一个Java虚拟机的话，主要考虑哪些结构呢？

1. 类加载器
2. 执行引擎

***

# 2. 类加载器子系统详解

## 2.1. 类加载器子系统作用

1. 类加载子系统负责从文件系统或网络中加载class文件，class文件在开头有特定的文件标识。
2. ClassLoader只负责class文件的加载，至于它是否可以运行，则由（Execution Engine执行引擎）决定。
3. 加载的类信息存放在方法区的内存空间，方法区中还可能存放运行时常量池信息，可能还包括`字符串`、`字面量`和`数字常量`（这部分常量信息是Class文件中常量池部分的内存映射）。



## 2.2. 类加载器ClassLoader角色

1. Class File (下图中的Car.class)存在于本地硬盘上，可以理解为设计师画在纸上的模板，而最终这个模板在执行的时候是要加载到JVM当中来根据这个文件实例化出n个一模一样的实例。

2. Class File 加载到JVM中，被称为DNA元数据模板（在下图中就是内存中的Car Class），放在方法区。

3. 在.class文件–>JVM–>最终成为元数据模板，此过程就要一个运输工具（类装载器ClassLoader），扮演一个快递员的角色。

   <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202207121359208.png" alt="image-20210615165053099"  />



## 2.3. 类加载过程

过程如图所示：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202207121359209.png" alt="image-20210615165155881" />

### 2.3.1. 加载

- 通过一个类的全限定名获取定义此类的二进制字节流；
- 将这个字节流所代表的静态存储结构转化为方法区的运行时数据；
- 在内存中生成一个代表这个类的java.lang.Class文件，作为方法区这个类的各种数据的访问入口。

### 2.3.2. 链接

1. **验证**

   目的在于确保class文件的字节流信息符合当前虚拟机要求，保证被加载类的正确性，不会危害虚拟机自身安全。

   - 主要包含四种验证：文件格式验证、源数据验证、字节码验证、符号引用验证。

2. 准备

   - 为类变量分配内存并且设置该类变量的默认初始值，即零值；
   - 这里不包含用final修饰的static变量，因为final在编译的时候就会分配了，准备阶段会显式初始化；
   - **注意**：不会为实例变量分配初始化，类变量会分配在方法中，而实例变量是会随着对象一起分配到java堆中。

   代码示例：

   ```java
   public class HelloApp {
       //prepare：a = 0 ---> initial : a = 1
       private static int a = 1;
   
       public static void main(String[] args) {
           System.out.println(a);
       }
   }
   ```

   变量a在准备阶段会赋初始值，但不是1，而是0，在初始化阶段会被赋值为 1。

3. **解析**

   将常量池中内的符号引用转换为直接引用的过程。

   - 事实上，解析操作往往会伴随着JVM在执行完初始化之后再执行。
   - **符号引用**就是一组符号来描述所引用的目标。符号引用的字面量形式明确定义在《java虚拟机规范》的class文件格式中。**直接引用**就是直接指向目标的指针、相对偏移量或一个间接定位到目标的句柄。
   - 解析动作主要针对类或接口、字段、类方法、接口方法、方法类型等。对应常量池中的CONSTANT Class info、CONSTANT Fieldref info、CONSTANT Methodref info等。

   **符号引用**

   反编译 class 文件后可以查看符号引用，下面带# 的就是符号引用：

   <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202207121359210.png" alt="image-20210615172149938"  />

### 2.3.3. 初始化

- 初始化阶段就是执行构造器方法()的过程。
- 此方法不需要定义，是javac编译器自动收集类中的所有**类变量**的赋值操作和静态代码块中的语句合并而来。**也就是说,当我们代码中包含static变量的时候，就会有clinit方法**。
- clinit()方法中的指令按语句在源文件中出现的顺序执行。
- clinit()方法不同于类的构造器。（关联：构造器是虚拟机视角下的方法）
- 若该类具有父类，JVM会保证子类的()执行前，父类的clinit()方法已经执行完毕。
- 虚拟机必须保证一个类的clinit()方法在多线程下被同步加锁。

**举例**

附：IDEA 中安装 JClassLib Bytecode viewer 插件，可以很方便的看字节码。

1. 有static变量

   ```java
   public class ClassInitTest {
      private static int num = 1;
   
      static{
          num = 2;
          number = 20;
          System.out.println(num);
          //System.out.println(number);//报错：非法的前向引用。
      }
   
      /**
       * 1、linking之prepare: number = 0 --> initial: 20 --> 10
       * 2、这里因为静态代码块出现在声明变量语句前面，所以之前被准备阶段为0的number变量会
       * 首先被初始化为20，再接着被初始化成10（这也是面试时常考的问题哦）
       *
       */
      private static int number = 10;
   
       public static void main(String[] args) {
           System.out.println(ClassInitTest.num);//2
           System.out.println(ClassInitTest.number);//10
       }
   }
   ```

   查看下面这个代码的字节码，可以发现有一个`<clinit>()`方法。

   <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202207121359211.png" alt="image-20210615172636769" />

2. 无 static 变量

   <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202207121359212.png" alt="image-20210615172723131"  />

   加上之后就有了：

   ![image-20210615172745499](https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202207121359213.png)

   **说明**：

   (1) 在构造器中：

   - 先将类变量 a 赋值为 10
   - 再将局部变量赋值为 20

   <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202207121359214.png" alt="image-20210615172819801"  />

   (2) 若该类具有父类，JVM会保证子类的`<clinit>()`执行前，父类的`<clinit>()`已经执行完毕。

   ![image-20210615172845638](https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202207121359215.png)

   如上代码，加载流程如下：

   - 首先，执行 main() 方法需要加载 ClinitTest1 类
   - 获取 Son.B 静态变量，需要加载 Son 类
   - Son 类的父类是 Father 类，所以需要先执行 Father 类的加载，再执行 Son 类的加载。

   (3) 虚拟机必须保证一个类的`<clinit>()`方法在多线程下被同步加锁。

   ​	

   ```java
   public class DeadThreadTest {
       public static void main(String[] args) {
           Runnable r = () -> {
               System.out.println(Thread.currentThread().getName() + "开始");
               DeadThread dead = new DeadThread();
               System.out.println(Thread.currentThread().getName() + "结束");
           };
   
           Thread t1 = new Thread(r,"线程1");
           Thread t2 = new Thread(r,"线程2");
   
           t1.start();
           t2.start();
       }
   }
   
   class DeadThread{
       static{
           if(true){
               System.out.println(Thread.currentThread().getName() + "初始化当前类");
               while(true){
   
               }
           }
       }
   }
   ```

   输出结果：

   ```
   线程2开始
   线程1开始
   线程2初始化当前类
   
   /然后程序卡死了
   ```

   程序卡死，分析原因：

   - 两个线程同时去加载 DeadThread 类，而 DeadThread 类中静态代码块中有一处死循环。
   - 先加载 DeadThread 类的线程抢到了同步锁，然后在类的静态代码块中执行死循环，而另一个线程在等待同步锁的释放。
   - 所以无论哪个线程先执行 DeadThread 类的加载，另外一个类也不会继续执行。（一个类只会被加载一次）。



***

# 3. 类加载器的分类

## 3.1. 概述

- JVM严格来讲支持两种类型的类加载器。分别为`引导类加载器（Boostrap ClassLoader）`和`自定义类加载器(User-Defined ClassLoader)`。

- 从概念上来讲，自定义类加载器一般指的是程序中由开发人员自定义的一类类加载器，但是Java虚拟机规范却没有这么定义，而是**将所有派生于抽象类ClassLoader的类加载器都划分为自定义类加载器**。

- 无论类加载器的类型如何划分，在程序中我们最常见的类加载器始终只有3个，如下所示：

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202207121359216.png" alt="image-20210617142309166"  />

  这里的四者之间是包含关系，不是上层和下层，也不是子系统的继承关系。 而是通常使用组合（Composition） 关系来复用父加载器的代码。  

  
  
  通过一个类，获取他的不同类加载器：
  
  ```java
  public class ClassLoaderTest {
      public static void main(String[] args) {
  
          //获取系统类加载器
          ClassLoader systemClassLoader = ClassLoader.getSystemClassLoader();
          System.out.println(systemClassLoader);//sun.misc.Launcher$AppClassLoader@18b4aac2
  
          //获取其上层：扩展类加载器
          ClassLoader extClassLoader = systemClassLoader.getParent();
          System.out.println(extClassLoader);//sun.misc.Launcher$ExtClassLoader@1540e19d
  
          //获取其上层：获取不到引导类加载器
          ClassLoader bootstrapClassLoader = extClassLoader.getParent();
          System.out.println(bootstrapClassLoader);//null
  
          //对于用户自定义类来说：默认使用系统类加载器进行加载
          ClassLoader classLoader = ClassLoaderTest.class.getClassLoader();
          System.out.println(classLoader);//sun.misc.Launcher$AppClassLoader@18b4aac2
  
          //String类使用引导类加载器进行加载的。---> Java的核心类库都是使用引导类加载器进行加载的。
          ClassLoader classLoader1 = String.class.getClassLoader();
          System.out.println(classLoader1);//null
  
      }
  }
  ```
  
  - 我们尝试获取引导类加载器，获取到的值为 null ，这并不代表引导类加载器不存在，**因为引导类加载器右 C/C++ 语言，我们获取不到**。
  - 两次获取系统类加载器的值都相同：sun.misc.Launcher$AppClassLoader@18b4aac2 ，这说明**系统类加载器是全局唯一的**。
  - 对于用户自定义类来说：使用系统类加载器AppClassLoader进行加载。
  - java核心类库都是使用引导类加载器BootStrapClassLoader加载的。



## 3.2. 虚拟机自带的加载器

### 3.2.1. 启动类加载器（引导类加载器，Bootstrap ClassLoader）

**概述**

1. 这个类加载使用C/C++语言实现的，嵌套在JVM内部。
2. 它用来加载Java的核心库（JAVA_HOME/jre/lib/rt.jar、resources.jar或sun.boot.class.path路径下的内容），用于提供JVM自身需要的类。
3. 并不继承自java.lang.ClassLoader，没有父加载器。
4. 加载扩展类和应用程序类加载器，并作为他们的父类加载器。
5. 出于安全考虑，Bootstrap启动类加载器只加载包名为java、javax、sun等开头的类。



### 3.2.2. 扩展类加载器（Extension ClassLoader）

**概述**

1. Java语言编写，由sun.misc.Launcher$ExtClassLoader实现。
2. 派生于ClassLoader类。
3. 父类加载器为启动类加载器。
4. 从java.ext.dirs系统属性所指定的目录中加载类库，或从JDK的安装目录的jre/lib/ext子目录（扩展目录）下加载类库。如果用户创建的JAR放在此目录下，也会自动由扩展类加载器加载。



### 3.2.3. 应用程序类加载器（也称为系统类加载器，AppClassLoader）

**概述**

1. Java语言编写，由sun.misc.LaunchersAppClassLoader实现。
2. 派生于ClassLoader类。
3. 父类加载器为扩展类加载器。
4. 它负责加载环境变量classpath或系统属性java.class.path指定路径下的类库。
5. **该类加载是程序中默认的类加载器，一般来说，Java应用的类都是由它来完成加载**。
6. 通过classLoader.getSystemclassLoader()方法可以获取到该类加载器。

```java
public class ClassLoaderTest1 {
    public static void main(String[] args) {
        System.out.println("**********启动类加载器**************");
        //获取BootstrapClassLoader能够加载的api的路径
        URL[] urLs = sun.misc.Launcher.getBootstrapClassPath().getURLs();
        for (URL element : urLs) {
            System.out.println(element.toExternalForm());
        }
        //从上面的路径中随意选择一个类,来看看他的类加载器是什么:引导类加载器
        ClassLoader classLoader = Provider.class.getClassLoader();
        System.out.println(classLoader);

        System.out.println("***********扩展类加载器*************");
        String extDirs = System.getProperty("java.ext.dirs");
        for (String path : extDirs.split(";")) {
            System.out.println(path);
        }

        //从上面的路径中随意选择一个类,来看看他的类加载器是什么:扩展类加载器
        ClassLoader classLoader1 = CurveDB.class.getClassLoader();
        System.out.println(classLoader1);//sun.misc.Launcher$ExtClassLoader@1540e19d

    }
}
```

**输出结果**

```
**********启动类加载器**************
file:/D:/app/Java/jdk1.8.0_151/jre/lib/resources.jar
file:/D:/app/Java/jdk1.8.0_151/jre/lib/rt.jar
file:/D:/app/Java/jdk1.8.0_151/jre/lib/sunrsasign.jar
file:/D:/app/Java/jdk1.8.0_151/jre/lib/jsse.jar
file:/D:/app/Java/jdk1.8.0_151/jre/lib/jce.jar
file:/D:/app/Java/jdk1.8.0_151/jre/lib/charsets.jar
file:/D:/app/Java/jdk1.8.0_151/jre/lib/jfr.jar
file:/D:/app/Java/jdk1.8.0_151/jre/classes
null
***********扩展类加载器*************
D:\app\Java\jdk1.8.0_151\jre\lib\ext
C:\Windows\Sun\Java\lib\ext
sun.misc.Launcher$ExtClassLoader@6e0be858

Process finished with exit code 0
```



## 3.3. 用户自定义类加载器

### 3.3.1. 什么时候需要自定义类加载器？

在Java的日常应用程序开发中，类的加载几乎是由上述3种类加载器相互配合执行的，在必要时，我们还可以自定义类加载器，来定制类的加载方式。那为什么还需要自定义类加载器？

1. 隔离加载类（比如说我假设现在Spring框架，和RocketMQ有包名路径完全一样的类，类名也一样，这个时候类就冲突了。不过一般的主流框架和中间件都会自定义类加载器，实现不同的框架，中间件之间是隔离的）。
2. 修改类加载的方式。
3. 扩展加载源（还可以考虑从数据库中加载类，路由器等等不同的地方）。
4. 防止源码泄漏（对字节码文件进行解密，自己用的时候通过自定义类加载器来对其进行解密）。



### 3.3.2. 如何自定义类加载器？

1. 开发人员可以通过继承抽象类java.lang.ClassLoader类的方式，实现自己的类加载器，以满足一些特殊的需求
2. 在JDK1.2之前，在自定义类加载器时，总会去继承ClassLoader类并重写loadClass()方法，从而实现自定义的类加载类，但是在JDK1.2之后已不再建议用户去覆盖loadClass()方法，而是建议把自定义的类加载逻辑写在findclass()方法中
3. 在编写自定义类加载器时，如果没有太过于复杂的需求，可以直接继承URIClassLoader类，这样就可以避免自己去编写findclass()方法及其获取字节码流的方式，使自定义类加载器编写更加简洁。

**代码示例**

```java
public class CustomClassLoader extends ClassLoader {
    @Override
    protected Class<?> findClass(String name) throws ClassNotFoundException {

        try {
            byte[] result = getClassFromCustomPath(name);
            if (result == null) {
                throw new FileNotFoundException();
            } else {
                //defineClass和findClass搭配使用
                return defineClass(name, result, 0, result.length);
            }
        } catch (FileNotFoundException e) {
            e.printStackTrace();
        }

        throw new ClassNotFoundException(name);
    }
    //自定义流的获取方式
    private byte[] getClassFromCustomPath(String name) {
        //从自定义路径中加载指定类:细节略
        //如果指定路径的字节码文件进行了加密，则需要在此方法中进行解密操作。
        return null;
    }

    public static void main(String[] args) {
        CustomClassLoader customClassLoader = new CustomClassLoader();
        try {
            Class<?> clazz = Class.forName("One", true, customClassLoader);
            Object obj = clazz.newInstance();
            System.out.println(obj.getClass().getClassLoader());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```



### 3.3.3. 关于ClassLoader

**ClassLoader 类介绍**

- ClassLoader类，它是一个抽象类，其后所有的类加载器都继承自ClassLoader（不包括启动类加载器）。

  | 方法名称                                          | 描述                                                         |
  | ------------------------------------------------- | ------------------------------------------------------------ |
  | getParent()                                       | 返回该类加载器的超类加载器                                   |
  | loadClass(String name)                            | 加载名称为name的类，返回结果为java.lang.Class类的实例        |
  | findClass(String name)                            | 查找名称为name的类，返回结果为java.lang.Class类的实例        |
  | findLoadedClass(String name)                      | 查找名称为name的已经被加载过类，返回结果为java.lang.Class类的实例 |
  | defineClass(String name,byte[] b,int off,int len) | 把字节数组b中的内容转为一个Java类，返回结果为java.lang.Class类的实例 |
  | resolveClass(Class<?> c)                          | 连接指定的一个Java类                                         |

  

- sun.misc.Launcher 它是一个java虚拟机的入口应用。

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202207121359217.png" alt="image-20210617140543772"  />



### 3.3.4. 获取ClassLoader途径

通过以下四种方式获取：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202207121359218.png" alt="image-20210615174409258" />

代码示例：

```java
public class ClassLoaderTest2 {
    public static void main(String[] args) {
        try {
            //1.获取String类的ClassLoader
            ClassLoader classLoader = Class.forName("java.lang.String").getClassLoader();
            System.out.println(classLoader);
            //2.获取当前线程上下文的ClassLoader
            ClassLoader classLoader1 = Thread.currentThread().getContextClassLoader();
            System.out.println(classLoader1);

            //3.获取系统的ClassLoader的上级ExtClassLoader
            ClassLoader classLoader2 = ClassLoader.getSystemClassLoader().getParent();
            System.out.println(classLoader2);

        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        }
    }
}
```

输出结果：

```
null
sun.misc.Launcher$AppClassLoader@18b4aac2
sun.misc.Launcher$ExtClassLoader@14ae5a5
```



***

# 4. 双亲委派机制

## 4.1. 双亲委派机制原理

Java虚拟机对class文件采用的是**按需加载**的方式，也就是说当需要使用该类时才会将它的class文件加载到内存生成class对象。而且加载某个类的class文件时，Java虚拟机采用的是双亲委派模式，即把请求交由父类处理，它是一种任务委派模式。

- 如果一个类加载器收到了类加载请求，它并不会自己先去加载，而是把这个请求委托给父类的加载器去执行；

- 如果父类加载器还存在其他父类加载器，则进一步向上委托，依次递归，请求最终将到达顶层的启动类加载器；

- 如果父类加载器可以完成类加载任务，就成功返回，倘若父类加载器无法完成此加载任务，子类加载器才会尝试自己去加载，这就是双亲委派模式；

- 父类加载器一层一层往下分配任务，如果子类加载器能加载，则加载此类，如果将加载任务分配至系统类加载器也无法加载此类，则抛出异常！

- 流程如图所示：

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202207121359219.png" alt="image-20210819002158636"  />



## 4.2. 双亲委派机制代码演示

### 4.2.1. 举例1

（1）我们自己建立一个 java.lang.String 类，写上 static 代码块:

```java
package java.lang;
public class String {
    
    static{
        System.out.println("我是自定义的String类的静态代码块");
    }
}
```

（2）在另外的程序中加载 String 类，看看加载的 String 类是 JDK 自带的 String 类，还是我们自己编写的 String 类：

```java
package java.lang;
public class StringTest {

    public static void main(String[] args) {
        java.lang.String str = new java.lang.String();
        System.out.println("hello,atguigu.com");

        StringTest test = new StringTest();
        System.out.println(test.getClass().getClassLoader());
    }
}
```

输出结果：

```
hello,atguigu.com
sun.misc.Launcher$AppClassLoader@18b4aac2
```

程序并没有输出我们静态代码块中的内容，可见仍然加载的是 JDK 自带的 String 类。

把刚刚的类改一下：

```java
package java.lang;
public class String {
    //
    static{
        System.out.println("我是自定义的String类的静态代码块");
    }
    //错误: 在类 java.lang.String 中找不到 main 方法
    public static void main(String[] args) {
        System.out.println("hello,String");
  }
```

输出结果：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202207121359220.png" alt="image-20210615175213273" />

由于双亲委派机制一直找父类，所以最后找到了Bootstrap ClassLoader，Bootstrap ClassLoader找到的是 JDK 自带的 String 类，在那个String类中并没有 main() 方法，所以就报了上面的错误。



### 4.2.2. 举例2

```java
package java.lang;
public class ShkStart {

    public static void main(String[] args) {
        System.out.println("hello!");
    }
}
```

输出结果：

```
java.lang.SecurityException: Prohibited package name: java.lang
    at java.lang.ClassLoader.preDefineClass(ClassLoader.java:662)
    at java.lang.ClassLoader.defineClass(ClassLoader.java:761)
    at java.security.SecureClassLoader.defineClass(SecureClassLoader.java:142)
    at java.net.URLClassLoader.defineClass(URLClassLoader.java:467)
    at java.net.URLClassLoader.access$100(URLClassLoader.java:73)
    at java.net.URLClassLoader$1.run(URLClassLoader.java:368)
    at java.net.URLClassLoader$1.run(URLClassLoader.java:362)
    at java.security.AccessController.doPrivileged(Native Method)
    at java.net.URLClassLoader.findClass(URLClassLoader.java:361)
    at java.lang.ClassLoader.loadClass(ClassLoader.java:424)
    at sun.misc.Launcher$AppClassLoader.loadClass(Launcher.java:335)
    at java.lang.ClassLoader.loadClass(ClassLoader.java:357)
    at sun.launcher.LauncherHelper.checkAndLoadMain(LauncherHelper.java:495)
Error: A JNI error has occurred, please check your installation and try again
Exception in thread "main" 
Process finished with exit code 1
```

即使类名没有重复，也禁止使用java.lang这种包名。这是一种保护机制。



### 4.2.3. 举例3

当我们加载jdbc.jar 用于实现数据库连接的时候

1. 我们现在程序中需要用到SPI接口，而SPI接口属于rt.jar包中Java核心api

2. 然后使用双清委派机制，引导类加载器把rt.jar包加载进来，而rt.jar包中的SPI存在一些接口，接口我们就需要具体的实现类了

3. 具体的实现类就涉及到了某些第三方的jar包了，比如我们加载SPI的实现类jdbc.jar包【首先我们需要知道的是 jdbc.jar是基于SPI接口进行实现的】

4. 第三方的jar包中的类属于系统类加载器来加载

5. 从这里面就可以看到SPI核心接口由引导类加载器来加载，SPI具体实现类由系统类加载器来加载。

   <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202207121359221.png" alt="image-20210615175434066"  />



## 4.3. 双亲委派机制优势

通过上面的例子，我们可以知道，双亲机制可以：

1. 避免类的重复加载
2. 保护程序安全，防止核心API被随意篡改：
   - 自定义类：自定义java.lang.String 没有被加载
   - 自定义类：java.lang.ShkStart（报错：阻止创建 java.lang开头的类）



## 4.4. 沙箱安全机制

1. 自定义String类时：在加载自定义String类的时候会率先使用引导类加载器加载，而引导类加载器在加载的过程中会先加载jdk自带的文件（rt.jar包中java.lang.String.class），报错信息说没有main方法，就是因为加载的是rt.jar包中的String类。
2. 这样可以保证对java核心源代码的保护，这就是沙箱安全机制。



## 4.5. 其他

### 4.5.1. 如何判断两个class对象是否相同？

在JVM中表示两个class对象是否为同一个类存在两个必要条件：

1. 类的完整类名必须一致，包括包名。
2. **加载这个类的ClassLoader（指ClassLoader实例对象）必须相同**。
3. 换句话说，在JVM中，即使这两个类对象（class对象）来源同一个Class文件，被同一个虚拟机所加载，但只要加载它们的ClassLoader实例对象不同，那么这两个类对象也是不相等的。

### 4.5.2. 对类加载器的引用

1. JVM必须知道一个类型是由启动加载器加载的还是由用户类加载器加载的。
2. **如果一个类型是由用户类加载器加载的，那么JVM会将这个类加载器的一个引用作为类型信息的一部分保存在方法区中**。
3. 当解析一个类型到另一个类型的引用的时候，JVM需要保证这两个类型的类加载器是相同的。

---

# 5. 字节码文件解析

## 5.1. 开篇

### 5.1.1. 字节码文件的跨平台性

**1、Java语言：跨平台的语言(write once，run anywhere)**

- 当Java源代码成功编译成字节码后，如果想在不同的平台上面运行，则无须再次编译。
- 这个优势不再那么吸引人了。Python、PHP、Per1、Ruby、Lisp等有强大的解释器。
- 跨平台似乎已经快成为一门语言必选的特性。

**2、Java 虚拟机：跨语言的平台**

Java 虚拟机不和包括 Java 在内的任何语言绑定，它只与“class 文件”这种特定的二进制文件格式所关联。无论使用何种语言进行软件开发，只要能将源文件编译为正确的c1ass文件，那么这种语言就可以在Java虚拟机上执行。可以说，统一而强大的Class文件结构，就是Java虚拟机的基石、桥梁。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202402/5c6266f07bb8e827.png)

https://docs.oracle.com/javase/specs/index.html

所有的JVM全部遵守]ava虚拟机规范，也就是说所有的JVM环境都是一样的，这样一来字节码文件可以在各种JVM上运行。

**3、要想要让一个]ava程序正确地运行在JVM中，Java源码就必须要被编译为符合JVM规范的字节码。**

- 前端编译器的主要任务就是负责将符合]ava语法规范的Java代码转换为符合JVM规范的字节码文件。
- javac是一种能够将Java源码编译为字节码的前端编译器。
- Javac编译器在将]ava源码编译为一个有效的字节码文件过程中经历了4个步骤，分别是：
  - 词法解析
  - 语法解析
  - 语义解析
  - 生成字节码

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202402/03213e17095e3868.png)

Oracle的JDK软件包括两部分内容:

- 一部分是将Java源代码编译成Java虚拟机的指令集的编译器
- 另一部分是用于实现Java虚拟机的运行时环境。

### 5.1.2. Java的前端编译器

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202402/f1ae743b1a131d3f.png)

> **前端编译器 vs 后端编译器**

Java源代码的编译结果是字节码，那么肯定需要有一种编译器能够将]ava源码编译为字节码，承担这个重要责任的就是配置在path环境变量中的javac编译器。javac是一种能够将]ava源码编译为字节码的**前端编译器**。

Hotspot 并没有强制要求前端编译器只能使用javac来编译字节码，其实只要编译结果符合JVM规范都可以被JVM所识别即可。在]ava的前端编译器领域，除了javac之外，还有一种被大家经常用到的前端编译器，那就是内置在Ec1ipse中的ECJ(Ec1ipseCompiler for Java)编译器。和javac的全量式编译不同，ECJ是一种增量式编译器。

- 在Ec1ipse中，当开发人员编写完代码后，使用“ctr1+s”快捷键时，ECJ编译器所采取的编译方案是把未编译部分的源码逐行进行编译，而非每次都全量编译。因此ECJ的编译效率会比javac更加迅速和高效，当然编译质量和javac相比大致还是一样的。
- ECJ不仅是Ec1ipse的默认内置前端编译器，在Tomcat中同样也是使用ECJ编译器来编译jsp文件。由于ECJ编译器是采用GPLv2的开源协议进行源代码公开，所以，大家可以登录eclipse官网下载ECJ编译器的源码进行二次开发。
- 默认情况下，Intelli] IDEA 使用 javac 编译器。(还可以自己设置为Aspectj编译器 ajc)

前端编译器并不会直接涉及编译优化等方面的技术，而是将这些具体优化细节移交给HotSpot的JIT编译器负责。

复习:AOT(静态提前编译器，Ahead Of Time compiler)

### 5.1.3. 如何解读二进制字节码

如何解读供虚拟机解释执行的二进制字节码？最原始二进制形式和可视化客户端工具！

**方式一：Notepad++（最原始）**

一个一个二进制的看。这里用到的是Notepad++（下载最新版本为好，否则用HEX-Editor插件打开.class文件闪退），需要安装一个HEX-Editor插件，或者使用Binary Viewer

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202402/bfd3c92106747daa.png)

**方式二：使用javap指令**

jdk自带的反解析工具

**方式三：IDEA插件jclasslib bytecode viewer**

使用方式：编写完代码进行build，然后选择“view”->“Show Bytecode With Jclasslib”

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202402/5b770c4192d24e3b.png)

**方式四：Binary Viewer**

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202402/70164af4c9c3c539.png)

**方式五：jclasslib 或jclasslib bytecode viewer客户端工具(可视化更好)。**

### 5.1.4. 透过字节码指令看代码细节

> IDEA 中安装 JClassLib Bytecode viewer 插件，可以很方便的看字节码。

①类文件结构有几个部分?

② 知道字节码吗?字节码都有哪些?Integer x= 5; int y=5; 比较 x == y 都经过哪些步骤?

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202402/b4118476b510c4d7.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202402/d7ead31d0997afec.png)

代码举例三：

```java
package com.gyz.interview.jvm;

public class Test3 {
    public static void main(String[] args) {
        Father f = new Son();
        System.out.println(f.x);
    }
}

class Father {
    int x = 10;

    public Father() {
        this.print();
        x = 20;
    }

    public void print() {
        System.out.println("Father.x = " + x);
    }
}

class Son extends Father {
    int x = 30;

    public Son() {
        this.print();
        x = 40;
    }

    @Override
    public void print() {
        System.out.println("Son.x = " + x);
    }
}
```

输出结果：

```
Son.x = 0
Son.x = 30
20
```

## 5.2. Class文件概述

> 官方文档位置：https://docs.oracle.com/javase/specs/jvms/se8/html/jvms-4.html

> **Class 类的本质**

任何一个class文件都对应着唯一一个类或接口的定义信息，但反过来说，class文件实际上它并不一定以磁盘文件的形式存在。Class 文件是一组以8位字节为基础单位的**二进制流**。

> **Class文件格式**

Class 的结构不像 XML等描述语言，由于它没有任何分隔符号。所以在其中的数据项，无论是字节顺序还是数量，都是被严格限定的，哪个字节代表什么含义，长度是多少，先后顺如何，都不允许改变。

Class 文件格式采用一种类似于 C语言结构体的方式进行数据存储，这种结构中只有两种数据类型：**无符号数**和**表**。

- 无符号数属于基本的数据类型，以 u1、u2、u4、u8 来分别代表 1 个字节、2个字节、4 个字节和 8 个字节的无符号数，无符号数可以用来描述数字、索引引用、数量值或者按照 UTF-8 编码构成字符串值。
- 表是由多个无符号数或者其他表作为数据项构成的复合数据类型，所有表都习惯性地以“_info”结尾。表用于描述有层次关系的复合结构的数据，整个 class 文件本质上就是一张表。 由于表没有固定长度，所以通常会在其前面加上个数说明。

> **代码举例**

```java
public class Demo {
    private int num = 1;

    public int add() {
        num = num + 2;
        return num;
    }
}
```

对应的字节码文件（记住这个文件，在后续分析Class文件结构时用得上）：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202402/dbce3d7aa726b55a.png)

**换句话说，充分理解了每一个字节码文件的细节，自己也可以反编译出Java源文件来。**

> **字节码文件里是什么?**

源代码经过编译器编译之后便会生成一个字节码文件，字节码是一种二进制的类文件，它的内容是JVM的指令，而不像C、C++经由编译器直接生成机器码。

> **什么是字节码指令(byte code)?**

Java虚拟机的指令由一个字节长度的、代表着某种特定操作含义的**操作码**(opcode)以及跟随其后的零至多个代表此操作所需参数的**操作数**(operand)所构成。虚拟机中许多指令并不包含操作数，只有一个操作码。比如:

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202402/12cabb372dff17d2.png)

## 5.3. Class文件结构

> [官方文档描述如下：](https://docs.oracle.com/javase/specs/jvms/se8/html/jvms-4.html)

A `class` file consists of a single `ClassFile` structure:

```
ClassFile {
    u4             magic;
    u2             minor_version;
    u2             major_version;
    u2             constant_pool_count;
    cp_info        constant_pool[constant_pool_count-1];
    u2             access_flags;
    u2             this_class;
    u2             super_class;
    u2             interfaces_count;
    u2             interfaces[interfaces_count];
    u2             fields_count;
    field_info     fields[fields_count];
    u2             methods_count;
    method_info    methods[methods_count];
    u2             attributes_count;
    attribute_info attributes[attributes_count];
}
```

`注： u1、u2、u4、u8 来分别代表 1 个字节、2个字节、4 个字节和 8 个字节的无符号数，无符号数可以用来描述数字、索引引用、数量值或者按照 UTF-8 编码构成字符串值。`

c1ass文件的结构并不是一成不变的，随着Java虚拟机的不断发展，总是不可避免地会对class文件结构做出一些调整，但是其基本结构和框架是非常稳定的。

Class文件的总体结构如下:

- 魔数
- Class文件版本
- 常量池：常量池计数器+常量池表
- 访问标志
- 类索引，父类索引，接口索引集合
- 字段表集合
- 方法表集合
- 属性表集合

| 类型           | 名称                | 说明                   | 长度    | 数量                    |
| -------------- | ------------------- | ---------------------- | ------- | ----------------------- |
| u4             | magic               | 魔数,识别Class文件格式 | 4个字节 | 1                       |
| u2             | minor_version       | 副版本号(小版本)       | 2个字节 | 1                       |
| u2             | major_version       | 主版本号(大版本)       | 2个字节 | 1                       |
| u2             | constant_pool_count | 常量池计数器           | 2个字节 | 1                       |
| cp_info        | constant_pool       | 常量池表               | n个字节 | constant_pool_count - 1 |
| u2             | access_flags        | 访问标识               | 2个字节 | 1                       |
| u2             | this_class          | 类索引                 | 2个字节 | 1                       |
| u2             | super_class         | 父类索引               | 2个字节 | 1                       |
| u2             | interfaces_count    | 接口计数器             | 2个字节 | 1                       |
| u2             | interfaces          | 接口索引集合           | 2个字节 | interfaces_count        |
| u2             | fields_count        | 字段计数器             | 2个字节 | 1                       |
| field_info     | fields              | 字段表                 | n个字节 | fields_count            |
| u2             | methods_count       | 方法计数器             | 2个字节 | 1                       |
| method_info    | methods             | 方法表                 | n个字节 | methods_count           |
| u2             | attributes_count    | 属性计数器             | 2个字节 | 1                       |
| attribute_info | attributes          | 属性表                 | n个字节 | attributes_count        |

> Demo.java字节码解析。
>
> ```
> public class Demo {
>     private int num = 1;
> 
>     public int add() {
>         num = num + 2;
>         return num;
>     }
> }
> ```
>
> 后文对Class文件结构的说明参考此图！！！

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202402/39431853d73ed13a.png)

### 5.3.1. Magic Number（魔数）

- 每个Class文件开头的4个字节的无符号整数称为魔数（Magic Number）

- 它的唯一作用是确定这个文件是否为一个能被虚拟机接受的有效合法的Class文件。即：魔数是Class文件的标识符。

- 魔数值固定为0xCAFEBABE。不会改变。

- 如果一个Class文件不以0xCAFEBABE开头，虚拟机在进行文件校验的时候就会直接抛出以下错误：

  ```
  Error: A JNI error has occurred, please check your installation and try again
  Exception in thread "main" java.lang.ClassFormatError: Incompatible magic value 1885430635 in class file StringTest
  ```

- 使用魔数而不是扩展名来进行识别主要是基于安全方面的考虑，因为文件扩展名可以随意地改动。

### 5.3.2. Class文件版本号

紧接着魔数的4个字节存储的是Class文件的版本号。同样也是4个字节。第5个和第6个字节所代表的含义就是编译的副版本号minor_version，而第7个和第8个字节就是编译的主版本号major_version。

它们共同构成了class文件的格式版本号。譬如某个Class文件的主版本号为M，副版本号为m，那么这个Class文件的格式版本号就确定为M.m。

版本号和Java编译器的对应关系如下表：

| 主版本（十进制） | 副版本（十进制） | 编译器版本 |
| ---------------- | ---------------- | ---------- |
| 45               | 3                | 1.1        |
| 46               | 0                | 1.2        |
| 47               | 0                | 1.3        |
| 48               | 0                | 1.4        |
| 49               | 0                | 1.5        |
| 50               | 0                | 1.6        |
| 51               | 0                | 1.7        |
| 52               | 0                | 1.8        |
| 53               | 0                | 1.9        |
| 54               | 0                | 1.10       |
| 55               | 0                | 1.11       |

Java的版本号是从45开始的，JDK1.1之后的每个JDK大版本发布主版本号向上加1。

不同版本的Java编译器编译的Class文件对应的版本是不一样的。目前，高版本的Java虚拟机可以执行由低版本编译器生成的Class文件，但是低版本的Java虚拟机不能执行由高版本编译器生成的Class文件。否则JVM会抛出`java.lang.UnsupportedClassVersionError`异常。（向下兼容）

在实际应用中，由于开发环境和生产环境的不同，可能会导致该问题的发生。因此，需要我们在开发时，特别注意开发编译的JDK版本和生产环境中的JDK版本是否一致。

- 虚拟机JDK版本为1.k（k>=2）时，对应的class文件格式版本号的范围为45.0 - 44+k.0（含两端）。

### 5.3.3. 常量池（重要）

常量池是Class文件中内容最为丰富的区域之一。常量池对于Class文件中的字段和方法解析也有着至关重要的作用。

随着Java虚拟机的不断发展，常量池的内容也日渐丰富。可以说，**常量池是整个Class文件的基石**。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202402/d288333df8e9cc09.png)

在版本号之后，紧跟着的是常量池的数量，以及若干个常量池表项。

常量池中常量的数量是不固定的，所以在常量池的入口需要放置一项u2类型的无符号数，代表常量池容量计数值（constant_pool_count）。与Java中语言习惯不一样的是，这个容量计数是从1而不是0开始的。

| 类型           | 名称                | 数量                    |
| -------------- | ------------------- | ----------------------- |
| u2（无符号数） | constant_pool_count | 1                       |
| cp_info（表）  | constant_pool       | constant_pool_count - 1 |

由上表可见，Class文件使用了一个前置的容量计数器（constant_pool_count）加若干个连续的数据项（constant_pool）的形式来描述常量池内容。我们把这一系列连续常量池数据称为**常量池集合**。

- 常量池表项中，用于存放编译时期生成的各种**字面量**和**符号引用**，这部分内容将在类加载后进入方法区的运行时常量池中存放

#### 5.3.3.1. 常量池计数器

**constant_pool_count（常量池计数器）**

- 由于常量池的数量不固定，时长时短，所以需要放置两个字节来表示常量池容量计数值。

- 常量池容量计数值（u2类型）：从1开始，表示常量池中有多少项常量。即constant_pool_count=1表示常量池中有0个常量项。

- Demo的值为：

  ![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202402/1cf3ef5164bfbfea.png)

其值为0x0016，也就是22（可以利用Binary Viewer工具查看，在**如何解读二进制字节码**章节有说明）。

需要注意的是，这实际上只有21项常量。索引为范围是1-21。为什么呢？

> 通常我们写代码时都是从0开始的，但是这里的常量池却是从1开始，因为它把第0项常量空出来了。这是为了满足后面某些指向常量池的索引值的数据在特定情况下需要表达“不引用任何一个常量池项目”的含义，这种情况可用索引值0来表示。

#### 5.3.3.2. 常量池表

`constant_pool`是一种表结构，以`1 ~ constant_pool_count - 1`为索引。表明了后面有多少个常量项。

常量池主要存放两大类常量：**字面量（Literal）**和 **符号引用（Symbolic References）**

它包含了class文件结构及其子结构中引用的所有字符串常量、类或接口名、字段名和其他常量。常量池中的每一项都具备相同的特征。第1个字节作为类型标记，用于确定该项的格式，这个字节称为tag byte（标记字节、标签字节）。

| 标志(或标识) | 类型                             | 描述                   |
| ------------ | -------------------------------- | ---------------------- |
| 1            | CONSTANT_Utf8_info               | UTF-8编码的字符串      |
| 3            | CONSTANT_Integer_info            | 整型字面量             |
| 4            | CONSTANT_Float_info              | 浮点型字面量           |
| 5            | 5CONSTANT_Long_info              | 长整型字面量           |
| 6            | CONSTANT_Double_info             | 双精度浮点型字面量     |
| 7            | CONSTANT_Class_info              | 类或接口的符号引用     |
| 8            | CONSTANT_String_info             | 字符串类型字面量       |
| 9            | CONSTANT_Fieldref_info           | 字段的符号引用         |
| 10           | CONSTANT_Methodref_info          | 类中方法的符号引用     |
| 11           | CONSTANT_InterfaceMethodref_info | 接口中方法的符号引用   |
| 12           | CONSTANT_NameAndType_info        | 字段或方法的符号引用   |
| 15           | CONSTANT_MethodHandle_info       | 表示方法句柄           |
| 16           | CONSTANT_MethodType_info         | 标志方法类型           |
| 18           | CONSTANT_InvokeDynamic_info      | 表示一个动态方法调用点 |

> **字面量和符号引用**

在对这些常量解读前，我们需要搞清楚几个概念。

常量池主要存放两大类常量：字面量（Literal）和符号引用（Symbolic References）。如下表：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202402/46256c8a3445d13b.png)

**全限定名**

com/atguigu/test/Demo这个就是类的全限定名，仅仅是把包名的“.“替换成”/”，为了使连续的多个全限定名之间不产生混淆，在使用时最后一般会加入一个“;”表示全限定名结束。

**简单名称**

简单名称是指没有类型和参数修饰的方法或者字段名称，上面例子中的类的add()方法和num字段的简单名称分别是add和num。

**描述符**

描述符的作用是用来描述字段的数据类型、方法的参数列表（包括数量、类型以及顺序）和返回值。根据描述符规则，基本数据类型（byte、char、double、float、int、long、short、boolean）以及代表无返回值的void类型都用一个大写字符来表示，而对象类型则用字符L加对象的全限定名来表示，详见下表：

| 标志符 | 含义                                                 |
| ------ | ---------------------------------------------------- |
| B      | 基本数据类型byte                                     |
| C      | 基本数据类型char                                     |
| D      | 基本数据类型double                                   |
| F      | 基本数据类型float                                    |
| I      | 基本数据类型int                                      |
| J      | 基本数据类型long                                     |
| S      | 基本数据类型short                                    |
| Z      | 基本数据类型boolean                                  |
| V      | 代表void类型                                         |
| L      | 对象类型，比如：`Ljava/lang/Object;`                 |
| [      | 数组类型，代表一维数组。比如：`double[][][] is [[[D` |

用描述符来描述方法时，按照先参数列表，后返回值的顺序描述，参数列表按照参数的严格顺序放在一组小括号“()”之内。如方法java.lang.String tostring()的描述符为`()Ljava/lang/String`; ，方法`int abc(int[]x, int y)`的描述符为`([II) I`。

**补充说明：**

虚拟机在加载Class文件时才会进行动态链接，也就是说，Class文件中不会保存各个方法和字段的最终内存布局信息。因此，这些字段和方法的符号引用不经过转换是无法直接被虚拟机使用的。当虚拟机运行时，需要从常量池中获得对应的符号引用，再在类加载过程中的解析阶段将其替换为直接引用，并翻译到具体的内存地址中。

这里说明下符号引用和直接引用的区别与关联：

- 符号引用：符号引用以一组符号来描述所引用的目标，符号可以是任何形式的字面量，只要使用时能无歧义地定位到目标即可。符号引用与虚拟机实现的内存布局无关，引用的目标并不一定已经加载到了内存中。

- 直接引用：直接引用可以是直接指向目标的指针、相对偏移量或是一个能间接定位到目标的句柄。直接引用是与虚拟机实现的内存布局相关的，同一个符号引用在不同虚拟机实例上翻译出来的直接引用一般不会相同。如果有了直接引用，那说明引用的目标必定已经存在于内存之中了。

> **常量类型和结构**

常量池中每一项常量都是一个表，J0K1.7之后共有14种不同的表结构数据。如下表格所示**（此表重要，解析二进制字节码常用）**：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202402/555f7d2437e424f6.png)

根据上图每个类型的描述我们也可以知道每个类型是用来描述常量池中哪些内容（主要是字面量、符号引用）的。比如:
CONSTANT_Integer_info是用来描述常量池中字面量信息的，而且只是整型字面量信息。

标志为15、16、18的常量项类型是用来支持动态语言调用的（jdk1.7时才加入的）。

**细节说明:**

- `CONSTANT_Class_info`结构用于表示类或接口

- `CONSTAT_Fieldref_info`、`CONSTAHT_Methodref_infoF`和`lCONSTANIT_InterfaceMethodref_info`结构表示字段、方法和按口方法

- `CONSTANT_String_info`结构用于表示示String类型的常量对象

- `CONSTANT_Integer_info`和`CONSTANT_Float_info`表示4字节（int和float）的数值常量

- `CONSTANT_Long_info`和`CONSTAT_Double_info`结构表示8字节（long和double）的数值常量 

- - 在class文件的常量池表中，所行的8字节常量均占两个表成员（项）的空间。如果一个`CONSTAHT_Long_info`和`CONSTAHT_Double_info`结构在常量池中的索引位n，则常量池中一个可用的索引位n+2，此时常量池长中索引为n+1的项仍然有效但必须视为不可用的。

- `CONSTANT_NameAndType_info`结构用于表示字段或方法，但是和之前的3个结构不同，`CONSTANT_NameAndType_info`结构没有指明该字段或方法所属的类或接口。

- `CONSTANT_Utf8_info`用于表示字符常量的值

- `CONSTANT_MethodHandle_info`结构用于表示方法句柄

- `CONSTANT_MethodType_info`结构表示方法类型

- `CONSTANT_InvokeDynamic_info`结构表示invokedynamic指令所用到的引导方法(bootstrap method)、引导方法所用到的动态调用名称(dynamic invocation name)、参数和返回类型，并可以给引导方法传入一系列称为静态参数（static argument）的常量。

**解析方法：**

- 一个字节一个字节的解析
- 使用javap命令解析：`javap-verbose Demo.class`或`jclasslib`工具会更方便。

**总结1：**

- 这14种表（或者常量项结构）的共同点是：表开始的第一位是一个u1类型的标志位（tag），代表当前这个常量项使用的是哪种表结构，即哪种常量类型。

- 在常量池列表中，`CONSTANT_Utf8_info`常量项是一种使用改进过的UTF-8编码格式来存储，诸如文字字符串、类或者接口的全限定名、字段或者方法的简单名称以及描述符等常量字符串信息。

- 这14种常量项结构还有一个特点是，其中13个常量项占用的字节固定，只有`CONSTANT_Utf8_info`占用字节不固定，其大小由length决定。为什么呢？**因为从常量池存放的内容可知，其存放的是字面量和符号引用，最终这些内容都会是一个字符串，这些字符串的大小是在编写程序时才确定**，比如你定义一个类，类名可以取长取短，所以在没编译前，大小不固定，编译后，通过utf-8编码，就可以知道其长度。

**总结2：**

- 常量池：可以理解为Class文件之中的资源仓库，它是Class文件结构中与其他项目关联最多的数据类型（后面的很多数据类型都会指向此处），也是占用Class文件空间最大的数据项目之一。

- 常量池中为什么要包含这些内容？
  - Java代码在进行Javac编译的时候，并不像C和C++那样有“连接”这一步骤，而是在虚拟机加载Class文件的时候进行动态链接。也就是说，**在Class文件中不会保存各个方法、字段的最终内存布局信息，因此这些字段、方法的符号引用不经过运行期转换的话无法得到真正的内存入口地址，也就无法直接被虚拟机使用**。
  - 当虚拟机运行时，需要从常量池获得对应的符号引用，再在类创建时或运行时解析、翻译到具体的内存地址之中。关于类的创建和动态链接的内容，在虚拟机类加载过程时再进行详细讲解

### 5.3.4. 访问标识

**访问标识（access_flag、访问标志、访问标记）**

在常量池后，紧跟着访问标记。该标记使用两个字节表示，用于识别一些类或者接口层次的访问信息，包括：这个Class是类还是接口；是否定义为public类型；是否定义为abstract类型；如果是类的话，是否被声明为final等。各种访问标记如下所示：

| 标志名称       | 标志值 | 含义                                                         |
| -------------- | ------ | ------------------------------------------------------------ |
| ACC_PUBLIC     | 0x0001 | 标志为public类型                                             |
| ACC_FINAL      | 0x0010 | 标志被声明为final，只有类可以设置                            |
| ACC_SUPER      | 0x0020 | 标志允许使用invokespecial字节码指令的新语义，JDK1.0.2之后编译出来的类的这个标志默认为真。（使用增强的方法调用父类方法） |
| ACC_INTERFACE  | 0x0200 | 标志这是一个接口                                             |
| ACC_ABSTRACT   | 0x0400 | 是否为abstract类型，对于接口或者抽象类来说，次标志值为真，其他类型为假 |
| ACC_SYNTHETIC  | 0x1000 | 标志此类并非由用户代码产生（即：由编译器产生的类，没有源码对应） |
| ACC_ANNOTATION | 0x2000 | 标志这是一个注解                                             |
| ACC_ENUM       | 0x4000 | 标志这是一个枚举                                             |

类的访问权限通常为`ACC_`开头的常量。

每一种类型的表示都是通过设置访问标记的32位中的特定位来实现的。比如，若是public final的类，则该标记为`ACC_PUBLIC | ACC_FINAL`。

使用`ACC_SUPER`可以让类更准确地定位到父类的方法`super.method()`，现代编译器都会设置并且使用这个标记。

**补充说明：**

1. 带有`ACC_INTERFACE`标志的class文件表示的是接口而不是类，反之则表示的是类而不是接口。 
   - 如果一个class文件被设置了`ACC_INTERFACE`标志，那么同时也得设置`ACC_ABSTRACT`标志。同时它不能再设置`ACC_FINAL`、`ACC_SUPER` 或`ACC_ENUM`标志。
   - 如果没有设置`ACC_INTERFACE`标志，那么这个class文件可以具有上表中除`ACC_ANNOTATION`外的其他所有标志。当然，`ACC_FINAL`和`ACC_ABSTRACT`这类互斥的标志除外。这两个标志不得同时设置。
2. `ACC_SUPER`标志用于确定类或接口里面的`invokespecial`指令使用的是哪一种执行语义。**针对Java虚拟机指令集的编译器都应当设置这个标志**。对于Java SE 8及后续版本来说，无论class文件中这个标志的实际值是什么，也不管class文件的版本号是多少，Java虚拟机都认为每个class文件均设置了`ACC_SUPER`标志。
   - `ACC_SUPER`标志是为了向后兼容由旧Java编译器所编译的代码而设计的。目前的`ACC_SUPER`标志在由JDK1.0.2之前的编译器所生成的`access_flags`中是没有确定含义的，如果设置了该标志，那么0racle的Java虚拟机实现会将其忽略。
3. `ACC_SYNTHETIC`标志意味着该类或接口是由编译器生成的，而不是由源代码生成的。 
4.  注解类型必须设置`ACC_ANNOTATION`标志。如果设置了`ACC_ANNOTATION`标志，那么也必须设置`ACC_INTERFACE`标志。 
5.  `ACC_ENUM`标志表明该类或其父类为枚举类型。 

### 5.3.5. 类索引、父类索引、接口索引集合

在访问标记后，会指定该类的类别、父类类别以及实现的接口，格式如下：

| 长度 | 含义                         |
| ---- | ---------------------------- |
| u2   | this_class                   |
| u2   | super_class                  |
| u2   | interfaces_count             |
| u2   | interfaces[interfaces_count] |

这三项数据来确定这个类的继承关系：

- 类索引用于确定这个类的全限定名

- 父类索引用于确定这个类的父类的全限定名。由于Java语言不允许多重继承，所以父类索引只有一个，除了java.lang.Object之外，所有的Java类都有父类，因此除了java.lang.Object外，所有Java类的父类索引都不为0。

- 接口索引集合就用来描述这个类实现了哪些接口，这些被实现的接口将按implements语句（如果这个类本身是一个接口，则应当是extends语句）后的接口顺序从左到右排列在接口索引集合中。

#### 5.3.5.1. this_class（类索引）

2字节无符号整数，指向常量池的索引。它提供了类的全限定名，如`com/atguigu/java1/Demo`。`this_class`的值必须是对常量池表中某项的一个有效索引值。常量池在这个索引处的成员必须为`CONSTANT_Class_info`类型结构体，该结构体表示这个class文件所定义的类或接口。

#### 5.3.5.2. super_class（父类索引）

- 2字节无符号整数，指向常量池的索引。它提供了当前类的父类的全限定名。如果我们没有继承任何类，其默认继承的是java/lang/object类。同时，由于Java不支持多继承，所以其父类只有一个。
- super_class指向的父类不能是final。

#### 5.3.5.3. interfaces

- 指向常量池索引集合，它提供了一个符号引用到所有已实现的接口
- 由于一个类可以实现多个接口，因此需要以数组形式保存多个接口的索引，表示接口的每个索引也是一个指向常量池的CONSTANT_Class（当然这里就必须是接口，而不是类）。

##### 5.3.5.3.1. interfaces_count（接口计数器）

interfaces_count项的值表示当前类或接口的直接超接口数量。

##### 5.3.5.3.2. interfaces[]（接口索引集合）

interfaces[]中每个成员的值必须是对常量池表中某项的有效索引值，它的长度为`interfaces_count`。每个成员`interfaces[i]`必须为`CONSTANT_Class_info`结构，其中0 <= i < interfaces_count。在interfaces[]中，各成员所表示的接口顺序和对应的源代码中给定的接口顺序（从左至右）一样，即interfaces[0]对应的是源代码中最左边的接口。

### 5.3.6. 字段表集合

**fields**

- 用于描述接口或类中声明的变量。字段（field）包括**类级变量以及实例级变量**，但是不包括方法内部、代码块内部声明的局部变量。
- 字段叫什么名字、字段被定义为什么数据类型，这些都是无法固定的，只能引用常量池中的常量来描述。
- 它指向常量池索引集合，它描述了每个字段的完整信息。比如`字段的标识符`、`访问修饰符（public、private或protected）`、`是类变量还是实例变量（static修饰符）`、`是否是常量（final修饰符）`等。

**注意事项：**

- 字段表集合中不会列出从父类或者实现的接口中继承而来的字段，但有可能列出原本Java代码之中不存在的字段。譬如在内部类中为了保持对外部类的访问性，会自动添加指向外部类实例的字段。

- 在Java语言中字段是无法重载的，两个字段的数据类型、修饰符不管是否相同，都必须使用不一样的名称，但是对于字节码来讲，如果两个字段的描述符不一致，那字段重名就是合法的。

#### 5.3.6.1. 字段计数器

**fields_count（字段计数器）**

fields_count的值表示当前class文件fields表的成员个数。使用两个字节来表示。

fields表中每个成员都是一个field_info结构，用于表示该类或接口所声明的所有类字段或者实例字段，不包括方法内部声明的变量，也不包括从父类或父接口继承的那些字段。

#### 5.3.6.2. 字段表

fields表中每个成员都是一个field_info结构的数据项，用于表示当前类或接口中某个字段的完整描述。

一个字段的信息包括如下这些信息。这些信息中，**各个修饰符都是布尔值，要么有，要么没有**。

- 作用域(public、private、protected修饰符)
- 是实例变量还是类变量(static修饰符)
- 可变性(final)
- 并发可见性(volatile修饰符，是否强制从主内存读写)
- 可否序列化(transient修饰符)
- 字段数据类型(基本数据类型、对象、数组)
- 字段名称

**字段表结构**

字段表作为一个表，同样有他自己的结构：

| 标志名称       | 标志值           | 含义       | 数量             |
| -------------- | ---------------- | ---------- | ---------------- |
| u2             | access_flags     | 访问标志   | 1                |
| u2             | name_index       | 字段名索引 | 1                |
| u2             | descriptor_index | 描述符索引 | 1                |
| u2             | attributes_count | 属性计数器 | 1                |
| attribute_info | attributes       | 属性集合   | attributes_count |

##### 5.3.6.2.1. 字段表访问标识

我们知道，一个字段可以被各种关键字去修饰，比如：作用域修饰符（public、private、protected）、static修饰符、final修饰符、volatile修饰符等等。因此，其可像类的访问标志那样，使用一些标志来标记字段。字段的访问标志有如下这些：

| 标志名称      | 标志值 | 含义                       |
| ------------- | ------ | -------------------------- |
| ACC_PUBLIC    | 0x0001 | 字段是否为public           |
| ACC_PRIVATE   | 0x0002 | 字段是否为private          |
| ACC_PROTECTED | 0x0004 | 字段是否为protected        |
| ACC_STATIC    | 0x0008 | 字段是否为static           |
| ACC_FINAL     | 0x0010 | 字段是否为final            |
| ACC_VOLATILE  | 0x0040 | 字段是否为volatile         |
| ACC_TRANSTENT | 0x0080 | 字段是否为transient        |
| ACC_SYNCHETIC | 0x1000 | 字段是否为由编译器自动产生 |
| ACC_ENUM      | 0x4000 | 字段是否为enum             |

##### 5.3.6.2.2. 字段名索引

根据字段名索引的值，查询常量池中的指定索引项即可。

##### 5.3.6.2.3. 描述符索引

描述符的作用是用来描述字段的数据类型、方法的参数列表（包括数量、类型以及顺序）和返回值。根据描述符规则，基本数据类型（byte，char，double，float，int，long，short，boolean）及代表无返回值的void类型都用一个大写字符来表示，而对象则用字符L加对象的全限定名来表示，如下所示：

| 字符         | 类型      | 含义                       |
| ------------ | --------- | -------------------------- |
| B            | byte      | 有符号字节型数             |
| C            | char      | Unicode 字符， UTF-16 编码 |
| D            | double    | 双精度浮点数               |
| F            | float     | 单精度浮点数               |
| I            | int       | 整型数                     |
| J            | long      | 长整数                     |
| S            | short     | 有符号短整数               |
| Z            | boolean   | 布尔值 true/false          |
| L Classname; | reference | 个名为Classname的实例      |
| [            | reference | 一个一维数组               |

##### 5.3.6.2.4. 属性表集合

一个字段还可能拥有一些属性，用于存储更多的额外信息。比如初始化值、一些注释信息等。属性个数存放在attribute_count中，属性具体内容存放在attributes数组中。

```java
// 以常量属性为例，结构为：
ConstantValue_attribute{
    u2 attribute_name_index;
    u4 attribute_length;
    u2 constantvalue_index;
}
```

说明：对于常量属性而言，attribute_length值恒为2。

根据上面的例子，我们来实际分析一下，如下图：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202402/5287a38ead49b8ec.png)

### 5.3.7. 方法表集合

methods：指向常量池索引集合，它完整描述了每个方法的签名。

- 在字节码文件中，**每一个method_info项都对应着一个类或者接口中的方法信息**。比如方法的访问修饰符（public、private或protected），方法的返回值类型以及方法的参数信息等。
- 如果这个方法不是抽象的或者不是native的，那么字节码中会体现出来。
- 一方面，methods表只描述当前类或接口中声明的方法，不包括从父类或父接口继承的方法。另一方面，methods表有可能会出现由编译器自动添加的方法，最典型的便是编译器产生的方法信息，比如：类（接口）初始化方法`<clinit>()`和实例初始化方法`<init>()`。

**使用注意事项**

在Java语言中，要重载（Overload）一个方法，除了要与原方法具有相同的简单名称之外，还要求必须拥有一个与原方法不同的特征签名，特征签名就是一个方法中各个参数在常量池中的字段符号引用的集合，也就是因为返回值不会包含在特征签名之中，因此Java语言里无法仅仅依靠返回值的不同来对一个已有方法进行重载。但在Class文件格式中，特征签名的范围更大一些，只要描述符不是完全一致的两个方法就可以共存。也就是说，如果两个方法有相同的名称和特征签名，但返回值不同，那么也是可以合法共存于同一个class文件中。

也就是说，尽管Java语法规范并不允许在一个类或者接口中声明多个方法签名相同的方法，但是和Java语法规范相反，字节码文件中却恰恰允许存放多个方法签名相同的方法，唯一的条件就是这些方法之间的返回值不能相同。

#### 5.3.7.1. 方法计数器

**methods_count（方法计数器）**

- methods_count的值表示当前class文件methods表的成员个数。使用两个字节来表示。
- methods表中每个成员都是一个method_info结构。

#### 5.3.7.2. 方法表

**methods[]（方法表）**

- methods表中的每个成员都必须是一个method_info结构，用于表示当前类或接口中某个方法的完整描述。如果某个method_info结构的access_flags项既没有设置`ACC_NATIVE`标志也没有设置`ACC_ABSTRACT`标志，那么该结构中也应包含实现这个方法所用的Java虚拟机指令。
- method_info结构可以表示类和接口中定义的所有方法，包括：实例方法、类方法、实例初始化方法和类或接口初始化方法
- 方法表的结构实际跟字段表是一样的，方法表结构如下：

| 标志名称       | 标志值           | 含义       | 数量             |
| -------------- | ---------------- | ---------- | ---------------- |
| u2             | access_flags     | 访问标志   | 1                |
| u2             | name_index       | 方法名索引 | 1                |
| u2             | descriptor_index | 描述符索引 | 1                |
| u2             | attributes_count | 属性计数器 | 1                |
| attribute_info | attributes       | 属性集合   | attributes_count |

**方法表访问标志**

跟字段表一样，方法表也有访问标志，而且他们的标志有部分相同，部分则不同，方法表的具体访问标志如下：

| 标志名称      | 标志值 | 含义                                |
| ------------- | ------ | ----------------------------------- |
| ACC_PUBLIC    | 0x0001 | public，方法可以从包外访问          |
| ACC_PRIVATE   | 0x0002 | private，方法只能本类访问           |
| ACC_PROTECTED | 0x0004 | protected，方法在自身和子类可以访问 |
| ACC_STATIC    | 0x0008 | static，静态方法                    |

### 5.3.8. 属性表集合

- 方法表集合之后的属性表集合，**指的是class文件所携带的辅助信息**，比如该class文件的源文件的名称。以及任何带有`RetentionPolicy.CLASS` 或者`RetentionPolicy.RUNTIME`的注解。这类信息通常被用于Java虚拟机的验证和运行，以及Java程序的调试，**一般无须深入了解**。
- 此外，字段表、方法表都可以有自己的属性表。用于描述某些场景专有的信息。
- 属性表集合的限制没有那么严格，不再要求各个属性表具有严格的顺序，并且只要不与已有的属性名重复，任何人实现的编译器都可以向属性表中写入自己定义的属性信息，但Java虚拟机运行时会忽略掉它不认识的属性。

#### 5.3.8.1. 属性计数器（attributes_count）

attributes_count的值表示当前class文件属性表的成员个数。属性表中每一项都是一个attribute_info结构。

#### 5.3.8.2. 属性表（attributes[]）

属性表的每个项的值必须是attribute_info结构。属性表的结构比较灵活，各种不同的属性只要满足以下结构即可。

> **属性的通用格式**

| 类型 | 名称                 | 数量             | 含义       |
| ---- | -------------------- | ---------------- | ---------- |
| u2   | attribute_name_index | 1                | 属性名索引 |
| u4   | attribute_length     | 1                | 属性长度   |
| u1   | info                 | attribute_length | 属性表     |

即只需说明属性的名称以及占用位数的长度即可，属性表具体的结构可以自己去自定义。

> **属性类型**

属性表实际上可以有很多类型，上面看到的Code属性只是其中一种，Java8里面定义了23种属性。下面这些是虚拟机中预定义的属性：

| 属性名称                            | 使用位置           | 含义                                                         |
| ----------------------------------- | ------------------ | ------------------------------------------------------------ |
| Code                                | 方法表             | Java代码编译成的字节码指令                                   |
| ConstantValue                       | 字段表             | final关键字定义的常量池                                      |
| Deprecated                          | 类，方法，字段表   | 被声明为deprecated的方法和字段                               |
| Exceptions                          | 方法表             | 方法抛出的异常                                               |
| EnclosingMethod                     | 类文件             | 仅当一个类为局部类或者匿名类时才能拥有这个属性，这个属性用于标识这个类所在的外围方法 |
| InnerClass                          | 类文件             | 内部类列表                                                   |
| LineNumberTable                     | Code属性           | Java源码的行号与字节码指令的对应关系                         |
| LocalVariableTable                  | Code属性           | 方法的局部变量描述                                           |
| StackMapTable                       | Code属性           | JDK1.6中新增的属性，供新的类型检查检验器和处理目标方法的局部变量和操作数有所需要的类是否匹配 |
| Signature                           | 类，方法表，字段表 | 用于支持泛型情况下的方法签名                                 |
| SourceFile                          | 类文件             | 记录源文件名称                                               |
| SourceDebugExtension                | 类文件             | 用于存储额外的调试信息                                       |
| Synthetic                           | 类，方法表，字段表 | 标志方法或字段为编译器自动生成的                             |
| LocalVariableTypeTable              | 类                 | 是哟很难过特征签名代替描述符，是为了引入泛型语法之后能描述泛型参数化类型而添加 |
| RuntimeVisibleAnnotations           | 类，方法表，字段表 | 为动态注解提供支持                                           |
| RuntimeInvisibleAnnotations         | 类，方法表，字段表 | 用于指明哪些注解是运行时不可见的                             |
| RuntimeVisibleParameterAnnotation   | 方法表             | 作用与RuntimeVisibleAnnotations属性类似，只不过作用对象或方法 |
| RuntimeInvisibleParameterAnnotation | 方法表             | 作用与RuntimeInvisibleAnnotations属性类似，只不过作用对象或方法 |
| AnnotationDefault                   | 方法表             | 用于记录注解类元素的默认值                                   |
| BootstrapMethods                    | 类文件             | 用于保存invokeddynamic指令引用的引导方法限定符               |

或者（查看官网）

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202402/e394a2100ac8e476.png)

> **部分属性详解**

**① ConstantValue属性**

ConstantValue属性表示一个常量字段的值。位于field_info结构的属性表中。

```java
ConstantValue_attribute{
	u2 attribute_name_index;
	u4 attribute_length;
	u2 constantvalue_index;//字段值在常量池中的索引，常量池在该索引处的项给出该属性表示的常量值。（例如，值是1ong型的，在常量池中便是CONSTANT_Long）
}
```

**② Deprecated 属性**

Deprecated 属性是在JDK1.1为了支持注释中的关键词@deprecated而引入的。

```java
Deprecated_attribute{
	u2 attribute_name_index;
	u4 attribute_length;
}
```

**③ Code属性**

Code属性就是存放方法体里面的代码。但是，并非所有方法表都有Code属性。像接口或者抽象方法，他们没有具体的方法体，因此也就不会有Code属性了。Code属性表的结构，如下图：

| 类型           | 名称                   | 数量             | 含义                     |
| -------------- | ---------------------- | ---------------- | ------------------------ |
| u2             | attribute_name_index   | 1                | 属性名索引               |
| u4             | attribute_length       | 1                | 属性长度                 |
| u2             | max_stack              | 1                | 操作数栈深度的最大值     |
| u2             | max_locals             | 1                | 局部变量表所需的存续空间 |
| u4             | code_length            | 1                | 字节码指令的长度         |
| u1             | code                   | code_lenth       | 存储字节码指令           |
| u2             | exception_table_length | 1                | 异常表长度               |
| exception_info | exception_table        | exception_length | 异常表                   |
| u2             | attributes_count       | 1                | 属性集合计数器           |
| attribute_info | attributes             | attributes_count | 属性集合                 |

可以看到：Code属性表的前两项跟属性表是一致的，即Code属性表遵循属性表的结构，后面那些则是他自定义的结构。

**④ InnerClasses 属性**

为了方便说明特别定义一个表示类或接口的Class格式为C。如果C的常量池中包含某个CONSTANT_Class_info成员，且这个成员所表示的类或接口不属于任何一个包，那么C的ClassFile结构的属性表中就必须含有对应的InnerClasses属性。InnerClasses属性是在JDK1.1中为了支持内部类和内部接口而引入的，位于ClassFile结构的属性表。

**⑤ LineNumberTable属性**

LineNumberTable属性是可选变长属性，位于Code结构的属性表。

LineNumberTable属性是**用来描述Java源码行号与字节码行号之间的对应关系**。这个属性可以用来在调试的时候定位代码执行的行数。

- start_pc：即字节码行号；line_numbe：即Java源代码行号。

在Code属性的属性表中，LineNumberTable属性可以按照任意顺序出现，此外，多个LineNumberTable属性可以共同表示一个行号在源文件中表示的内容，即LineNumberTable属性不需要与源文件的行一一对应。

```java
// LineNumberTable属性表结构：
LineNumberTable_attribute{
    u2 attribute_name_index;
    u4 attribute_length;
    u2 line_number_table_length;
    {
        u2 start_pc;
        u2 line_number;
    } line_number_table[line_number_table_length];
}
```

**⑥ LocalVariableTable属性**

LocalVariableTable是可选变长属性，位于Code属性的属性表中。它被调试器用于确定方法在执行过程中局部变量的信息。在Code属性的属性表中，LocalVariableTable属性可以按照任意顺序出现。Code属性中的每个局部变量最多只能有一个LocalVariableTable属性。

- start pc + length表示这个变量在字节码中的生命周期起始和结束的偏移位置（this生命周期从头e到结尾10）

- index就是这个变量在局部变量表中的槽位（槽位可复用）

- name就是变量名

- Descriptor表示局部变量类型描述

```java
// LocalVariableTable属性表结构：
LocalVariableTable_attribute{
    u2 attribute_name_index;
    u4 attribute_length;
    u2 local_variable_table_length;
    {
        u2 start_pc;
        u2 length;
        u2 name_index;
        u2 descriptor_index;
        u2 index;
    } local_variable_table[local_variable_table_length];
}
```

**⑦ Signature属性**

Signature属性是可选的定长属性，位于ClassFile，field_info或method_info结构的属性表中。在Java语言中，任何类、接口、初始化方法或成员的泛型签名如果包含了类型变量（Type Variables）或参数化类型（Parameterized Types），则Signature属性会为它记录泛型签名信息。

**⑧ SourceFile属性**

SourceFile属性结构

| 类型 | 名称                 | 数量 | 含义         |
| ---- | -------------------- | ---- | ------------ |
| u2   | attribute_name_index | 1    | 属性名索引   |
| u4   | attribute_length     | 1    | 属性长度     |
| u2   | sourcefile index     | 1    | 源码文件素引 |

可以看到，其长度总是固定的8个字节。

**⑨ 其他属性**

Java虚拟机中预定义的属性有20多个，这里就不一一介绍了，通过上面几个属性的介绍，只要领会其精髓，其他属性的解读也是易如反掌。

## 5.4. 小结

本章主要介绍了Class文件的基本格式。

随着Java平台的不断发展，在将来，Class文件的内容也一定会做进一步的扩充，但是其基本的格式和结构不会做重大调整。

从Java虚拟机的角度看，通过class文件，可以让更多的计算机语言支持Java虚拟机平台。因此，class文件结构不仅仅是Java虚拟机的执行入口，更是Java生态圈的基础和核心。

