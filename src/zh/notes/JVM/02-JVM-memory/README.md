<h1 align="center" style="color:orange">内存结构</h1>




# 整体架构

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202207121155788.png" alt="image-20210611162052821" />



***

# 程序计数器（PC Register）

## 程序计数器（Program Counter Register）定义

- 是一块较小的内存空间，它可以看作是当前线程所执行的字节码的行号指示器。在Java虚拟机的概念模型里，字节码解释器工作时就是通过改变这个计数器的值来选取下一条需要执行的字节码指令，它是程序控制流的指示器，分支、循环、跳转、异常处理、线程恢复等基础功能都需要依赖这个计数器来完成。（记住下一条JVM指令执行的地址）
- 特点：
  - **是线程私有的**
    1. CPU会为每个线程分配时间片，在当前线程时间片使用完以后，CPU就会执行另一线程的代码
    2. 程序计数器是每个线程私有的，当 另一个线程的时间片用完，又返回来执行当前线程的代码时，通过程序计数器就可以知道执行哪一条指令。
  - 唯一一个在《Java虚拟机规范》中没有规定任何OutOfMemoryError情况的区域。

## 作用

PC寄存器（程序计数器）用来存储指向下一条指令的地址，也即将要执行的指令代码。由执行引擎读取下一条指令。

![image-20200705155728557](https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202208311423665.png)

## 代码演示

我们首先写一个简单的代码

```java
/**
 * 程序计数器
 */
public class PCRegisterTest {
    public static void main(String[] args) {
        int i = 10;
        int j = 20;
        int k = i + j;
    }
}
```

然后将代码进行编译成字节码文件，我们再次查看 ，发现在字节码的左边有一个行号标识，它其实就是指令地址，用于指向当前执行到哪里。

```
0: bipush        10
2: istore_1
3: bipush        20
5: istore_2
6: iload_1
7: iload_2
8: iadd
9: istore_3
10: return
```

通过PC寄存器，我们就可以知道当前程序执行到哪一步了。

![image-20200705161007423](https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202208311435930.png)



##  PC寄存器为什么被设定为私有

我们都知道所谓的多线程在一个特定的时间段内只会执行其中某一个线程的方法，CPU会不停地做任务切换，这样必然导致经常中断或恢复，如何保证分毫无差呢？为了能够准确地记录各个线程正在执行的当前字节码指令地址，最好的办法自然是**为每一个线程都分配一个PC寄存器**，这样一来**各个线程之间便可以进行独立计算**，从而不会出现相互干扰的情况。

由于CPU时间片轮限制，众多线程在并发执行过程中，任何一个确定的时刻，一个处理器或者多核处理器中的一个内核，只会执行某个线程中的一条指令。

这样必然导致经常中断或恢复，如何保证分毫无差呢？每个线程在创建后，都会产生自己的程序计数器和栈帧，程序计数器在各个线程之间互不影响。

![image-20200705161812542](https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202208311438362.png)

## CPU时间片

CPU时间片即CPU分配给各个程序的时间，每个线程被分配一个时间段，称作它的时间片。

在宏观上：我们可以同时打开多个应用程序，每个程序并行不悖，同时运行。

但在微观上：由于只有一个CPU，一次只能处理程序要求的一部分，如何处理公平，一种方法就是引入时间片，每个程序轮流执行。

![image-20200705161849557](https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202208311439462.png)

---

# 虚拟机栈(Java Virtual Machine Stacks)



**设置栈内存大小**

我们可以使用参数 -Xss选项来设置线程的最大栈空间，栈的大小直接决定了函数调用的最大可达深度。

```
-Xss1m
-Xss1k
```



## 定义

- 每个线程运行所需要的内存空间，称为**虚拟机栈**
- 每个栈由多个**栈帧**组成，对应着每次调用方法时所占用的内存
- 每个线程只能有**一个活动栈帧**，对应着当前正在执行的方法

## 演示代码

```java
public  class Main { 
    public static void main(String[] args) { 
        method1(); 
    } 
    private static void method1() {            
        method2(1, 2); 
} 
    private static int method2(int a, int b) { 
        int c = a + b; 
        return c; 
    }
}
```

在控制台中可以看到，主类中的方法在进入虚拟机栈的时候，符合栈的特点。

![image-20210611163404136](https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202207121155790.png)



## 问题辨析

**垃圾回收是否涉及栈内存？**

- **不需要**。因为虚拟机栈中是由一个个栈帧组成的，在方法执行完毕后，对应的栈帧就会被弹出栈。所以无需通过垃圾回收机制去回收内存。

**栈内存的分配越大越好吗？**

- 不是。因为**物理内存是一定的**，栈内存越大，可以支持更多的递归调用，但是可执行的线程数就会越少。（解释：假如物理内存500M，每个线程需要1M内存，即需要虚拟机栈为这么多，这时可以有500个线程。但是每个线程需要2M内存，这时可以有250个线程）。

**方法内的局部变量是否是线程安全的？**

- 如果方法内局部变量没有逃离方法的作用范围，则是**线程安全**的。
- 如果如果局部变量引用了对象，并逃离了方法的作用范围，则需要考虑线程安全问题。



## 线程安全问题

**示例代码**

```java
/**
 * 局部变量的线程安全问题
 */
public class Demo1_17 {
    public static void main(String[] args) {
        StringBuilder sb = new StringBuilder();
        sb.append(4);
        sb.append(5);
        sb.append(6);
        new Thread(()->{
            m2(sb);
        }).start();
    }

    public static void m1() {
        StringBuilder sb = new StringBuilder();
        sb.append(1);
        sb.append(2);
        sb.append(3);
        System.out.println(sb.toString());
    }

    public static void m2(StringBuilder sb) {
        sb.append(1);
        sb.append(2);
        sb.append(3);
        System.out.println(sb.toString());
    }

    public static StringBuilder m3() {
        StringBuilder sb = new StringBuilder();
        sb.append(1);
        sb.append(2);
        sb.append(3);
        return sb;
    }
}
```

1. m1()方法中sb为局部变量，线程私有，所以安全！
2. m2()方法的sb作为参数，有可能被其他线程访问，不安全。返回类型改为StringBuffer安全！
3. m3()方法作为return返回值，逃离了当前方法，被别的线程访问到了！不安全！



## 栈帧的内部结构

**每个栈帧中存储着：**

- 局部变量表（Local Variables）
- 操作数栈（operand Stack,或表达式栈）
- 动态链接（DynamicLinking，或指向运行时常量池的方法引用）
- 方法返回地址（Return Address，或方法正常退出或异常退出的定义）
- 一些附加信息

如图所示：

![image-20210611164350550](https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202207121155791.png)

并行每个线程下的栈都是私有的，因此每个线程都有自己各自的栈，并且每个栈里面都有很多栈帧，栈帧的大小主要由`局部变量表`和`操作数栈`决定的。

### 局部变量表

- 局部变量表：Local Variables，被称之为`局部变量数组`或`本地变量表`。最基本的存储单元是Slot（变量槽）
- 定义为一个数字数组，主要用于`存储方法参数`和定义在方法体内的`局部变量`，这些数据类型包括各类基本数据类型、对象引用（reference），以及returnAddress类型。
- 局部变量表中的变量**只在当前方法调用中有效**。在方法执行时，虚拟机通过使用局部变量表完成参数值到参数变量列表的传递过程。当方法调用结束后，随着方法栈帧的销毁，局部变量表也会随之销毁。
- 局部变量表所需的**容量大小**是在**编译期确定**下来的，在方法运行期间是不会改变局部变量表的大小的。

####  静态变量与局部变量的对比

变量的分类：

- 按数据类型分：基本数据类型、引用数据类型
- 按类中声明的位置分：成员变量（类变量，实例变量）、局部变量
  - 类变量：linking的paper阶段，给类变量默认赋值，init阶段给类变量显示赋值即静态代码块
  - 实例变量：随着对象创建，会在堆空间中分配实例变量空间，并进行默认赋值
  - 局部变量：在使用前必须进行显式赋值，不然编译不通过。

