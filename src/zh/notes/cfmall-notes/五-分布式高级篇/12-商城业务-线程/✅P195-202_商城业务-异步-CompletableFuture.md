---
title: ✅P195-202_商城业务-异步-CompletableFuture
category:
  - 谷粒商城
date: 2024-02-13
---

<!-- more -->

## 1、开篇

本章目录：

- CompletableFuture-启动异步任务
- CompletableFuture-完成回调与异常感知
- CompletableFuture-handle最终处理
- CompletableFuture-线程串行化
- CompletableFuture-两任务组合-都要完成
- CompletableFuture-两任务组合-一个完成
- CompletableFuture-多任务组合

### 1.1 业务场景

查询商品详情页的逻辑比较复杂，有些数据还需要远程调用，必然需要花费更多的时间。

假如商品详情页的每个查询，需要如下标注的时间才能完成

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202303/image-20230326183054687.png#id=j1p43&originHeight=485&originWidth=650&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=#id=VKGgg&originHeight=485&originWidth=650&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

那么，用户需要 5.5s 后才能看到商品详情页的内容。很显然是不能接受的。

如果有多个线程同时完成这 6 步操作，也许只需要 1.5s 即可完成响应。

**1、2、3可以异步完成，4、5、6依赖于1的完成，4、5、6又可以异步完成。需要使用CompletableFuture进行异步编排**

### 1.2 Future

Future 是 Java 5 添加的类，用来描述一个异步计算的结果。你可以使用`isDone`方法检查计算是否完成，或者使用`get`阻塞住调用线程，直到计算完成返回结果，你也可以使用`cancel` 方法停止任务的执行。

虽然`Future`以及相关使用方法提供了异步执行任务的能力，但是对于结果的获取却是很不方便，只能通过阻塞或者轮询的方式得到任务的结果。阻塞的方式显然和我们的异步编程的初衷相违背，轮询的方式又会耗费无谓的 CPU 资源，而且也不能及时地得到计算结果，为什么不能用观察者设计模式当计算结果完成及时通知监听者呢？

很多语言，比如 Node.js，采用回调的方式实现异步编程。Java 的一些框架，比如 Netty，自己扩展了 Java 的 `Future`接口，提供了`addListener`等多个扩展方法；Google guava 也提供了通用的扩展 Future；Scala 也提供了简单易用且功能强大的 Future/Promise 异步编程模式。

作为正统的 Java 类库，是不是应该做点什么，加强一下自身库的功能呢？

### 1.3 CompletableFuture

在 Java 8 中, 新增加了一个包含 50 个方法左右的类: `CompletableFuture`，提供了非常强大的 Future 的扩展功能，可以帮助我们简化异步编程的复杂性，提供了函数式编程的能力，可以通过回调的方式处理计算结果，并且提供了转换和组合 CompletableFuture 的方法。CompletableFuture 类实现了 Future 接口，所以你还是可以像以前一样通过`get`方法阻塞或者轮询的方式获得结果，但是这种方式不推荐使用。

`CompletableFuture` 和 `FutureTask` 同属于 Future 接口的实现类，都可以获取线程的执行结果。

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202303/image-20230326183303571.png#id=OVWD3&originHeight=451&originWidth=713&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=#id=K7OMN&originHeight=451&originWidth=713&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

---

## 2、创建异步对象

### 2.1 方法

CompletableFuture 提供了四个静态方法来创建一个异步操作：

1. `runAsync`都是没有返回结果的，`supplyAsync`都是可以获取返回结果的
2. 可以传入自定义的线程池，否则就用默认的线程池；

```java
public static CompletableFuture<Void> runAsync(Runnable runnable)
public static CompletableFuture<Void> runAsync(Runnable runnable,Executor executor)
public static <U> CompletableFuture<U> supplyAsync(Supplier<U> supplier)
public static <U> CompletableFuture<U> supplyAsync(Supplier<U> supplier,Executor executor)
```

### 2.2 示例

#### 2.2.1 runAsync

