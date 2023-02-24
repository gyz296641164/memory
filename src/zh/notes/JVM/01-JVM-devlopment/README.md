# JDK和JRE

- **JDK**：我们可以把**java程序设计语言**、**Java虚拟机**、**Java类库**这三部分统称为JDK(Java Development Kit)。JDK是支持Java开发的最小环境。
- **JRE：**可以把Java类库API中的**JavaSE的API子集**和**Java虚拟机**这两部分统称为JRE(Java Runtime Environment)。

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202207121143043.png" alt="image-20210611160739750" style="zoom: 67%;" />



***

# Java代码执行流程



执行流程如图所示：

![image-20210611160853831](https://studyimages.oss-cn-beijing.aliyuncs.com/JVM/202207121143276.png)

- Java编译器编译过程中，任何一个节点执行失败就会造成编译失败。
- 虽然各个平台的Java虚拟机内部实现细节不尽相同，但是它们共同执行的字节码内容却是一样的。
- JVM的主要任务就是付责将字节码装载到其内部，解释/编译为对应平台上的机器指令（即：汇编语言）执行。
- Java虚拟机使用类加载器（Class Loader）装载class文件。
- 类加载完成之后，会进行字节码校验，字节码校验通过之后JVM解释器会把字节码翻译成机器码（即：汇编语言）交由操作系统执行。
- 但不是所有代码都是解释执行的，JVM对此作了优化/比如，以HotSpot虚拟机来说，它本身提供了**JIT编译器**。
- 有些方法和代码块是经常需要被调用的（也就是所谓的**热点代码**），引进了JIT编译器，而JIT编译器属于运行时编译。当JIT编译器完成第一次编译后，其会将字节码对应的机器码保存下来，下次可以直接使用。



***

# 虚拟机生命周期



## 虚拟机的启动

Java虚拟机的启动是通过引导类加载器（bootstrap class loader）创建一个初始类（initia class）来完成的，这个类是由虚拟机的具体实现指定的。



## 虚拟机的执行

- 一个运行中的Java虚拟机有着一个清晰的任务：执行Java程序。
- 程序开始执行时他才执行，程序结束时他就停止。
- 执行一个所谓的Java程序的时候，真真正正在执行的是一个叫做Java虚拟机的进行。



## 虚拟机的退出

有如下的几种情况：

- 程序正常执行结束。
- 程序在执行过程中遇到了异常或错误而异常终止。
- 由于操作系统出现错误而导致Java虚拟机进程终止。
- 某线程调用Runtime类或System类的exit方法，或Runtime类的halt方法，并且Java安全管理器也允许这次exit或halt操作。