在栈帧中，与性能调优关系最为密切的部分就是前面提到的局部变量表。在方法执行时，虚拟机使用局部变量表完成方法的传递。

局部变量表中的变量也是重要的垃圾回收根节点，只要被局部变量表中直接或间接引用的对象都不会被回收。

### 操作数栈

#### 概念

- 每一个独立的栈帧除了包含局部变量表以外，还包含一个后进先出（Last - In - First -Out）的 操作数栈，也可以称之为 表达式栈（Expression Stack）。
- 操作数栈，**主要用于保存计算过程的中间结果**，同时作为计算过程中变量临时的存储空间。
- 操作数栈就是JVM执行引擎的一个工作区，当一个方法刚开始执行的时候，一个新的栈帧也会随之被创建出来，这个方法的操作数栈是空的。
- 我们说Java虚拟机的解释引擎是基于栈的执行引擎，其中的栈指的就是操作数栈。

####  代码追踪

我们给定代码

```java
public void testAddOperation() {
    byte i = 15;
    int j = 8;
    int k = i + j;
}
```

使用javap 命令反编译class文件： javap -v 类名.class

![image-20200706092610730](https://gitee.com/LastedMemory/LearningNotes/raw/master/JVM/1_内存与垃圾回收篇/5_虚拟机栈/images/image-20200706092610730.png)

> byte、short、char、boolean 内部都是使用int型来进行保存的
>
> 从上面的代码我们可以知道，我们都是通过bipush对操作数 15 和 8进行入栈操作
>
> 同时使用的是 iadd方法进行相加操作，i -> 代表的就是 int，也就是int类型的加法操作

执行流程如下所示：

首先执行第一条语句，PC寄存器指向的是0，也就是指令地址为0，然后使用bipush让操作数15入栈。

![image-20200706093131621](https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202208311507682.png)

执行完后，让PC + 1，指向下一行代码，下一行代码就是将操作数栈的元素存储到局部变量表1的位置，我们可以看到局部变量表的已经增加了一个元素

![image-20200706093251302](https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202208311508802.png)

> 为什么局部变量表不是从0开始的呢？
>
> 其实局部变量表也是从0开始的，但是因为0号位置存储的是this指针，所以说就直接省略了~

然后PC+1，指向的是下一行。让操作数8也入栈，同时执行store操作，存入局部变量表中

![image-20200706093646406](https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202208311508566.png)

![image-20200706093751711](https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202208311508055.png)

然后从局部变量表中，依次将数据放在操作数栈中

![image-20200706093859191](https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202208311509201.png)

![image-20200706093921573](https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202208311509302.png)

然后将操作数栈中的两个元素执行相加操作，并存储在局部变量表3的位置

![image-20200706094046782](https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202208311509040.png)

![image-20200706094109629](https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202208311509194.png)

最后PC寄存器的位置指向10，也就是return方法，则直接退出方法。

## 栈内存溢出

### 栈帧过多导致栈内存溢出

**示例代码：**

```java
/**
 * 演示栈内存溢出 java.lang.StackOverflowError
 * -Xss256k
 */
public class Demo1_2 {
    private static int count;

    public static void main(String[] args) {
        try {
            method1();
        } catch (Throwable e) {
            e.printStackTrace();
            System.out.println(count);
        }
    }

    private static void method1() {
        count++;
        method1();
    }
}
```



### 栈帧过大导致栈内存溢出

**示例代码**

```java

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Arrays;
import java.util.List;

/**
 * json 数据转换
 */
public class Demo1_19 {

    public static void main(String[] args) throws JsonProcessingException {
        Dept d = new Dept();
        d.setName("Market");

        Emp e1 = new Emp();
        e1.setName("zhang");
        e1.setDept(d);

        Emp e2 = new Emp();
        e2.setName("li");
        e2.setDept(d);

        d.setEmps(Arrays.asList(e1, e2));

        // { name: 'Market', emps: [{ name:'zhang', dept:{ name:'', emps: [ {}]} },] }
        ObjectMapper mapper = new ObjectMapper();
        System.out.println(mapper.writeValueAsString(d));
    }
}

class Emp {
    private String name;
    @JsonIgnore
    private Dept dept;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Dept getDept() {
        return dept;
    }

    public void setDept(Dept dept) {
        this.dept = dept;
    }
}
class Dept {
    private String name;
    private List<Emp> emps;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public List<Emp> getEmps() {
        return emps;
    }

    public void setEmps(List<Emp> emps) {
        this.emps = emps;
    }
}
```

加上`@JsonIgnore`注解解决部门员工之间的循环引用！



## 线程运行诊断

### 案例一：CPU占用过高

**Linux环境下运行某些程序的时候，可能导致CPU的占用过高，这时需要定位占用CPU过高的线程。**

**运行java代码：**

```
//com.gyz.jvm.t1.Demo1_16代码路径
nohup java com.gyz.jvm.t1.Demo1_16  
nohup: ignoring input and appending output to `nohup.out`	
```

```java
/**
 * 演示 cpu 占用过高
 */
public class Demo1_16 {

    public static void main(String[] args) {
        new Thread(null, () -> {
            System.out.println("1...");
            while(true) {

            }
        }, "thread1").start();


        new Thread(null, () -> {
            System.out.println("2...");
            try {
                Thread.sleep(1000000L);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }, "thread2").start();

        new Thread(null, () -> {
            System.out.println("3...");
            try {
                Thread.sleep(1000000L);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }, "thread3").start();
    }
}

```

- 用`top`命令定位哪个线程对cpu的占用过高。
- `ps H -eo pid,tid,%cpu | grep` （用ps命令进一步定位是哪个线程引起的cpu占用过高），-eo参数为规定输出哪些参数，H 打印线程信息。
- jstack进程id，通过查看进程中的线程的nid：
  - 可以根据线程id找到有问题的线程，进一步定位到问题代码的源码行号
  - 注意jstack查找出的线程id是**16进制的**，**需要转换**



### 案例二：程序运行很长时间没有结果（死锁）

**示例代码：**

```java
/**
 * 演示线程死锁
 */
class A{};
class B{};
public class Demo1_3 {
    static A a = new A();
    static B b = new B();


    public static void main(String[] args) throws InterruptedException {
        new Thread(()->{
            synchronized (a) {
                try {
                    Thread.sleep(2000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                synchronized (b) {
                    System.out.println("我获得了 a 和 b");
                }
            }
        }).start();
        Thread.sleep(1000);
        new Thread(()->{
            synchronized (b) {
                synchronized (a) {
                    System.out.println("我获得了 a 和 b");
                }
            }
        }).start();
    }

}

```

**死锁产生四个条件：**

- 互斥条件：进程要求对所分配的资源（如打印机）进行排他性控制，即在一段时间内某 资源仅为一个进程所占有。此时若有其他进程请求该资源，则请求进程只能等待。
- 不剥夺条件：进程所获得的资源在未使用完毕之前，不能被其他进程强行夺走，即只能 由获得该资源的进程自己来释放（只能是主动释放)。
- 请求和保持条件：进程已经保持了至少一个资源，但又提出了新的资源请求，而该资源 已被其他进程占有，此时请求进程被阻塞，但对自己已获得的资源保持不放。
- 循环等待条件：存在一种进程资源的循环等待链，链中每一个进程已获得的资源同时被 链中下一个进程所请求。即存在一个处于等待状态的进程集合{Pl, P2, ..., pn}，其中Pi等 待的资源被P(i+1)占有（i=0, 1, ..., n-1)，Pn等待的资源被P0占有。



***

# 本地方法栈(Native Method Stacks)

一些带有**native关键字**的方法就是需要JAVA去调用本地的C或者C++方法，因为JAVA有时候没法直接和操作系统底层交互，所以需要用到本地方法，**本地方法栈，也是线程私有的**。

允许被实现成固定或者是可动态扩展的内存大小。（在内存溢出方面是相同的）