```java
public class ThreadTest {
    public static ExecutorService service = Executors.newFixedThreadPool(10);

    public static void main(String[] args) {
        System.out.println("main...start...");
        CompletableFuture<Void> runAsync = CompletableFuture.runAsync(() -> {
            System.out.println("当前线程：" + Thread.currentThread().getId());
            int i = 10 / 5;
            System.out.println("运行结果：" + i);
        }, service);
        System.out.println("main...end...");
    }
}
```

#### 2.2.2 supplyAsync

```java
public class ThreadTest {
    public static ExecutorService service = Executors.newFixedThreadPool(10);

    public static void main(String[] args) throws ExecutionException, InterruptedException {
        System.out.println("main...start...");
        
        CompletableFuture<Integer> supplyAsync = CompletableFuture.supplyAsync(() -> {
            System.out.println("当前线程：" + Thread.currentThread().getId());
            int i = 10 / 5;
            System.out.println("运行结果：" + i);
            return i;
        }, service);
        Integer result = supplyAsync.get();
        
        System.out.println("main...end..." + result);
    }
}
```

---

## 3、计算完成时回调方法

### 3.1 方法

whenComplete 可以处理正常和异常的计算结果，exceptionally 处理异常情况。

whenComplete 和 whenCompleteAsync 的区别：

- `whenComplete`：是执行当前任务的线程执行，继续执行 whenComplete 的任务。
- `whenCompleteAsync`：是执行把 whenCompleteAsync 这个任务继续提交给线程池来进行执行。

方法不以 Async 结尾，意味着 Action 使用相同的线程执行，而 Async 可能会使用其他线程执行（如果是使用相同的线程池，也可能会被同一个线程选中执行）。

```java
public CompletableFuture<T> whenComplete(BiConsumer<? super T, ? super Throwable> action);

public CompletableFuture<T> whenCompleteAsync(BiConsumer<? super T, ? super Throwable> action);

public CompletableFuture<T> whenCompleteAsync(BiConsumer<? super T, ? super Throwable> action, Executor executor);

public CompletableFuture<T> exceptionally(Function<Throwable, ? extends T> fn);
```

### 3.2 示例

#### 3.2.1 whenComplete

whenComplete的两个参数：一个是成功后的返回结果，一个是返回的异常

```java
public class CompletableFutureDemo {
    public static ExecutorService service = Executors.newFixedThreadPool(10);

    public static void main(String[] args) {
        System.out.println("main...start...");
        CompletableFuture<Integer> future = CompletableFuture.supplyAsync(() -> {
            System.out.println("当前线程：" + Thread.currentThread().getId());
            int i = 10 / 5;
            System.out.println("计算结果：" + i);
            return i;
        }, service).whenComplete((res, exception) -> {
            System.out.println("异步任务执行完成了...结果是：" + res + "异常是：" + exception);
        });
        System.out.println("main...end...");
    }
}
```

运行结果：

```
main...start...
当前线程：12
计算结果：2
异步任务执行完成了...结果是：2异常是：null
main...end...
```

#### 3.2.2 exceptionally

exceptionally接受一个异常类型参数，返回一个结果

```java
public class CompletableFutureDemo {
    public static ExecutorService service = Executors.newFixedThreadPool(10);

    public static void main(String[] args) throws ExecutionException, InterruptedException {
        System.out.println("main...start...");
        CompletableFuture<Integer> future = CompletableFuture.supplyAsync(() -> {
            System.out.println("当前线程：" + Thread.currentThread().getId());
            int i = 10 / 0;
            System.out.println("计算结果：" + i);
            return i;
        }, service).whenComplete((res, exception) -> {
            System.out.println("异步任务执行完成了...结果是：" + res + "异常是：" + exception);
        }).exceptionally(throwable -> {
            return 10;
        });
        System.out.println("main...end..." + future.get());
    }
}
```

运行结果：

```
main...start...
当前线程：12
异步任务执行完成了...结果是：null异常是：java.util.concurrent.CompletionException: java.lang.ArithmeticException: / by zero
main...end...10
```

whenComplete只能监控是否出现了问题，不能修改返回结果。exceptionally可以修改返回结果。

---

## 4、handle最终处理

### 4.1 方法