- 如果线程请求分配的栈容量超过本地方法栈允许的最大容量，Java虚拟机将会抛出一个stackoverflowError 异常。
- 如果本地方法栈可以动态扩展，并且在尝试扩展的时候无法申请到足够的内存，或者在创建新的线程时没有足够的内存去创建对应的本地方法栈，那么Java虚拟机将会抛出一个outofMemoryError异常。

当某个线程调用一个本地方法时，它就进入了一个全新的并且不再受虚拟机限制的世界。它和虚拟机拥有同样的权限。如下图所示。

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202207121155792.png" alt="image-20210611171210708" />

- 本地方法可以通过本地方法接口来访问虚拟机内部的运行时数据区。
- 它甚至可以直接使用本地处理器中的寄存器。
- 直接从本地内存的堆中分配任意数量的内存。

并不是所有的JVM都支持本地方法。因为Java虚拟机规范并没有明确要求本地方法栈的使用语言、具体实现方式、数据结构等。**如果JVM产品不打算支持native方法，也可以无需实现本地方法栈**。



***

# 堆（Heap）

## 定义

**通过new关键字创建对象都会使用堆内存。特点：**

- 它是线程共享的，堆中对象都需要考虑线程安全的问题。
- Java堆区在JVM启动的时候即被创建，其空间大小也就确定了。是JVM管理的最大一块内存空间。

### 堆参数设置

```
-Xms //用来设置堆空间（年轻代+老年代）的初始内存大小
-X： //是jvm运行参数
ms： //memory start
-Xmx：//用来设置堆空间（年轻代+老年代）的最大内存大小
```

- 一旦堆区中的内存大小超过“-xmx"所指定的最大内存时，将会抛出outofMemoryError异常。
- 通常会将`-Xms`和`-Xmx`两个参数配置相同的值，其目的是**为了能够在ava垃圾回收机制清理完堆区后不需要重新分隔计算堆区的大小，从而提高性能**。
- 默认情况下:
  - 初始内存大小：物理电脑内存大小/64
  - 最大内存大小：物理电脑内存大小/4



### 堆内存细分

**堆空间内部结构，JDK1.8之前永久代，1.8之后永久代替换成元空间。如下图所示。**

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202207121155793.png" alt="image-20210611175149235" />

**Java 7及之前堆内存逻辑上分为三部分：新生区+养老区+永久区**

- Young Generation Space 新生区 Young/New 又被划分为Eden区和Survivor区
- Tenure generation space 养老区 Old/Tenure
- Permanent Space永久区 Perm

**Java 8及之后堆内存逻辑上分为三部分：新生区+养老区+元空间**

- Young Generation Space：新生区 Young/New 又被划分为Eden区和Survivor区
- Tenure generation space： 养老区 Old/Tenure
- Meta Space： 元空间 Meta

`约定：新生区=新生代=年轻代；养老区=老年区=老年代；永久区=永久代。`

> **年轻代与老年代**

存储在JVM中的Java对象可以被划分为两类：

- 一类是生命周期较短的瞬时对象，这类对象的创建和消亡都非常迅速。生命周期短的，及时回收即可。
- 另外一类对象的生命周期却非常长，在某些极端的情况下还能够与JVM的生命周期保持一致。

Java堆区进一步细分的话，可以划分为`年轻代（YoungGen）`和`老年代（oldGen）`。

其中年轻代又可以划分为：`Eden(伊甸园区)`、`Survivor0空间`和`Survivor1空间`（有时也叫做from区、to区）。如下图所示。

![image-20210611175642041](https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202207121155794.png)

下面这参数开发中一般不会调：

![image-20210611175730724](https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202207121155795.png)

- Eden -> From ->To :  
  - 8:1:1

- 新生代 -> 老年代：
  - 1:2


配置新生代与老年代在堆结构的占比：

- 默认`-XX:NewRatio=2`，表示新生代占1，老年代占2，新生代占整个堆的1/3 。
- 可以修改`-XX:NewRatio=4`，表示新生代占1，老年代占4，新生代占整个堆的1/5 。

`当发现在整个项目中，生命周期长的对象偏多，那么就可以通过调整老年代的大小，来进行调优。`

**几乎所有的Java对象都是在Eden区被new出来的**。绝大部分的Java对象的销毁都在新生代进行了。（有些大的对象在Eden区无法存储时候，将直接进入老年代）



### 图解对象分配过程

**概念**

为新对象分配内存是一件非常严谨和复杂的任务，JM的设计者们不仅需要考虑内存如何分配、在哪里分配等问题，并且由于内存分配算法与内存回收算法密切相关，所以还需要考虑GC执行完内存回收后是否会在内存空间中产生内存碎片。

- new的对象先放伊甸园区。此区有大小限制。
- 当伊甸园的空间填满时，程序又需要创建对象，JVM的垃圾回收器将对伊甸园区进行垃圾回收（**Minor GC**）,将伊甸园区中的不再被其它对象所引用的对象进行销毁。再加载新得对象放到伊甸园区。
- 然后将伊甸园区中的剩余对象移动到幸存者0区。
- 如果再次触发垃圾回收，此时上次幸存下来的放到幸存者0区的，如果没有回收，就会放到幸存者1区。
- 如果再次经历垃圾回收，此时会重新放回幸存者0区，接着再去幸存者1区。
- 啥时候能去养老区呢？可以设置次数：`-XX:MaxTenuringThreshold=N`，默认15次。
- 在养老区，相对悠闲。当养老区内存不足时，再次触发**Major GC**进行养老区的内存清理。
- 若养老区执行了Major GC/Full GC之后，发现依然无法进行对象的保存，就会产生OOM异常。

**图解过程**

我们创建的对象，一般都是存放在Eden区的，当我们Eden区满了后，就会触发GC操作，一般被称为 **YGC / Minor GC操作**。如下图所示。

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202207121155796.png" alt="image-20210611181650259" />

当我们进行一次垃圾收集后，红色的将会被回收，而绿色的还会被占用着，存放在S0(Survivor From)区。同时我们给每个对象设置了一个年龄计数器，一次回收后就是1。

同时Eden区继续存放对象，当Eden区再次存满的时候，又会触发一个Minor GC操作，此时GC将会把 Eden和Survivor From中的对象 进行一次收集，把存活的对象放到 Survivor To区，同时让年龄 + 1。

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202207121155797.png" alt="image-20210611181731676" />

我们继续不断的进行对象生成 和 垃圾回收，当Survivor中的对象的年龄达到15的时候，将会触发一次 Promotion晋升的操作，也就是将年轻代中的对象晋升到老年代中。

![image-20210611181748862](https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202207121155798.png)



**思考：幸存区区满了后？**

**特别注意**：在Eden区满了的时候，才会触发Minor GC，而幸存者区满了后，不会触发Minor GC操作。

如果Survivor区满了后，将会触发一些特殊的规则，也就是可能直接晋升老年代。举例：

- 以当兵为例，正常人的晋升可能是 ： 新兵 -> 班长 -> 排长 -> 连长
- 但是也有可能有些人因为做了非常大的贡献，直接从 新兵 -> 排长

### 对象分配的特殊情况

![image-20200707091058346](https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202208301434451.png)

触发YGC，幸存者区就会进行回收，不会主动进行回收。

超大对象eden放不下，就要看Old区大小是否可以放下；

old区也放不下，需要Full GC。



## 堆内存溢出

**java.lang.OutofMemoryError** ：java heap space. 堆内存溢出

示例代码：

```java
import java.util.ArrayList;
import java.util.List;

/**
 * 演示堆内存溢出 java.lang.OutOfMemoryError: Java heap space
 * -Xmx8m
 */
public class Demo1_5 {

    public static void main(String[] args) {
        int i = 0;
        try {
            List<String> list = new ArrayList<>();
            String a = "hello";
            while (true) {
                list.add(a); // hello, hellohello, hellohellohellohello ...
                a = a + a;  // hellohellohellohello
                i++;
            }
        } catch (Throwable e) {
            e.printStackTrace();
            System.out.println(i);
        }
    }
}

```