和 complete 一样，可对结果做最后的处理（可处理异常），可改变返回值。

```java
public <U> CompletableFuture<U> handle(BiFunction<? super T, Throwable, ? extends U> fn);
public <U> CompletableFuture<U> handleAsync(BiFunction<? super T, Throwable, ? extends U> fn);
public <U> CompletableFuture<U> handleAsync(BiFunction<? super T, Throwable, ? extends U> fn, Executor executor);
```

### 4.2 示例

#### 4.2.1 handle

```java
public class CompletableFutureDemo {
    public static ExecutorService service = Executors.newFixedThreadPool(10);

    public static void main(String[] args) throws ExecutionException, InterruptedException {
        // >>>>>>>>>>handle >>>>>>
        System.out.println("main...start...");
        CompletableFuture<Integer> handle = CompletableFuture.supplyAsync(() -> {
            System.out.println("当前线程为：" + Thread.currentThread().getId());
            int i = 10 / 4;
            System.out.println("结算结果：" + i);
            return i;
        }, service).handle((res, exception) -> {
            if (res != null) {
                return res * 2;
            }
            if (exception != null) {
                return 0;
            }
            return 0;
        });
        System.out.println("main...end..." + handle.get());
    }
}
```

运行结果：

```
main...start...
当前线程为：12
结算结果：2
main...end...4
```

---

## 5、线程串行化方法

### 5.1 方法

`thenApply` 方法：当一个线程依赖另一个线程时，获取上一个任务返回的结果，并返回当前任务的返回值。

`thenAccept` 方法：消费处理结果。接收任务的处理结果，并消费处理，无返回结果。

`thenRun` 方法：只要上面的任务执行完成，就开始执行 thenRun，只是处理完任务后，执行thenRun 的后续操作带有 Async 默认是异步执行的。同之前。**以上都要前置任务成功完成**。

`Function<? super T,? extends U>`

- T：上一个任务返回结果的类型
- U：当前任务的返回值类型

```java
public <U> CompletableFuture<U> thenApply(Function<? super T,? extends U> fn)
public <U> CompletableFuture<U> thenApplyAsync(Function<? super T,? extends U> fn)
public <U> CompletableFuture<U> thenApplyAsync(Function<? super T,? extends U> fn, Executor executor)
    
public CompletableFuture<Void> thenAccept(Consumer<? super T> action)
public CompletableFuture<Void> thenAcceptAsync(Consumer<? super T> action)
public CompletableFuture<Void> thenAcceptAsync(Consumer<? super T> action,Executor executor)

public CompletableFuture<Void> thenRun(Runnable action)
public CompletableFuture<Void> thenRunAsync(Runnable action)
public CompletableFuture<Void> thenRunAsync(Runnable action,Executor executor)
```

### 5.2 示例

#### 5.2.1 thenRunAsync

不能获取上一个任务的返回结果

```java
public class CompletableFutureDemo {
    public static ExecutorService service = Executors.newFixedThreadPool(10);

    public static void main(String[] args) throws ExecutionException, InterruptedException {

        // >>>>>>>>>>thenRunAsync >>>>>>
        System.out.println("main...start...");
        CompletableFuture<Void> thenRunAsync = CompletableFuture.supplyAsync(() -> {
            System.out.println("当前线程为：" + Thread.currentThread().getId());
            int i = 10 / 4;
            System.out.println("结算结果：" + i);
            return i;
        }, service).thenRunAsync(() -> {
            System.out.println("任务2开始运行");
        }, service);
        System.out.println("main...end...");
    }
}
```

运行结果：

```
main...start...
当前线程为：12
结算结果：2
main...end...
任务2开始运行
```

#### 5.2.2 thenAcceptAsync

可以获取上个任务的返回结果，但是不能返回结果。

```java
package com.gyz.cfmall.search.thread;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class CompletableFutureDemo {
    public static ExecutorService service = Executors.newFixedThreadPool(10);

    public static void main(String[] args) throws ExecutionException, InterruptedException {

        // >>>>>>>>>>thenAcceptAsync：可以获取上个任务的返回结果，但是不能返回结果>>>>>>
        System.out.println("main...start...");
        CompletableFuture<Void> thenRunAsync = CompletableFuture.supplyAsync(() -> {
            System.out.println("当前线程为：" + Thread.currentThread().getId());
            int i = 10 / 4;
            System.out.println("结算结果：" + i);
            return i;
        }, service).thenAcceptAsync((res) -> {
            System.out.println("任务2开始运行：" + res);
        }, service);
        System.out.println("main...end...");
    }
}
```

运行结果：

```
main...start...
当前线程为：12
结算结果：2
main...end...
任务2开始运行：2
```

#### 5.2.3 thenApplyAsync

可以获取上一个任务完成的返回值，并返回一个返回值。

```java
package com.gyz.cfmall.search.thread;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class CompletableFutureDemo {
    public static ExecutorService service = Executors.newFixedThreadPool(10);

    public static void main(String[] args) throws ExecutionException, InterruptedException {

        // >>>>>>>>>>thenApplyAsync：可以获取上个任务的返回结果，但是不能返回结果>>>>>>
        System.out.println("main...start...");
        CompletableFuture<String> thenApplyAsync = CompletableFuture.supplyAsync(() -> {
            System.out.println("当前线程为：" + Thread.currentThread().getId());
            int i = 10 / 4;
            System.out.println("结算结果：" + i);
            return i;
        }, service).thenApplyAsync((res) -> {
            System.out.println("任务2开始运行...");
            return "hello" + res;
        }, service);
        System.out.println("main...end..." + thenApplyAsync.get());
    }
}
```

运行结果：

```
main...start...
当前线程为：12
结算结果：2
任务2开始运行...
main...end...hello2
```

---

## 6、两任务组合 - 都要完成

### 6.1 方法

两个任务必须都完成，触发该任务。

`thenCombine`：组合两个 future，获取两个 future 的返回结果，并返回当前任务的返回值

`thenAcceptBoth`：组合两个 future，获取两个 future 任务的返回结果，然后处理任务，没有返回值。

`runAfterBoth`：组合两个 future，不需要获取 future 的结果，只需两个 future 处理完任务后，处理该任务。

```java
public <U,V> CompletionStage<V> thenCombine(CompletionStage<? extends U> other,
										BiFunction<? super T,? super U,? extends V> fn);

public <U,V> CompletionStage<V> thenCombineAsync(CompletionStage<? extends U> other,
         								 	  BiFunction<? super T,? super U,? extends V> fn);

public <U,V> CompletionStage<V> thenCombineAsync (CompletionStage<? extends U> other,
         									   BiFunction<? super T,? super U,? extends V> fn,
         									   Executor executor);  
   
public <U> CompletionStage<Void> thenAcceptBoth(CompletionStage<? extends U> other,
         									 BiConsumer<? super T, ? super U> action);

public <U> CompletionStage<Void> thenAcceptBothAsync(CompletionStage<? extends U> other,
         										  BiConsumer<? super T, ? super U> action);

public <U> CompletionStage<Void> thenAcceptBothAsync(CompletionStage<? extends U> other,
         										  BiConsumer<? super T, ? super U> action,
         										  Executor executor);

public CompletionStage<Void> runAfterBoth(CompletionStage<?> other,Runnable action);

public CompletionStage<Void> runAfterBothAsync(CompletionStage<?> other,Runnable action);

public CompletionStage<Void> runAfterBothAsync(CompletionStage<?> other,Runnable action,Executor executor);
```

### 6.2 示例

#### 6.2.1 runAfterBothAsync(other,action,executor)

`runAfterBothAsync(other,action,executor)`

- other->组合任务
- action->两个任务完成之后的任务
- executor->指定线程池

不能接收之前两个任务的返回值，也不能返回结果。