## 堆内存诊断工具

**常用工具**

- JDK命令行

  - jps 工具
    查看当前系统中有哪些 java 进程

  - jmap 工具
    查看堆内存占用情况 jmap - heap 进程id


- jconsole 工具
  图形界面的，多功能的监测工具，可以连续监测
- Java Flight Recorder（实时监控）
- **jvisualvm（推荐）**
- **Jprofiler（推荐）**

**JDK命令行在IDEA中操作流程为：**

- 在Terminal命令框中输入：jps -> jmap -heap 进程id 。
- 然后可以输入：jconsole或者jvisualvm（推荐）  可打开图形化工具 。

**jvisualvm使用**

打开cmd窗口，输入`jvisualvm`即可打开VisualVM图形化界面。

点击`工具`->`插件`->`可用插件`，安装Visual GC插件即可查看Eden、S0、S1、Old、Metaspace的动态变化。

![image-20220830145932241](https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202208301459073.png)

**示例代码**

```java
import java.util.ArrayList;
import java.util.List;

/**
 * 演示查看对象个数 堆转储 dump
 */
public class Demo1_13 {

    public static void main(String[] args) throws InterruptedException {
        List<Student> students = new ArrayList<>();
        for (int i = 0; i < 200; i++) {
            students.add(new Student());
		// Student student = new Student();
        }
        Thread.sleep(1000000000L);
    }
}
class Student {
    private byte[] big = new byte[1024*1024];
}

```

## 堆空间分代思想

为什么要把Java堆分代？不分代就不能正常工作了吗？经研究，不同对象的生命周期不同。70%-99%的对象是临时对象。

- 新生代：有Eden、两块大小相同的survivor（又称为from/to，s0/s1）构成，to总为空。 
- 老年代：存放新生代中经历多次GC仍然存活的对象。

![image-20200707101511025](https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202208301550191.png)

其实不分代完全可以，分代的唯一理由就是优化GC性能。如果没有分代，那所有的对象都在一块，就如同把一个学校的人都关在一个教室。GC的时候要找到哪些对象没用，这样就会对堆的所有区域进行扫描。而很多对象都是朝生夕死的，如果分代的话，把新创建的对象放到某一地方，当GC的时候先把这块存储“朝生夕死”对象的区域进行回收，这样就会腾出很大的空间出来。

![image-20200707101543871](https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202208301551114.png)



## 内存分配策略

如果对象在Eden出生并经过第一次Minor GC后仍然存活，并且能被Survivor容纳的话，将被移动到survivor空间中，并将对象年龄设为1。对象在survivor区中每熬过一次MinorGC，年龄就增加1岁，当它的年龄增加到一定程度（默认为15岁，其实每个JVM、每个GC都有所不同）时，就会被晋升到老年代

对象晋升老年代的年龄阀值，可以通过选项`-xx:MaxTenuringThreshold`来设置

针对不同年龄段的对象分配原则如下所示：

- 优先分配到Eden
  - 开发中比较长的字符串或者数组，会直接存在老年代，但是因为新创建的对象 都是 朝生夕死的，所以这个大对象可能也很快被回收，但是因为老年代触发Major GC的次数比 Minor GC要更少，因此可能回收起来就会比较慢
- 大对象直接分配到老年代
  - 尽量避免程序中出现过多的大对象
- 长期存活的对象分配到老年代
- 动态对象年龄判断
  - 如果survivor区中相同年龄的所有对象大小的总和大于Survivor空间的一半，年龄大于或等于该年龄的对象可以直接进入老年代，无须等到MaxTenuringThreshold 中要求的年龄。

**空间分配担保**： `-Xx:HandlePromotionFailure`

- 在发生Minor GC之前，虚拟机会检查老年代最大可用的连续空间，是否大于新生代所有对象的总空间
  - 如果大于，则此次Minor GC是安全的
  - 如果小于，则查看`-XX:HandlePromotionFailure`设置是否允许担保失败
    - true
      - 会继续检查老年代最大可用连续空间是否大于历次晋升到老年代的对象的平均大小
      - 大于，则尝试进行一次Minor GC，但是这次Minor GC依然是有风险的
      - 小于，则改为进行一次Full GC
    - false
      - 则改为进行一次Full GC
  - jdk6update24之后，这个参数不会再影响到虚拟机的空间分配担保策略。
    - 规则改为只要老年代的连续空间大于新生代对象总大小，或者历次晋升的平均大小，就会进行Minor GC
    - 否则进行Full GC



## 为对象分配内存TLAB

### 堆空间都是共享的么

不一定，因为还有TLAB这个概念，在堆中划分出一块区域，为每个线程所独占。

### 为什么有TLAB

**TLAB**：Thread Local Allocation Buffer，也就是为每个线程单独分配了一个缓冲区。

堆区是线程共享区域，任何线程都可以访问到堆区中的共享数据；

由于对象实例的创建在JVM中非常频繁，因此在并发环境下从堆区中划分内存空间是线程不安全的；

为避免多个线程操作同一地址，需要使用加锁等机制，进而影响分配速度。

### 什么是TLAB

从内存模型而不是垃圾收集的角度，对Eden区域继续进行划分，JVM为每个线程分配了一个私有缓存区域，它包含在Eden空间内。

多线程同时分配内存时，使用TLAB可以避免一系列的非线程安全问题，同时还能够提升内存分配的吞吐量，因此我们可以将这种内存分配方式称之为**快速分配策略**。

据我所知所有OpenJDK衍生出来的JVM都提供了TLAB的设计。

![image-20200707103547712](https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202208301614875.png)

尽管不是所有的对象实例都能够在TLAB中成功分配内存，但JVM确实是将TLAB作为内存分配的首选。

在程序中，开发人员可以通过选项`-Xx:UseTLAB`设置是否开启TLAB空间。

默认情况下，TLAB空间的内存非常小，仅占有整个Eden空间的1，当然我们可以通过选项`-Xx:TLABWasteTargetPercent`设置TLAB空间所占用Eden空间的百分比大小。

一旦对象在TLAB空间分配内存失败时，JVM就会尝试着通过使用加锁机制确保数据操作的原子性，从而直接在Eden空间中分配内存。

###  TLAB分配过程

对象首先是通过TLAB开辟空间，如果不能放入，那么需要通过Eden来进行分配

![image-20200707104253530](https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202208301614001.png)

## 堆是分配对象的唯一选择吗

### 逃逸分析

在《深入理解Java虚拟机》中关于Java堆内存有这样一段描述：

随着JIT编译期的发展与逃逸分析技术逐渐成熟，栈上分配、标量替换优化技术将会导致一些微妙的变化，所有的对象都分配到堆上也渐渐变得不那么“绝对”了。

在Java虚拟机中，对象是在Java堆中分配内存的，这是一个普遍的常识。但是，有一种特殊情况，那就是如果经过逃逸分析（Escape Analysis）后发现，一个对象并没有逃逸出方法的话，那么就可能被优化成**栈上分配**。这样就无需在堆上分配内存，也无须进行垃圾回收了。这也是最常见的堆外存储技术。

此外，前面提到的基于openJDk深度定制的TaoBaovm，其中创新的GCIH（GC invisible heap）技术实现off-heap，将生命周期较长的Java对象从heap中移至heap外，并且GC不能管理GCIH内部的Java对象，以此达到降低GC的回收频率和提升GC的回收效率的目的。

如何将堆上的对象分配到栈，需要使用逃逸分析手段。

这是一种可以有效减少Java程序中同步负载和内存堆分配压力的跨函数全局数据流分析算法。通过逃逸分析，Java Hotspot编译器能够分析出一个新的对象的引用的使用范围从而决定是否要将这个对象分配到堆上。逃逸分析的基本行为就是分析对象动态作用域：

- 当一个对象在方法中被定义后，对象只在方法内部使用，则认为没有发生逃逸。
- 当一个对象在方法中被定义后，它被外部方法所引用，则认为发生逃逸。例如作为调用参数传递到其他地方中。