```java
package com.gyz.cfmall.search.thread;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class CompletableFutureDemo {
    public static ExecutorService service = Executors.newFixedThreadPool(10);

    public static void main(String[] args) throws ExecutionException, InterruptedException {

        System.out.println("main...start...");
        CompletableFuture<Integer> future01 = CompletableFuture.supplyAsync(() -> {
            System.out.println("任务A开始执行" + Thread.currentThread().getId());
            int i = 10 / 4;
            System.out.println("任务A执行完成，计算结果：" + i);
            return i;
        }, service);


        CompletableFuture<String> future02 = CompletableFuture.supplyAsync(() -> {
            System.out.println("任务B开始执行" + Thread.currentThread().getId());
            System.out.println("任务B执行完成");
            return "hello!";
        }, service);

        future01.runAfterBothAsync(future02, () -> {
            System.out.println("任务C开始执行" + Thread.currentThread().getId());
            System.out.println("任务C执行完成");
        }, service);

        System.out.println("main...end...");
    }
}
```

运行结果：

```
main...start...
任务A开始执行12
任务A执行完成，计算结果：2
任务B开始执行13
任务B执行完成
main...end...
任务C开始执行14
任务C执行完成
```

#### 6.2.2 thenAcceptBothAsync

可以接收之前两任务的返回值，但不能返回结果。

```java
		public static ExecutorService service = Executors.newFixedThreadPool(10);	

	    System.out.println("main...start...");
        CompletableFuture<Integer> future01 = CompletableFuture.supplyAsync(() -> {
            System.out.println("任务A开始执行" + Thread.currentThread().getId());
            int i = 10 / 4;
            System.out.println("任务A执行完成，计算结果：" + i);
            return i;
        }, service);


        CompletableFuture<String> future02 = CompletableFuture.supplyAsync(() -> {
            System.out.println("任务B开始执行" + Thread.currentThread().getId());
            System.out.println("任务B执行完成");
            return "hello!";
        }, service);

        future01.thenAcceptBothAsync(future02, (r1, r2) -> {
            System.out.println("任务C开始执行" + Thread.currentThread().getId());
            System.out.println("任务A的执行结果：" + r1 + "，任务B的执行结果：" + r2);
            System.out.println("任务C执行完成");
        }, service);

        System.out.println("main...end...");
    }
```

运行结果：

```
main...start...
任务A开始执行12
任务A执行完成，计算结果：2
任务B开始执行13
任务B执行完成
main...end...
任务C开始执行14
任务A的执行结果：2，任务B的执行结果：hello!
任务C执行完成
```

#### 6.2.3 thenCombineAsync

可以接收两个任务的返回值，并且返回一个结果

```java
		public static ExecutorService service = Executors.newFixedThreadPool(10);
		
	    System.out.println("main...start...");
        CompletableFuture<Integer> future01 = CompletableFuture.supplyAsync(() -> {
            System.out.println("任务A开始执行" + Thread.currentThread().getId());
            int i = 10 / 4;
            System.out.println("任务A执行完成，计算结果：" + i);
            return i;
        }, service);


        CompletableFuture<String> future02 = CompletableFuture.supplyAsync(() -> {
            System.out.println("任务B开始执行" + Thread.currentThread().getId());
            System.out.println("任务B执行完成");
            return "hello!";
        }, service);

        CompletableFuture<Object> future = future01.thenCombineAsync(future02, (r1, r2) -> {
            System.out.println("任务C开始执行" + Thread.currentThread().getId());
            System.out.println("任务C执行完成");
            return "A任务执行结果，Result：" + r1 + ",B任务执行结果：" + r2;
        }, service);

        System.out.println("main...end..."+future.get());
```

运行结果：

```
main...start...
任务A开始执行14
任务A执行完成，计算结果：2
任务B开始执行15
任务B执行完成
任务C开始执行16
任务C执行完成
main...end...A任务执行结果，Result：2,B任务执行结果：hello!
```

---

## 7、两任务组合 --- 一个完成

### 7.1 方法

当两个任务中，任意一个 future 任务完成的时候，执行任务。

`applyToEither`：两个任务有一个执行完成，获取它的返回值，处理任务并有新的返回值。

`acceptEither`：两个任务有一个执行完成，获取它的返回值，处理任务，没有新的返回值。

`runAfterEither`：两个任务有一个执行完成，不需要获取 future 的结果，处理任务，也没有返回值。