**逃逸分析举例**

没有发生逃逸的对象，则可以分配到栈上，随着方法执行的结束，栈空间就被移除，每个栈里面包含了很多栈帧，也就是发生逃逸分析

```java
public void my_method() {
    V v = new V();
    // use v
    // ....
    v = null;
}
```

针对下面的代码

```java
public static StringBuffer createStringBuffer(String s1, String s2) {
    StringBuffer sb = new StringBuffer();
    sb.append(s1);
    sb.append(s2);
    return sb;
}
```

如果想要StringBuffer sb不发生逃逸，可以这样写

```java
public static String createStringBuffer(String s1, String s2) {
    StringBuffer sb = new StringBuffer();
    sb.append(s1);
    sb.append(s2);
    return sb.toString();
}
```

完整的逃逸分析代码举例

```java
/**
 * 逃逸分析
 * 如何快速的判断是否发生了逃逸分析，大家就看new的对象是否在方法外被调用。
 */
public class EscapeAnalysis {

    public EscapeAnalysis obj;

    /**
     * 方法返回EscapeAnalysis对象，发生逃逸
     * @return
     */
    public EscapeAnalysis getInstance() {
        return obj == null ? new EscapeAnalysis():obj;
    }

    /**
     * 为成员属性赋值，发生逃逸
     */
    public void setObj() {
        this.obj = new EscapeAnalysis();
    }

    /**
     * 对象的作用于仅在当前方法中有效，没有发生逃逸
     */
    public void useEscapeAnalysis() {
        EscapeAnalysis e = new EscapeAnalysis();
    }

    /**
     * 引用成员变量的值，发生逃逸
     */
    public void useEscapeAnalysis2() {
        EscapeAnalysis e = getInstance();
        // getInstance().XXX  发生逃逸
    }
}
```

**参数设置**

在JDK 1.7 版本之后，HotSpot中默认就已经开启了逃逸分析

如果使用的是较早的版本，开发人员则可以通过：

- 选项`-xx：+DoEscapeAnalysis`显式开启逃逸分析
- 通过选项`-xx：+PrintEscapeAnalysis`查看逃逸分析的筛选结果

### 栈上分配

JIT编译器在编译期间根据逃逸分析的结果，发现如果一个对象并没有逃逸出方法的话，就可能被优化成栈上分配。分配完成后，继续在调用栈内执行，最后线程结束，栈空间被回收，局部变量对象也被回收。这样就无须进行垃圾回收了。

**开启逃逸分析举例** 

```java
/**
 * 栈上分配
 * -Xmx1G -Xms1G -XX:-DoEscapeAnalysis -XX:+PrintGCDetails
 */
class User {
    private String name;
    private String age;
    private String gender;
    private String phone;
}
public class StackAllocation {
    public static void main(String[] args) throws InterruptedException {
        long start = System.currentTimeMillis();
        for (int i = 0; i < 100000000; i++) {
            alloc();
        }
        long end = System.currentTimeMillis();
        System.out.println("花费的时间为：" + (end - start) + " ms");

        // 为了方便查看堆内存中对象个数，线程sleep
        Thread.sleep(10000000);
    }

    private static void alloc() {
        User user = new User();
    }
}
```

设置JVM参数，表示未开启逃逸分析

```
-Xmx1G -Xms1G -XX:-DoEscapeAnalysis -XX:+PrintGCDetails
```

运行结果，同时还触发了GC操作

```
花费的时间为：664 ms
```

然后查看内存的情况，发现有大量的User存储在堆中

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202208301747433.png)

我们在开启逃逸分析

```
-Xmx1G -Xms1G -XX:+DoEscapeAnalysis -XX:+PrintGCDetails
```

然后查看运行时间，我们能够发现花费的时间快速减少，同时不会发生GC操作

```
花费的时间为：5 ms
```

然后在看内存情况，我们发现只有很少的User对象，说明User发生了逃逸，因为他们存储在栈中，随着栈的销毁而消失

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202208301748535.png)

### 锁消除

线程同步的代价是相当高的，同步的后果是降低并发性和性能。

在动态编译同步块的时候，JIT编译器可以借助逃逸分析来判断同步块所使用的锁对象是否只能够被一个线程访问而没有被发布到其他线程。如果没有，那么JIT编译器在编译这个同步块的时候就会取消对这部分代码的同步。这样就能大大提高并发性和性能。这个取消同步的过程就叫同步省略，也叫**锁消除**。

例如下面的代码

```java
public void f() {
    Object hellis = new Object();
    synchronized(hellis) {
        System.out.println(hellis);
    }
}
```

代码中对hellis这个对象加锁，但是hellis对象的生命周期只在f()方法中，并不会被其他线程所访问到，所以在JIT编译阶段就会被优化掉，优化成：

```java
public void f() {
    Object hellis = new Object();
	System.out.println(hellis);
}
```

我们将其转换成字节码

![image-20200707205634266](https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202208301753352.png)

### 分离对象和标量替换

标量（scalar）是指一个无法再分解成更小的数据的数据。Java中的原始数据类型就是标量。

相对的，那些还可以分解的数据叫做聚合量（Aggregate），Java中的对象就是聚合量，因为他可以分解成其他聚合量和标量。

在JIT阶段，如果经过逃逸分析，发现一个对象不会被外界访问的话，那么经过JIT优化，就会把这个对象拆解成若干个其中包含的若干个成员变量来代替。这个过程就是标量替换。

```java
public static void main(String args[]) {
    alloc();
}
class Point {
    private int x;
    private int y;
}
private static void alloc() {
    Point point = new Point(1,2);
    System.out.println("point.x" + point.x + ";point.y" + point.y);
}
```

以上代码，经过标量替换后，就会变成

```java
private static void alloc() {
    int x = 1;
    int y = 2;
    System.out.println("point.x = " + x + "; point.y=" + y);
}
```

可以看到，Point这个聚合量经过逃逸分析后，发现他并没有逃逸，就被替换成两个聚合量了。那么标量替换有什么好处呢？就是可以大大减少堆内存的占用。因为一旦不需要创建对象了，那么就不再需要分配堆内存了。 标量替换为栈上分配提供了很好的基础。

### 代码优化之标量替换

上述代码在主函数中进行了1亿次alloc。调用进行对象创建，由于User对象实例需要占据约16字节的空间，因此累计分配空间达到将近1.5GB。如果堆空间小于这个值，就必然会发生GC。使用如下参数运行上述代码：

```
-server -Xmx100m -Xms100m -XX:+DoEscapeAnalysis -XX:+PrintGC -XX:+EliminateAllocations
```

这里设置参数如下：

- 参数-server：启动Server模式，因为在server模式下，才可以启用逃逸分析。
- 参数-XX:+DoEscapeAnalysis：启用逃逸分析
- 参数-Xmx10m：指定了堆空间最大为10MB
- 参数-XX:+PrintGC：将打印Gc日志。
- 参数一xx：+EliminateAllocations：开启了标量替换（默认打开），允许将对象打散分配在栈上，比如对象拥有id和name两个字段，那么这两个字段将会被视为两个独立的局部变量进行分配

### 逃 逸分析的不足

关于逃逸分析的论文在1999年就已经发表了，但直到JDK1.6才有实现，而且这项技术到如今也并不是十分成熟的。

其根本原因就是无法保证逃逸分析的性能消耗一定能高于他的消耗。虽然经过逃逸分析可以做标量替换、栈上分配、和锁消除。但是逃逸分析自身也是需要进行一系列复杂的分析的，这其实也是一个相对耗时的过程。 一个极端的例子，就是经过逃逸分析之后，发现没有一个对象是不逃逸的。那这个逃逸分析的过程就白白浪费掉了。