```java
public <U> CompletableFuture<U> applyToEither(CompletionStage<? extends T> other, Function<? super T, U> fn);

public <U> CompletableFuture<U> applyToEitherAsync(CompletionStage<? extends T> other, Function<? super T, U> fn);

public <U> CompletableFuture<U> applyToEitherAsync(CompletionStage<? extends T> other, Function<? super T, U> fn,Executor executor);
```

```java
public CompletableFuture<Void> acceptEither(CompletionStage<? extends T> other, Consumer<? super T> action);

public CompletableFuture<Void> acceptEitherAsync(CompletionStage<? extends T> other, Consumer<? super T> action);

public CompletableFuture<Void> acceptEitherAsync(CompletionStage<? extends T> other, Consumer<? super T> action,Executor executor);
```

```java
public CompletableFuture<Void> runAfterEither(CompletionStage<?> other,Runnable action);

public CompletableFuture<Void> runAfterEitherAsync(CompletionStage<?> other,Runnable action);

public CompletableFuture<Void> runAfterEitherAsync(CompletionStage<?> other,Runnable action,Executor executor);
```

### 7.2 示例

#### 7.2.1 applyToEitherAsync

```java
package com.gyz.test.concurrent;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class CompletableFutureDemo {
    public static ExecutorService service = Executors.newFixedThreadPool(10);

    public static void main(String[] args) throws ExecutionException, InterruptedException {
        System.out.println("main...start...");

        CompletableFuture<Object> future01 = CompletableFuture.supplyAsync(() -> {
            System.out.println("任务A开始执行，编号：" + Thread.currentThread().getId());
            int i = 10 / 4;
            System.out.println("任务A执行完成，计算结果：" + i);
            return i;
        }, service);

        CompletableFuture<Object> future02 = CompletableFuture.supplyAsync(() -> {
            System.out.println("任务B开始执行，编号：" + Thread.currentThread().getId());
            try {
                Thread.sleep(3000);
                System.out.println("任务B执行完成");
            } catch (InterruptedException e) {
                e.printStackTrace();
            } finally {
                return "hello";
            }
        }, service);

        CompletableFuture<String> future = future01.applyToEitherAsync(future02, (res) -> {
            System.out.println("任务C开始执行，编号：" + Thread.currentThread().getId());
            System.out.println("上个任务的返回结果：" + res);
            System.out.println("任务C执行完毕");
            return "CCC";
        }, service);

        System.out.println("main...end..." + future.get());
    }
}
```

运行结果：

```
main...start...
任务A开始执行，编号：20
任务A执行完成，计算结果：2
任务B开始执行，编号：21
任务C开始执行，编号：22
上个任务的返回结果：2
任务C执行完毕
main...end...CCC
任务B执行完成
```

#### 7.2.2 acceptEitherAsync

两个任务的返回值类型要一致

```java
package com.gyz.test.concurrent;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class CompletableFutureDemo {
    public static ExecutorService service = Executors.newFixedThreadPool(10);

    public static void main(String[] args) throws ExecutionException, InterruptedException {
        System.out.println("main...start...");

        CompletableFuture<Object> future01 = CompletableFuture.supplyAsync(() -> {
            System.out.println("任务A开始执行，编号：" + Thread.currentThread().getId());
            int i = 10 / 4;
            System.out.println("任务A执行完成，计算结果：" + i);
            return i;
        }, service);

        CompletableFuture<Object> future02 = CompletableFuture.supplyAsync(() -> {
            System.out.println("任务B开始执行，编号：" + Thread.currentThread().getId());
            try {
                Thread.sleep(3000);
                System.out.println("任务B执行完成");
            } catch (InterruptedException e) {
                e.printStackTrace();
            } finally {
                return "hello";
            }
        }, service);

        future01.acceptEitherAsync(future02, (res) -> {
            System.out.println("任务C开始执行，编号：" + Thread.currentThread().getId());
            System.out.println("上个任务的返回结果：" + res);
            System.out.println("任务C执行完毕");
        }, service);

        System.out.println("main...end...");
    }
}
```

运行结果：

```
main...start...
任务A开始执行，编号：20
任务A执行完成，计算结果：2
任务B开始执行，编号：21
main...end...
任务C开始执行，编号：22
上个任务的返回结果：2
任务C执行完毕
任务B执行完成
```

#### 7.2.3 runAfterEitherAsync

```java
package com.gyz.test.concurrent;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class CompletableFutureDemo {
    public static ExecutorService service = Executors.newFixedThreadPool(10);

    public static void main(String[] args) throws ExecutionException, InterruptedException {
        System.out.println("main...start...");

        CompletableFuture<Object> future01 = CompletableFuture.supplyAsync(() -> {
            System.out.println("任务A开始执行，编号：" + Thread.currentThread().getId());
            int i = 10 / 4;
            System.out.println("任务A执行完成，计算结果：" + i);
            return i;
        }, service);

        CompletableFuture<Object> future02 = CompletableFuture.supplyAsync(() -> {
            System.out.println("任务B开始执行，编号：" + Thread.currentThread().getId());
            try {
                Thread.sleep(3000);
                System.out.println("任务B执行完成");
            } catch (InterruptedException e) {
                e.printStackTrace();
            } finally {
                return "hello";
            }
        }, service);

        future01.runAfterEitherAsync(future02, () -> {
            System.out.println("任务C开始执行，编号：" + Thread.currentThread().getId());
            System.out.println("任务C执行完毕");
        }, service);

        System.out.println("main...end...");
    }
}
```

运行结果：

```
main...start...
任务A开始执行，编号：20
任务A执行完成，计算结果：2
任务B开始执行，编号：21
main...end...
任务C开始执行，编号：22
任务C执行完毕
任务B执行完成
```

---

## 8、多任务组合

### 8.1 方法

`allOf`：等待所有任务完成

`anyOf`：只要有一个任务完成

```java
public static CompletableFuture<Void> allOf(CompletableFuture<?>... cfs);
    
public static CompletableFuture<Object> anyOf(CompletableFuture<?>... cfs);
```

### 8.2 示例

#### 8.2.1 allof

```java
package com.gyz.test.concurrent;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class CompletableFutureDemo {
    public static ExecutorService service = Executors.newFixedThreadPool(10);

    public static void main(String[] args) throws ExecutionException, InterruptedException {
        System.out.println("main...start...");

        CompletableFuture<String> futureImg = CompletableFuture.supplyAsync(() -> {
            System.out.println("查询商品图片信息");
            return "hello.jpg";
        });

        CompletableFuture<Object> futureAttr = CompletableFuture.supplyAsync(() -> {
            System.out.println("查询属性信息");
            try {
                Thread.sleep(3000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            return "黑色+256G";
        });

        CompletableFuture<String> futureDes = CompletableFuture.supplyAsync(() -> {
            System.out.println("查询商品描述信息");
            return "华为";
        });

        CompletableFuture<Void> allOf = CompletableFuture.allOf(futureImg, futureAttr, futureDes);
        //阻塞等待所有任务完成
        allOf.get();

        System.out.println("main...end...");
    }
}
```

#### 8.2.2 anyof

```java
package com.gyz.test.concurrent;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class CompletableFutureDemo {
    public static ExecutorService service = Executors.newFixedThreadPool(10);

    public static void main(String[] args) throws ExecutionException, InterruptedException {
        System.out.println("main...start...");

        CompletableFuture<String> futureImg = CompletableFuture.supplyAsync(() -> {
            System.out.println("查询商品图片信息");
            return "hello.jpg";
        });

        CompletableFuture<Object> futureAttr = CompletableFuture.supplyAsync(() -> {
            System.out.println("查询属性信息");
            try {
                Thread.sleep(3000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            return "黑色+256G";
        });

        CompletableFuture<String> futureDes = CompletableFuture.supplyAsync(() -> {
            System.out.println("查询商品描述信息");
            return "华为";
        });

        CompletableFuture<Object> anyOf = CompletableFuture.anyOf(futureImg, futureAttr, futureDes);

        System.out.println("main...end..." + anyOf.get());
    }
}
```

运行结果：

```
main...start...
查询商品图片信息
查询属性信息
查询商品描述信息
main...end...hello.jpg
```