虽然这项技术并不十分成熟，但是它也是即时编译器优化技术中一个十分重要的手段。注意到有一些观点，认为通过逃逸分析，JVM会在栈上分配那些不会逃逸的对象，这在理论上是可行的，但是取决于JvM设计者的选择。据我所知，oracle Hotspot JVM中并未这么做，这一点在逃逸分析相关的文档里已经说明，所以可以明确所有的对象实例都是创建在堆上。

目前很多书籍还是基于JDK7以前的版本，JDK已经发生了很大变化，intern字符串的缓存和静态变量曾经都被分配在永久代上，而永久代已经被元数据区取代。但是，intern字符串缓存和静态变量并不是被转移到元数据区，而是直接在堆上分配，所以这一点同样符合前面一点的结论：对象实例都是分配在堆上。

## 小结

堆空间的参数设置：

- -XX:+PrintFlagsInitial：查看所有的参数的默认初始值

- -XX:+PrintFlagsFinal：查看所有的参数的最终值（可能会存在修改，不再是初始值）

- -Xms:初始堆空间内存（默认为物理内存的1/64）

- -Xmx:最大堆空间内存（默认为物理内存的1/4）

- -Xmn:设置新生代的大小。（初始值及最大值）

- -XX:NewRatio：配置新生代与老年代在堆结构的占比

- -XX:SurvivorRatio：设置新生代中Eden和S0/S1空间的比例

- -XX:MaxTenuringThreshold：设置新生代垃圾的最大年龄

- -XX:+PrintGCDetails：输出详细的GC处理日志

  打印gc简要信息：①-Xx：+PrintGC ② - verbose:gc

- -XX:HandlePromotionFalilure：是否设置空间分配担保

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202207121155799.png" alt="image-20210818153240854" />

总结：

- 针对幸存者s0，s1区的总结：复制之后有交换，谁空谁是to
- 关于垃圾回收：频繁在新生区收集，很少在老年代收集，几乎不再永久代和元空间进行收集
- 新生代采用复制算法的目的：是为了减少内碎片

***

# 方法区（Method Area）

## 定义

《Java虚拟机规范》中明确说明：“尽管所有的方法区在逻辑上是属于堆的一部分，但一些简单的实现可能不会选择去进行垃圾收集或者进行压缩。”但对于HotSpotJVM而言，**方法区还有一个别名叫做Non-Heap（非堆）**，目的就是要和堆分开。

方法区主要存放的是 Class，而堆中主要存放的是实例化的对象。

- 方法区（Method Area）与Java堆一样，是各个线程共享的内存区域
- 方法区在JVM启动的时候被创建，并且它的实际的物理内存空间中和Java堆区一样都可以是不连续的
- 方法区的大小，跟堆空间一样，可以选择固定大小或者可扩展
- 方法区的大小决定了系统可以保存多少个类，如果系统定义了太多的类，导致方法区溢出，虚拟机同样会抛出内存溢出错误：java.lang.OutofMemoryError：PermGen space 或者 java.lang.OutOfMemoryError：Metaspace
  - 加载大量的第三方的jar包
  - Tomcat部署的工程过多（30~50个）
  - 大量动态的生成反射类


- 关闭JVM就会释放这个区域的内存。



## 方法区的演进与内部结构

### HotSpot中方法区的演进

Hotspot中方法区的变化：

| JDK1.6及以前 | 有永久代，静态变量存储在永久代上                             |
| ------------ | ------------------------------------------------------------ |
| JDK1.7       | 有永久代，但已经逐步 “去永久代”，字符串常量池，静态变量移除，保存在堆中 |
| JDK1.8       | 无永久代，类型信息，字段，方法，常量保存在本地内存的元空间，但字符串常量池、静态变量仍然在堆中。 |

JDK6的时候

![image-20200708211541300](https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202208311123713.png)

JDK7的时候

![image-20200708211609911](https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202208311124485.png)

JDK8的时候，元空间大小只受物理内存影响

![image-20220901215910350](https://studyimages.oss-cn-beijing.aliyuncs.com/others/20220901215910.png)

- 在JDK 1.7及以前，习惯上把`方法区`，称为`永久代`。jdk8开始，使用元空间取代了永久代。元空间与永久代最大的区别在于：元空间不在虚拟机设置的内存中，而是使用`本地内存`。
- JDK 1.8后元空间存放在堆外内存中，把方法区的`StringTable`转移到了堆中。

####  为什么永久代要被元空间替代

为永久代设置空间大小是很难确定的。

- 在某些场景下，如果动态加载类过多，容易产生Perm区的oom。比如某个实际Web工 程中，因为功能点比较多，在运行过程中，要不断动态加载很多类，经常出现致命错误：`Exception in thread‘dubbo client x.x connector'java.lang.OutOfMemoryError:PermGen space`
- 而元空间和永久代之间最大的区别在于：**元空间并不在虚拟机中，而是使用本地内存**。 因此，默认情况下，元空间的大小仅受本地内存限制。

对永久代进行调优是很困难的

- 主要是为了降低Full GC

#### StringTable为什么要调整位置

- jdk7中将StringTable放到了堆空间中。因为永久代的回收效率很低，在full gc的时候才会触发。而full gc是老年代的空间不足、永久代不足时才会触发。

- 这就导致StringTable回收效率不高。而我们开发中会有大量的字符串被创建，回收效率低，导致永久代内存不足。放到堆里，能及时回收内存。

### 方法区内部结构

![image-20200708161728320](https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202208311101078.png)

《深入理解Java虚拟机》书中对方法区（Method Area）存储内容描述如下：它用于存储已被虚拟机加载的类型信息、常量、静态变量、即时编译器编译后的代码缓存等。

![image-20200708161856504](https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202208311056177.png)

#### 类型信息

对每个加载的类型（类class、接口interface、枚举enum、注解annotation），JVm必须在方法区中存储以下类型信息：

- 这个类型的完整有效名称（全名=包名.类名）
- 这个类型直接父类的完整有效名（对于interface或是java.lang.object，都没有父类）
- 这个类型的修饰符（public，abstract，final的某个子集）
- 这个类型直接接口的一个有序列表

#### 域信息

- JVM必须在方法区中保存类型的所有域的相关信息以及域的声明顺序。

- 域的相关信息包括：`域名称`、`域类型`、`域修饰符`（public，private，protected，static，final，volatile，transient的某个子集）

#### 方法信息

JVM必须保存所有方法的以下信息，同域信息一样包括声明顺序：

- 方法名称
- 方法的返回类型（或void）
- 方法参数的数量和类型（按顺序）
- 方法的修饰符（public，private，protected，static，final，synchronized，native，abstract的一个子集）
- 方法的字节码（bytecodes）、操作数栈、局部变量表及大小（abstract和native方法除外）
- 异常表（abstract和native方法除外）

每个异常处理的开始位置、结束位置、代码处理在程序计数器中的偏移地址、被捕获的异常类的常量池索引。

#### non-final的类变量

静态变量和类关联在一起，**随着类的加载而加载**，他们成为类数据在逻辑上的一部分；

类变量被类的所有实例共享，即使没有类实例时，你也可以访问它。

```java
/**
 * non-final的类变量
 *
 */
public class MethodAreaTest {
    public static void main(String[] args) {
        Order order = new Order();
        order.hello();
        System.out.println(order.count);
    }
}
class Order {
    public static int count = 1;
    public static final int number = 2;
    public static void hello() {
        System.out.println("hello!");
    }
}
```

如上代码所示，即使我们把order设置为null，也不会出现空指针异常。

#### 全局常量

全局常量就是使用 static final 进行修饰

**被声明为final的类变量**的处理方法则不同，每个全局常量**在编译的时候就会被分配**了。

#### 运行时常量池 VS 常量池

运行时将常量池加载到方法区，就是运行时常量池。

![image-20200708171151384](https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202208311115963.png)

- 方法区，内部包含了运行时常量池
- 字节码文件，内部包含了常量池
- 要弄清楚方法区，需要理解清楚ClassFile，因为加载类的信息都在方法区。
- 要弄清楚方法区的运行时常量池，需要理解清楚ClassFile中的常量池。

## 方法区内存大小与OOM

### 设置方法区大小

- **JDK7及以前**
  1. 通过`-XX:Permsize`来设置永久代初始分配空间。默认值是20.75M。
  2. `-XX:MaxPermsize`来设定永久代最大可分配空间。32位机器默认是64M，64位机器模式是82M。
  3. 当JVM加载的类信息容量超过了这个值，会报异常`OutofMemoryError:PermGen space`。

- **JDK8以后**

  元数据区大小可以使用以下两个参数指定

  ```
  -XX:MetaspaceSize
  -XX:MaxMetaspaceSize
  ```

  默认值依赖于平台。windows下，`-XX:MetaspaceSize`是21M，`-XX:MaxMetaspaceSize`的值是-1，即没有限制。
  
  - -XX:MetaspaceSize：设置初始的元空间大小。对于一个64位的服务器端JVM来说，其默认的`-xx:MetaspaceSize`值为21MB。这就是初始的高水位线，一旦触及这个水位线，Full GC将会被触发并卸载没用的类（即这些类对应的类加载器不再存活）然后这个高水位线将会重置。新的高水位线的值取决于GC后释放了多少元空间。如果释放的空间不足，那么在不超过`MaxMetaspaceSize`时，适当提高该值。如果释放空间过多，则适当降低该值。
  - 如果初始化的高水位线设置过低，上述高水位线调整情况会发生很多次。通过垃圾回收器的日志可以观察到FullGC多次调用。**为了避免频繁地GC，建议将`-XX:MetaspaceSize`设置为一个相对较高的值**。

### 方法区内存溢出示例代码

```java
package cn.itcast.jvm.t1.metaspace;

import jdk.internal.org.objectweb.asm.ClassWriter;
import jdk.internal.org.objectweb.asm.Opcodes;

/**
 * 演示元空间内存溢出 java.lang.OutOfMemoryError: Metaspace
 * -XX:MaxMetaspaceSize=8m
 */
public class Demo1_8 extends ClassLoader { // 可以用来加载类的二进制字节码
    public static void main(String[] args) {
        int j = 0;
        try {
            Demo1_8 test = new Demo1_8();
            for (int i = 0; i < 10000; i++, j++) {
                // ClassWriter 作用是生成类的二进制字节码
                ClassWriter cw = new ClassWriter(0);
                // 版本号， public， 类名, 包名, 父类， 接口
                cw.visit(Opcodes.V1_8, Opcodes.ACC_PUBLIC, "Class" + i, null, "java/lang/Object", null);
                // 返回 byte[]
                byte[] code = cw.toByteArray();
                // 执行了类的加载
                test.defineClass("Class" + i, code, 0, code.length); // Class 对象
            }
        } finally {
            System.out.println(j);
        }
    }
}

```



### 如何解决这些OOM

- 要解决OOM异常或Heap Space的异常，一般的手段是首先通过内存映像分析工具（如jvisualvm）对dump出来的堆转储快照进行分析，重点是确认内存中的对象是否是必要的，也就是要先分清楚到底是出现了`内存泄漏`（Memory Leak）还是`内存溢出`（Memory Overflow，简称OOM）。
  - **内存泄漏**：有大量的引用指向某些对象，但是这些对象以后不会使用了，但是因为它们还和GC ROOT有关联，所以导致以后这些对象也不会被回收，这就是内存泄漏的问题。
  - **内存溢出**：是指应用系统中存在无法回收的[内存](https://baike.baidu.com/item/内存/103614?fromModule=lemma_inlink)或使用的[内存](https://baike.baidu.com/item/内存/103614?fromModule=lemma_inlink)过多，最终使得程序运行要用到的[内存](https://baike.baidu.com/item/内存/103614?fromModule=lemma_inlink)大于能提供的最大内存。此时[程序](https://baike.baidu.com/item/程序/13831935?fromModule=lemma_inlink)就运行不了，系统会提示内存溢出。
- 如果是内存泄漏，可进一步通过工具查看泄漏对象到GC Roots的引用链。于是就能找到泄漏对象是通过怎样的路径与GC Roots相关联并导致垃圾收集器无法自动回收它们的。掌握了泄漏对象的类型信息，以及GC Roots引用链的信息，就可以比较准确地定位出泄漏代码的位置。
- 如果不存在内存泄漏，换句话说就是内存中的对象确实都还必须存活着，那就应当检查虚拟机的堆参数（-Xmx与-Xms），与机器物理内存对比看是否还可以调大，从代码上检查是否存在某些对象生命周期过长、持有状态时间过长的情况，尝试减少程序运行期的内存消耗。

**容易OOM的场景**

- Spring
- MyBatis

## 常量池

**常量池**：就是一张表，虚拟机指令根据这张常量表找到要执行的`类名`、`方法名`、`参数类型`、`字面量`等信息！

![image-20200708172357052](https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202208311118693.png)

一个有效的字节码文件中除了包含`类的版本信息`、`字段`、`方法`以及`接口`等描述符信息外，还包含一项信息就是`常量池表`（Constant Pool Table），包括各种`字面量`和对`类型`、`域`和`方法的符号引用`。

**为什么需要常量池**

一个java源文件中的类、接口，编译后产生一个字节码文件。而Java中的字节码需要数据支持，通常这种数据会很大以至于不能直接存到字节码里，换另一种方式，可以存到常量池，这个字节码包含了指向常量池的引用。在动态链接的时候会用到运行时常量池。



## 运行时常量池

**运行时常量池**：常量池是 *.class 文件中的，当该类被加载，它的常量池信息就会放入运行时常量池，并把里面的符号地址变为真实地址（即#1这种符号）！

- 运行时常量池是方法区的一部分
- 常量池表是class文件的一部分，用于存放编译期生成的各种字面量和符号引用，这部分内容将在类加载后存放到方法区的运行时常量池中
- 在加载类和接口到虚拟机后，就会创建对应的运行时常量池
- JVM为每个已加载的类型都维护一个常量池，池中的数据像数组项一样，通过索引访问
- 运行时常量池，相对于class文件常量池的另一个重要特征是：具备动态性（例如：`String.intern`可以将字符串也放入运行时常量池）
- 当创建类或接口的运行时常量池，如果构造运行时常量池所需的内存空间超过了方法区所能提供的最大值。则JVM会抛出OOM异常
- 这里注意，常量池数量为N，则索引为1到N-1，



## StringTable 特性

[文章引荐](https://zhuanlan.zhihu.com/p/260939453)

**特点：**

- 常量池中的字符串仅是符号，`只有在被用到时才会被转为对象`
- 利用串池的机制，来避免重复创建字符串对象
- `字符串变量`拼接的原理是StringBuilder
- `字符串常量`拼接的原理是编译器优化
- 可以使用intern方法，主动将常量池中没有的字符串对象放入池中
- `注意`：无论是串池还是堆里面的字符串，都是对象

**示例代码**

```java
// StringTable [ "a", "b" ,"ab" ]  hashtable 结构，不能扩容
public class Demo1_22 {
    // 常量池中的信息，都会被加载到运行时常量池中， 这时 a b ab 都是常量池中的符号，还没有变为 java 字符串对象
    // ldc #2 会把 a 符号变为 "a" 字符串对象
    // ldc #3 会把 b 符号变为 "b" 字符串对象
    // ldc #4 会把 ab 符号变为 "ab" 字符串对象

    public static void main(String[] args) {
        String s1 = "a"; // 懒惰的
        String s2 = "b";
        String s3 = "ab";
        String s4 = s1 + s2; // new StringBuilder().append("a").append("b").toString()  new String("ab")
        String s5 = "a" + "b";  // javac 在编译期间的优化，结果已经在编译期确定为ab

        System.out.println(s3 == s5);

    }
}

```

常量池中的信息，都会被加载到运行时常量池中 . 但这时a 、b 、ab 仅是常量池中的符号，**还没有成为java字符串**。

```
0: ldc #2  // String a  
2: astore_1 
3: ldc #3  // String b  
5: astore_2 
6: ldc #4  // String ab  
8: astore_3 
9: return
```

1. 执行到 ldc #2 时，会把符号 a 变为 “a” 字符串对象，**并放入串池中**（hashtable结构 不可扩容）
2. 当执行到 ldc #3 时，会把符号 b 变为 “b” 字符串对象，并放入串池中
3. 当执行到 ldc #4 时，会把符号 ab 变为 “ab” 字符串对象，并放入串池中
4. 最终**StringTable [“a”, “b”, “ab”]**

**注意**：字符串对象的创建都是**懒惰的**，只有当运行到那一行字符串且在串池中不存在的时候（如 ldc #2）时，该字符串才会被创建并放入串池中。

**字符串延迟加载示例代码**

```java
/**
  * 创建完的字符串不会再创建出来
  */
public class TestString(){
    public static void main(String[] args){
        int x = args.length;
        System.out.println();//字符串个数2275

        System.out.println("1");
        System.out.println("2");
        System.out.println("3");
        System.out.println("4");
        System.out.println("5");
        System.out.println("6");
        System.out.println("7");
        System.out.println("8");
        System.out.println("9");
        System.out.println("0");
        System.out.println("1");
        System.out.println("2");
        System.out.println("3");
        System.out.println("4");
        System.out.println("5");
        System.out.println("6");
        System.out.println("7");
        System.out.println("8");
        System.out.println("9");
        System.out.println("0");
        System.out.println(x);  //字符串个数2285
    }
}
```



## StringTable 位置

**jdk1.6存在于常量池中，jdk1.8存在于堆中。**

**示例代码：**

```java
import java.util.ArrayList;
import java.util.List;

/**
 * 演示 StringTable 位置
 * 在jdk8下设置 -Xmx10m -XX:-UseGCOverheadLimit
 * 在jdk6下设置 -XX:MaxPermSize=10m
 */
public class Demo1_6 {

    public static void main(String[] args) throws InterruptedException {
        List<String> list = new ArrayList<String>();
        int i = 0;
        try {
            for (int j = 0; j < 260000; j++) {
                list.add(String.valueOf(j).intern());
                i++;
            }
        } catch (Throwable e) {
            e.printStackTrace();
        } finally {
            System.out.println(i);
        }
    }
}

```

参数说明:

```
-XX:MaxPermSize=10m //设置永久代最大值
-Xmx10m -XX:-UseGCOverheadLimit //关闭开关，演示堆内存溢出
```



## StringTable垃圾回收调优

因为StringTable是由HashTable实现的，所以可以**适当增加HashTable桶的个数**，来减少字符串放入串池所需要的时间。

```
-XX:StringTableSize=xxxx
```

考虑是否需要将字符串对象入池, 可以通过**intern方法减少重复入池** 。



***

# 直接内存

## 定义

- **不是虚拟机运行时数据区的一部分**，也不是《Java虚拟机规范》中定义的内存区域
- 直接内存是在Java堆外的、直接向系统申请的内存区间
- 来源于NIO，通过存在堆中的DirectByteBuffer操作Native内存
- 直接内存大小可以通过`MaxDirectMemorySize`设置
- 如果不指定，默认与堆的最大值`-Xmx`参数值一致

通常，访问直接内存的速度会优于Java堆。即读写性能高：

1. 因此出于性能考虑，读写频繁的场合可能会考虑使用直接内存
2. java的NIO库允许Java程序使用直接内存，用于数据缓冲区
3. 也可能导致OOM异常
   - 直接内存在堆外，所以大小不受限于-Xmx指定的最大堆大小
   - 但是系统内存是有限的，Java堆和直接内存的总和依然受限于操作系统能给出的最大内存

使用下列代码，直接分配本地内存空间：

```
int BUFFER = 1024*1024*1024; // 1GB
ByteBuffer byteBuffer = ByteBuffer.allocateDirect(BUFFER);
```

**缺点**

- 分配回收成本较高
- 不受JVM内存回收管理



## 基本使用

**文件读写流程**

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202207121155805.png" alt="image-20210612000941540" />

**使用了DirectBuffer**

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202207121155806.png" alt="image-20210612001323279" />

直接内存是操作系统和Java代码**都可以访问的一块区域**，无需将代码从系统内存复制到Java堆内存，从而提高了效率。



## 内存溢出

**示例代码**

```java
import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.List;


/**
 * 演示直接内存溢出
 */
public class Demo1_10 {
    static int _100Mb = 1024 * 1024 * 100;

    public static void main(String[] args) {
        List<ByteBuffer> list = new ArrayList<>();
        int i = 0;
        try {
            while (true) {
                ByteBuffer byteBuffer = ByteBuffer.allocateDirect(_100Mb);
                list.add(byteBuffer);
                i++;
            }
        } finally {
            System.out.println(i);
        }
        // 方法区是jvm规范， jdk6 中对方法区的实现称为永久代
        //                  jdk8 对方法区的实现称为元空间
    }
}
```



## 释放原理

直接内存的回收不是通过JVM的垃圾回收来释放的，而是通过**unsafe.freeMemory**来手动释放。

- 通过ByteBuffer申请1M的直接内存：

  ```
  ByteBuffer byteBuffer = ByteBuffer.allocateDirect(_1M);
  ```

- 但JVM并不能回收直接内存中的内容，它是如何实现回收的呢？

  **allocateDirect的实现**

  ```java
  public static ByteBuffer allocateDirect(int capacity) {     
  	return  new DirectByteBuffer(capacity); 
  }
  ```

  **DirectByteBuffer类**

  ```java
  DirectByteBuffer(int cap) { // package-private  
      super(-1, 0, cap, cap); 
      boolean pa = VM.isDirectMemoryPageAligned(); 
      int ps = Bits.pageSize(); 
      long size = Math.max(1L, (long)cap + (pa ? ps : 0));     
      Bits.reserveMemory(size, cap); 
  
      long base = 0; 
      try { 
      	base = unsafe.allocateMemory(size); //申请内存 
      } catch (OutOfMemoryError x) { 
          Bits.unreserveMemory(size, cap); 
      	throw x; 
      }
      unsafe.setMemory(base, size, (byte) 0); 
      if (pa && (base % ps != 0)) { 
      	// Round up to page boundary address = base + ps - (base & (ps - 1)); 
      } else { 
      	address = base; 
      } 
      cleaner = Cleaner.create(this, new Deallocator(base, size, cap)); //通过虚引用，来实现直接内存的释放，this为虚引用的实际对象 
      att = null; 
  }
  ```

  这里调用了一个Cleaner的create方法，且后台线程还会对虚引用的对象监测，如果虚引用的实际对象（这里是DirectByteBuffer）被回收以后，就会调用Cleaner的clean方法，来清除直接内存中占用的内存。

  ```java
  public void clean() { 
      if (remove(this)) { 
          try { this.thunk.run(); //调用run方法 
      } catch (final Throwable var2) { 
        AccessController.doPrivileged(new PrivilegedAction<Void>() { 
      	public Void run() { 
       	 if (System.err != null) { 
       	   (new Error("Cleaner terminated abnormally", var2)).printStackTrace(); 
        } 
       	 System.exit(1); 
       	 return  null; 
         } 
       }); 
      }
  ```

  对应对象的run方法：

  ```java
  public void run() { 
      if (address == 0) { 
      // Paranoia  
      return; 
   }
   	unsafe.freeMemory(address); //释放直接内存中占用的内存    address = 0; 
  	Bits.unreserveMemory(size, capacity); 
  }
  
  
  ```

**直接内存的回收机制总结**

  - 使用了Unsafe类来完成直接内存的分配回收，回收需要主动调用freeMemory方法。
  - ByteBuffer的实现内部使用了Cleaner（虚引用）来检测ByteBuffer。一旦ByteBuffer被垃圾回收，那么会SReferenceHandler来调用Cleaner的clean方法调用freeMemory来释放内存。

  

  

  

  

  

  

  
