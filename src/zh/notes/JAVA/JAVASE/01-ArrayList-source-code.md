---
title: ArrayList底层实现原理
category:
  - JAVA
tag: 
  - JAVA集合
date: 2023-03-01
---

<!-- more -->

# ArrayList源码分析

## 构造方法

| Constructor                    | Constructor描述                                              |
| ------------------------------ | ------------------------------------------------------------ |
| ArrayList()                    | 构造一个初始容量为十的空列表                                 |
| ArrayList(int initialCapacity) | ArrayList(int initialCapacity)                               |
| ArrayList(Collection c)        | 构造一个包含指定集合的元素的列表，按照它们由集合的迭代器返回的顺序 |

------

## 案例演示

**案例一:**

1.空参构造ArrayList()

```java
public class Test01 {
    public static void main(String[] args) {
    //这行代码做了什么?
    //真的构造一个初始容量为十的空列表?
    ArrayList<String> list = new ArrayList<String>();
 }
}
```

2.源码分析

```java
public class ArrayList<E>{
    /** 默认初始容量 */
    private static final int DEFAULT_CAPACITY = 10;
    /** 空数组 */
    private static final Object[] EMPTY_ELEMENTDATA = {};
    /** 默认容量的数组 */
    private static final Object[] DEFAULTCAPACITY_EMPTY_ELEMENTDATA = {};
    /** 集合真正存储元素的数组*/
    transient Object[] elementData;
    /** 集合的大小*/
    private int size;
    public ArrayList(){
        this.elementData = DEFAULTCAPACITY_EMPTY_ELEMENTDATA;
    }
}
```

3.结论

通过空参构造方法创建集合对象并未构造一个初始容量为十的空列表，仅仅将 `DEFAULTCAPACITY_EMPTY_ELEMENTDATA` 的地址赋值给`elementData`

**案例二:**

1. 指定容量ArrayList(int initialCapacity)

```java
public class Test01 {
    public static void main(String[] args) {
    //这行代码ArrayList底层做了什么?
    ArrayList<String> list = new ArrayList<String>(5);
 }
}
```

2.源码分析

```java
public class ArrayList<E> {
    public ArrayList(int initialCapacity) { //initialCapacity = 5
  //判断初始容量initialCapacity是否大于0
  if (initialCapacity > 0) {
    //创建一个数组,且指定长度为initialCapacity
      this.elementData = new Object[initialCapacity];
  } else if (initialCapacity == 0) {
 //如果initialCapacity容量为0，把EMPTY_ELEMENTDATA的地址赋值给elementData
      this.elementData = EMPTY_ELEMENTDATA;
  } else {
  //以上两个条件都不满足报错
  throw new IllegalArgumentException("Illegal Capacity: " +
                    initialCapacity);
    }
  }
}
```

3.结论

根据 ArrayList 构造方法参数创建指定长度的数组!

**案例三:**

1.ArrayList(Collection c)

```java
public class Test01 {
    public static void main(String[] args) {
     ArrayList<String> list = new ArrayList<String>();
     list.add("aaa");
     list.add("bbb");
     list.add("ccc");
     //这行代码做了什么?
     ArrayList<String> list1 = new ArrayList<>(list);
     for (String s : list1) {
        System.out.println(s);
    }
  }
}
```

2.源码分析

```java
public class ArrayList<E> {
   public ArrayList(Collection<? extends E> c) {
       //将集合中的元素转为数组
        elementData = c.toArray();
       //判断数组长度是否不等于0
       if((size=elementData.length) !=0 ){
           //判断elemntData数据类型是否和Object一样
           if(element.getClass() != Object[].class){
               //如果不一样，进行拷贝
               elementData = Arrays.copyof(elementData,size,Object[].class);
           }
       }else{
           //用空数组代替
           this.elementData = EMPTY_ELEMENTDATA;
       }
   }
}
//将集合转数组的方法
public Object[] toArray() {
   //调用数组工具类方法进行拷贝
   return Arrays.copyOf(elementData, size);
 }
}
//数组工具类
public class Arrays {
    public static <T> T[] copyOf(T[] original, int newLength) {
        //再次调用方法进行拷贝
        return (T[]) copyOf(original, newLength, original.getClass());
} 
    public static <T,U> T[] copyOf(U[] original, int newLength, Class<? extends T[]>newType) {
    //用三元运算符进行判断,不管结果如何都是创建一个新数组
    T[] copy = ((Object)newType == (Object)Object[].class)? (T[]) new Object[newLength]: (T[]) Array.newInstance(newType.getComponentType(), newLength);
    //将数组的内容拷贝到 copy 该数组中
    System.arraycopy(original, 0, copy, 0,Math.min(original.length, newLength));
    //返回拷贝元素成功后的数组
    return copy;
  }
}
```

------

## 添加方法

| 方法名                                         | 描述                                                         |
| ---------------------------------------------- | ------------------------------------------------------------ |
| public boolean add(E e)                        | 将指定的元素追加到此列表的末尾。                             |
| public void add(int index, E element)          | 在此列表中的指定位置插入指定的元素。                         |
| public boolean addAll(Collection c)            | 按指定集合的Iterator返回的顺序将指定集合中的所有元素追加到此列表的末尾。 |
| public boolean addAll(i nt index,Collection c) | 将指定集合中的所有元素插入到此列表中，从指定的位置开始。     |

- `public boolean add(E e)` 添加单个元素

```
public class Test01 {
    public static void main(String[] args) {
        ArrayList<String> list = new ArrayList<>();
        list.add("黑马程序员");
  }
}
```

**源代码**

```java
public class ArrayList<E> {
  //将添加的数据传入给 e
  public boolean add(E e) {
  //调用方法对内部容量进行校验
  ensureCapacityInternal(size + 1);
  elementData[size++] = e;
  return true;
} 
    private void ensureCapacityInternal(int minCapacity) {
     //判断集合存数据的数组是否等于空容量的数组
     if (elementData == DEFAULTCAPACITY_EMPTY_ELEMENTDATA) {
        //通过最小容量和默认容量 求出较大值 (用于第一次扩容)
        minCapacity = Math.max(DEFAULT_CAPACITY,minCapacity);
} 
       //将if中计算出来的容量传递给下一个方法,继续校验
        ensureExplicitCapacity(minCapacity);
} 
  private void ensureExplicitCapacity(int minCapacity) {
      //实际修改集合次数++ (在扩容的过程中没用,主要是用于迭代器中)
      modCount++;
     //判断最小容量 - 数组长度是否大于 0
     if (minCapacity - elementData.length > 0)
     //将第一次计算出来的容量传递给 核心扩容方法
     grow(minCapacity);
}
  private void grow(int minCapacity) {
    //记录数组的实际长度,此时由于木有存储元素,长度为0
    int oldCapacity = elementData.length;
    //核心扩容算法 原容量的1.5倍
    int newCapacity = oldCapacity + (oldCapacity >> 1);
    //判断新容量 - 最小容量 是否小于 0, 如果是第一次调用add方法必然小于
    if (newCapacity - minCapacity < 0)
    //还是将最小容量赋值给新容量
    newCapacity = minCapacity;
    //判断新容量-最大数组大小 是否>0,如果条件满足就计算出一个超大容量
    if (newCapacity - MAX_ARRAY_SIZE > 0)
      newCapacity = hugeCapacity(minCapacity);
    // 调用数组工具类方法,创建一个新数组,将新数组的地址赋值给elementData
    elementData = Arrays.copyOf(elementData, newCapacity);
  }
}
```

- `public void add(int index, E element)` 在指定索引处添加元素

```java
public class Test01 {
    public static void main(String[] args) {
        ArrayList<String> list = new ArrayList<>();
        list.add("黑马程序员");
        list.add("传智播客");
        list.add("传智大学");
        list.add(1, "长沙校区");
        System.out.println(list);
   }
}
```

**源码**

```java
public class ArrayList<E> {
    public void add(int index, E element) {
     //添加范围检查
     rangeCheckForAdd(index);
     //调用方法检验是否要扩容,且让增量++
     ensureCapacityInternal(size + 1);
     System.arraycopy(elementData, index, elementData, index + 1,size - index);
     elementData[index] = element;
     size++;
} 
    private void rangeCheckForAdd(int index) {
     //超出指定范围就报错
     if (index > size || index < 0)
throw new IndexOutOfBoundsException(outOfBoundsMsg(index));
}
  private void ensureCapacityInternal(int minCapacity) {
     if (elementData == DEFAULTCAPACITY_EMPTY_ELEMENTDATA) {
     minCapacity = Math.max(DEFAULT_CAPACITY, minCapacity);
} 
     //确保明确的能力
    ensureExplicitCapacity(minCapacity);
}
  private void ensureExplicitCapacity(int minCapacity) {
    //增量++ (也就是实际修改集合的次数)
    modCount++;
    //如果再调用 add(index,element) 方法之前已经扩容,那么源码跟踪到此结束
    //不会进行扩容
    if (minCapacity - elementData.length > 0)
    grow(minCapacity);
 }
}
```

图解

![image-20221020105016901](https://studyimages.oss-cn-beijing.aliyuncs.com/others/202210201050968.png)

- `public boolean addAll(Collection<? extends E> c)` 将集合的所有元素一次性添加到集合

```java
public class Test01 {
    public static void main(String[] args) {
        ArrayList<String> list = new ArrayList<>();
        list.add("黑马程序员");
        list.add("传智播客");
        list.add("传智大学");
        ArrayList<String> list1 = new ArrayList<>();
        list1.addAll(list);
        System.out.println(list);
        System.out.println(list1);
  }
}
```

**源码**

```java
public class ArrayList<E> {
    public boolean addAll(Collection<? extends E> c) {
        //把集合的元素转存到Object类型的数组中
        Object[] a = c.toArray();
        //记录数组的长度
        int numNew = a.length;
        //调用方法检验是否要扩容,且让增量++
        ensureCapacityInternal(size + numNew);
        //调用方法将a数组的元素拷贝到elementData数组中
        System.arraycopy(a, 0, elementData, size, numNew);
        //集合的长度+=a数组的长度
        size += numNew;
        //只要a数组的长度不等于0,即说明添加成功
        return numNew != 0;
  }
}
```

- `public boolean addAll(int index, Collection<? extends E> c)` 在指定的索引位置添加集合

```java
public class Test01 {
    public static void main(String[] args) {
        ArrayList<String> list = new ArrayList<>();
        list.add("黑马程序员");
        list.add("传智播客");
        list.add("传智大学");
        ArrayList<String> list1 = new ArrayList<>();
        list1.add("酷丁鱼");
        //在指定索引处添加一个集合
        list1.addAll(1,list);
        System.out.println(list);
        System.out.println(list1);
   }
}
```

**源码**

```java
public class ArrayList<E> {
    //长度为0的空数组
    private static final Object[] EMPTY_ELEMENTDATA = {};
    //默认容量为空的数组
    private static final Object[] DEFAULTCAPACITY_EMPTY_ELEMENTDATA = {};
    //集合存元素的数组
    Object[] elementData;
    //集合的长度
    private int size;
    //默认的容量
    private static final int DEFAULT_CAPACITY = 10;
  public boolean addAll(int index, Collection<? extends E> c) {
    //校验索引
    rangeCheckForAdd(index);
    //将数据源转成数组
    Object[] a = c.toArray();
    //记录数据源的长度 3
    int numNew = a.length;
    //目的就是为了给集合存储数据的数组进行扩容
    ensureCapacityInternal(size + numNew);
    //numMoved:代表要移动元素的个数 --> 1个
    //numMoved: 数据目的(集合list1)的长度-调用addAll的第一个参数 (索引1)
    int numMoved = size - index;
    //判断需要移动的个数是否大于0
    if (numMoved > 0)
    //使用System中的方法arraycopy进行移动
    System.arraycopy(elementData, index, elementData, index + numNew,numMoved);
    //才是真正将数据源(list)中的所有数据添加到数据目的(lsit1)
    System.arraycopy(a, 0, elementData, index, numNew);
    size += numNew;
    return numNew != 0;
} 
    private void rangeCheckForAdd(int index) {
        if (index > size || index < 0)
          throw new IndexOutOfBoundsException(outOfBoundsMsg(index));
  }
}
public final class System {
/**
*参数
* src - 源数组。
* srcPos - 源数组中的起始位置。
* dest - 目标数组。
* destPos - 目的地数据中的起始位置。
* length - 要复制的数组元素的数量。
*/
public static void arraycopy(Object src,int srcPos,Object dest,int destPos,int length)
}
```

**图解**

![image-20221020105120210](https://studyimages.oss-cn-beijing.aliyuncs.com/others/202210201051311.png)

**如何计算元素移动的位置&数量**

```java
public class ArrayCopyMethodTest {
   public static void main(String[] args) {
    //数据源: list
    String[] a = {"黑马程序员","传智播客","传智大学"};
    //数据目的: list1
    String[] arr = {"酷丁鱼","博学谷",null,null,null,null,null,null,null,null};
/*
int numNew = a.length;
int numMoved = size - index;
if (numMoved > 0)
System.arraycopy(elementData, index, elementData, index + numNew,
numMoved);
*/
    //获取数据源的长度 3
    int numNew = a.length;
    //numMoved = 集合真实长度 - 要存的索引位置
    //要移动元素的个数为:1
    int numMoved = 2 - 1;
    //判断是否需要移动元素
    if (numMoved > 0)
    //src - 源数组。
    //srcPos - 源数组中的起始位置。
    //dest - 目标数组。
    //destPos - 目的地数据中的起始位置。
    //length - 要复制的数组元素的数量
    System.arraycopy(arr, 1, arr, 4,numMoved);
    System.out.println(Arrays.toString(arr));
  }
}
```

------

## 删除方法

- `public E remove(int index)` 根据索引删除元素

```java
public class Test01 {
    public static void main(String[] args) {
        ArrayList<String> list = new ArrayList<>();
        list.add("山东大李逵");
        list.add("天魁星宋江");
        list.add("天罡星卢俊义");
        list.add("西门大人");
        //根据索引删除元素
        String value = list.remove(3);
        System.out.println("删除的元素为: "+value);
        System.out.println("集合的元素: "+list);
  }
}
```

**效果图**

![image-20221020105157338](https://studyimages.oss-cn-beijing.aliyuncs.com/others/202210201051418.png)

**源代码**

```java
public class ArrayList<E> {
    public E remove(int index) {
        //范围校验
        rangeCheck(index);
        //增量++
        modCount++;
        //将index对应的元素赋值给 oldValue
        E oldValue = elementData(index);
        //计算集合需要移动元素个数
        int numMoved = size - index - 1;
    //如果需要移动元素个数大于0,就使用arrayCopy方法进行拷贝
    //注意:数据源和数据目的就是elementData
    if (numMoved > 0)
        System.arraycopy(elementData, index+1, elementData, index,numMoved);
        //将源集合最后一个元素置为null,尽早让垃圾回收机制对其进行回收
        elementData[--size] = null;
        //返回被删除的元素
        return oldValue;
  }
}
```

- `public boolean remove(Object o)` 根据元素删除元素

```java
public class Test01 {
    public static void main(String[] args) {
        ArrayList<String> list = new ArrayList<>();
        list.add("山东大李逵");
        list.add("天魁星宋江");
        list.add("西门大人");
        list.add("天罡星卢俊义");
        //根据索引删除元素
        boolean flag = list.remove("西门大人");
        System.out.println("是否删除成功: "+flag);
        System.out.println("集合的元素: "+list);
   }
}
```

**源码分析**

```java
public class ArrayList<E> {
    public boolean remove(Object o) {
     //判断要删除的元素是否为null
     if (o == null) {
     //遍历集合
     for (int index = 0; index < size; index++)
        //判断集合的元素是否为null
        if (elementData[index] == null) {
        //如果相等,调用fastRemove方法快速删除
        fastRemove(index);
        return true;
    }
} else {
    //遍历集合
    for (int index = 0; index < size; index++)
    //用o对象的equals方法和集合每一个元素进行比较
    if (o.equals(elementData[index])) {
    //如果相等,调用fastRemove方法快速删除
    fastRemove(index);
    return true;
  }
} 
   //如果集合没有o该元素,那么就会返回false
    return false;
} 
    private void fastRemove(int index) {
    //增量++
    modCount++;
    //计算集合需要移动元素的个数
    int numMoved = size - index - 1;
    //如果需要移动的个数大于0,调用arrayCopy方法进行拷贝
    if (numMoved > 0)
      System.arraycopy(elementData, index+1, elementData, index,numMoved);
     //将集合最后一个元素置为null,尽早被释放
     elementData[--size] = null;
  }
}
```

------

## 修改方法

- `public E set(int index, E element)` 根据索引修改集合元素

```java
public class Test01 {
    public static void main(String[] args) {
        ArrayList<String> list = new ArrayList<>();
        list.add("山东大李逵");
        list.add("天魁星宋江");
        list.add("天罡星卢俊义");
        list.add("西门大人");
        //根据索引修改集合元素
        String value = list.set(3, "花和尚鲁智深");
        System.out.println("set方法返回值: "+value);
        System.out.println("集合的元素: "+list);
     }
}
```

## 获取方法

- `public E get(int index)` 根据索引获取元素

```java
public class Test01 {
    public static void main(String[] args) {
        ArrayList<String> list = new ArrayList<>();
        list.add("山东大李逵");
        list.add("天魁星宋江");
        list.add("天罡星卢俊义");
        list.add("西门大人");
        //根据索引获取集合元素
        String value = list.get(1);
        System.out.println("get方法返回值: "+value);
        System.out.println("集合的元素: "+list);
    }
}
```

## 转换方法

- `public String toString()` 把集合所有数据转换成字符串

```java
public class Test01 {
    public static void main(String[] args) {
        ArrayList<String> list = new ArrayList<>();
        list.add("山东大李逵");
        list.add("天魁星宋江");
        list.add("天罡星卢俊义");
        list.add("西门大人");
        System.out.println("集合的元素: "+list);
        //将集合的元素转换为字符串
        String str = list.toString();
        System.out.println(str);
    }
}
```

------

## 迭代器

- `public Iterator<E> iterator()` 普通迭代器 
   源码同上(在讲toString方法的时候已经讲过基本操作,通过以下两个案例进行一步分析源码) 
   案例一: 已知集合：List list = new ArrayList();里面有三个元素："hello"、"Java"、"PHP"，使用迭代器遍历获取集合的每一个元素

**结论:** 

1. 迭代器remove方法底层调用的还是集合自身的remove方法删除元素
2. 之所以不会产生并发修改异常，其原因是因为在迭代器的remove方法中会再次将集合时机修改次数赋值给预期修改次数！

------

## 清空方法

- `public void clear()` 清空集合所有数据

```java
public class Test01 {
    public static void main(String[] args) {
        //创建集合对象
        List<String> list = new ArrayList<String>();
        //添加元素
        list.add("hello");
        list.add("PHP");
        list.add("Java");
        System.out.println("清空前的集合: "+list);
        //清空集合所有元素
        list.clear();
        System.out.println("清空后的集合: "+list);
    }
}
```

## 包含方法

- `public boolean contains(Object o)` 判断集合是否包含指定元素

```java
public class Test01 {
    public static void main(String[] args) {
        //创建集合对象
        List<String> list = new ArrayList<String>();
        //添加元素
        list.add("hello");
        list.add("PHP");
        list.add("Java");
        System.out.println("判断之前集合的元素: "+list);
        //需求:如果集合中没有JavaSE该元素,请添加一个JavaSE元素
        //解决方式一:循环遍历集合,判断集合是否包含JavaSE,如果没有包含就调用集合的add方法进行添加操作
        //解决方式二:使用集合contains方法判断,根据判断的结果决定是否要添加元素
    if(!list.contains("JavaSE")){
        list.add("JavaSE");
    }
        System.out.println("判断之后集合的元素: "+list);
    }
}
```

------

## 判断集合是否为空

```
public boolean isEmpty()
```



```java
public class Test01 {
    public static void main(String[] args) {
    //创建集合对象
    List<String> list = new ArrayList<String>();
    //添加元素
    list.add("hello");
    list.add("PHP");
    list.add("Java");
    boolean b = list.isEmpty();
    System.out.println(b);
    System.out.println(list);
  }
}
```

------

# 面试题

## ArrayList是如何扩容的？

第一次扩容10，以后每次都是原容量的1.5倍

------

## ArrayList频繁扩容导致添加性能急剧下降，如何处理？

**案例**

```java
public class Test01 {
    public static void main(String[] args) {
        //创建集合对象
        List<String> list = new ArrayList<String>();
        //添加元素
        list.add("hello");
        list.add("PHP");
        list.add("Java");
        long startTime = System.currentTimeMillis();
        //需求:还需要添加10W条数据
        for (int i = 0; i < 100000; i++) {
            list.add(i+"");
    } 
        long endTime = System.currentTimeMillis();
        System.out.println("未指定容量: "+ (endTime - startTime));
    }
}
```

**效果图**

![image-20221020105348035](https://studyimages.oss-cn-beijing.aliyuncs.com/others/202210201053138.png)

**解决方案**

```java
public class Test01 {
    public static void main(String[] args) {
    //创建集合对象
    List<String> list = new ArrayList<String>();
    //添加元素
    list.add("hello");
    list.add("PHP");
    list.add("Java");
    long startTime = System.currentTimeMillis();
    //需求:还需要添加10W条数据
    for (int i = 0; i < 100000; i++) {
        list.add(i+"");
    } 
        long endTime = System.currentTimeMillis();
        System.out.println("未指定容量: "+ (endTime - startTime));
        //创建集合的时候指定足够大的容量
        List<String> list1 = new ArrayList<String>(100000);
        startTime = System.currentTimeMillis();
        for (int i = 0; i < 100000; i++) {
            list1.add(i+"");
    } 
        endTime = System.currentTimeMillis();
        System.out.println("指定容量: "+ (endTime - startTime));
    }
}
```

**优化效果图**

![image-20221020105405022](https://studyimages.oss-cn-beijing.aliyuncs.com/others/202210201054150.png)

**注意:这种优化方式只针对特定的场景，如果添加的元素是少量的、未知的，不推荐使用**

------

## ArrayList插入或删除元素一定比LinkedList慢么?

1. 数组删除元素确实要比链表慢，慢在需要创建新数组，还有比较麻烦的数据拷贝，但是在ArrayList底层不是每次删除元素都需要扩容，因此在这个方面相对于链表来说数组的性能更好
2. LinkedList删除元素之所以效率并不高，其原理在于底层先需要对整个集合进行折半的动作，然后又需要对集合进行遍历一次，这些操作导致效率变低

------

## ArrayList是线程安全的么？

- ArrayList不是线程安全的,使用一个案例演示

```java
//线程任务类
public class CollectionTask implements Runnable {
    //通过构造方法共享一个集合
    private List<String> list;
    public CollectionTask(List<String> list) {
        this.list = list;
  } 
    @Override
    public void run() {
      try {
        Thread.sleep(1000);
    } catch (InterruptedException e) {
        e.printStackTrace();
}
    //把当前线程名字加入到集合
    list.add(Thread.currentThread().getName());
  }
} 
//测试类
public class CollectionTest01 {
    public static void main(String[] args) throws InterruptedException {
    //创建集合
    List<String> list = new ArrayList<String>();
    //创建线程任务
    CollectionTask ct = new CollectionTask(list);
    //开启50条线程
    for (int i = 0; i < 50; i++) {
        new Thread(ct).start();
} 
    //确保子线程执行完毕
    Thread.sleep(1000);
    //遍历集合
    for (int i = 0; i < list.size(); i++) {
       System.out.println(list.get(i));
  }
       System.out.println("集合长度: "+list.size());
 }
}
```

**效果图**

![image-20221020105428381](https://studyimages.oss-cn-beijing.aliyuncs.com/others/202210201054506.png)

**需要线程安全怎么办?**

- 方式一:使用Collections.synchronizedList(list)

```java
//线程任务类
public class CollectionTask implements Runnable {
    //通过构造方法共享一个集合
    private List<String> list;
    public CollectionTask(List<String> list) {
        this.list = list;
} 
    @Override
    public void run() {
      try {
        Thread.sleep(1000);
    } catch (InterruptedException e) {
        e.printStackTrace();
} 
        //把当前线程名字加入到集合
        list.add(Thread.currentThread().getName());
   }
} 
//测试类
public class CollectionTest01 {
    public static void main(String[] args) throws InterruptedException {
    //创建集合
    List<String> list = new ArrayList<String>();
    //通过Collections工具类把List变成一个线程安全的集合
    list = Collections.synchronizedList(list);
    //创建线程任务
    CollectionTask ct = new CollectionTask(list);
    //开启50条线程
    for (int i = 0; i < 50; i++) {
        new Thread(ct).start();
} 
    //确保子线程执行完毕
    Thread.sleep(1000);
    //遍历集合
    for (int i = 0; i < list.size(); i++) {
        System.out.println(list.get(i));
} 
        System.out.println("集合长度: "+list.size());
    }
}
```

**效果图**

![image-20221020105457433](https://studyimages.oss-cn-beijing.aliyuncs.com/others/202210201054550.png)

- 方式二:

```java
/
/线程任务类
public class CollectionTask implements Runnable {
    //通过构造方法共享一个集合
    private List<String> list;
    public CollectionTask(List<String> list) {
        this.list = list;
} 
    @Override
    public void run() {
        try {
        Thread.sleep(1000);
    } catch (InterruptedException e) {
        e.printStackTrace();
} 
    //把当前线程名字加入到集合
    list.add(Thread.currentThread().getName());
 }
} 
    //测试类
public class CollectionTest01 {
    public static void main(String[] args) throws InterruptedException {
    //创建线程安全的集合类Vector
    List<String> list = new Vector<>();
    //通过Collections工具类把List变成一个线程安全的集合
    list = Collections.synchronizedList(list);
    //创建线程任务
    CollectionTask ct = new CollectionTask(list);
    //开启50条线程
    for (int i = 0; i < 50; i++) {
        new Thread(ct).start();
} 
    //确保子线程执行完毕
    Thread.sleep(1000);
    //遍历集合
    for (int i = 0; i < list.size(); i++) {
       System.out.println(list.get(i));
} 
       System.out.println("集合长度: "+list.size());
    }
}
```

**效果图**

![image-20221020105516155](https://studyimages.oss-cn-beijing.aliyuncs.com/others/202210201055274.png)

**实际开发场景**

案例:使用JdbcTemplate查询数据库返回一个List集合是否需要保证线程安全?

```java
public class Test01 {
    //创建JdbcTemplate对象
    JdbcTemplate jt = new JdbcTemplate(JDBCUtils.getDataSource());
    //3.利用JDBC查询出基础班在读的男学员的所有信息按成绩的降序输出到控制台上（利用JDBC）
    @Test
    public void fun1() throws Exception {
      //拼写SQL
      String sql = "select * from stutb where sex = ? and type like ? order by scoredesc";
     //调用方法查询 将结果集的每一行都封装成一个Stutb对象,并把每一个对象都添加到集合
    //查询的结果是否需要保证线程安全???
    List<Stutb> list = jt.query(sql, new BeanPropertyRowMapper<Stutb>(Stutb.class),"男", "%基础班%");
    //在遍历集合取出结果集之前面临一个问题,使用普通for遍历好 还是使用迭代器(增强for)?
    //特别是数据量特别大的时候一定要考虑!
    //对返回的集合进行判断,如果返回的集合实现了 RandomAccess 就使用 普通for
    //否则使用迭代器(增强for)
    if(list instanceof RandomAccess){
        for (int i = 0; i < list.size(); i++) {
            System.out.println(list.get(i));
    }
  }else {
        for (Stutb stutb : list) {
            System.out.println(stutb);
    }
  }
 }
}
```

------

## 如何复制某个ArrayList到另一个ArrayList中去？

- 使用clone()方法
- 使用ArrayList构造方法
- 使用addAll方法

------

## 已知成员变量集合存储N多用户名称,在多线程的环境下,使用迭代器在读取集合数据的同时如何保证还可以正常的写入数据到集合?

普通集合 ArrayList

```java
//线程任务类
class CollectionThread implements Runnable{
    private static ArrayList<String> list = new ArrayList<String>();
    static{
        list.add("Jack");
        list.add("Lucy");
        list.add("Jimmy");
} 
    @Override
    public void run() {
        for (String value : list) {
           System.out.println(value);
           //在读取数据的同时又向集合写入数据
            list.add("coco");
      }
    }
} 
//测试类
public class ReadAndWriteTest {
    public static void main(String[] args) {
    //创建线程任务
    CollectionThread ct = new CollectionThread();
    //开启10条线程
    for (int i = 0; i < 10; i++) {
        new Thread(ct).start();
     }
  }
}
```

**效果图**

![image-20221020105551826](https://studyimages.oss-cn-beijing.aliyuncs.com/others/202210201055932.png)

**读写分离集合**

```java
//线程任务类
class CollectionThread implements Runnable{
private static CopyOnWriteArrayList<String> list = new CopyOnWriteArrayList<>();
static{
    list.add("Jack");
list.add("Lucy");
list.add("Jimmy");
} @
Override
public void run() {
for (String value : list) {
System.out.println(value);
//在读取数据的同时又向集合写入数据
list.add("coco");
}
}
} /
/测试类
public class ReadAndWriteTest {
public static void main(String[] args) {
//创建线程任务
CollectionThread ct = new CollectionThread();
//开启10条线程
for (int i = 0; i < 10; i++) {
new Thread(ct).start();
}
}
}
```

**效果图**

![image-20221020105624292](https://studyimages.oss-cn-beijing.aliyuncs.com/others/202210201056389.png)

------

## ArrayList 和 LinkList区别？

- ArrayList

1. ArrayList基于动态数组的数据结构
2. 对于随机访问的get和set，ArrayList要优于LinkedList
3. 对于随机操作的add和remove，ArrayList不一定比LinkedList慢 (ArrayList底层由于是动态数组，因此并不是每次add和remove的时候都需要创建新数组)

- LinkedList

1. 基于链表的数据结构
2. 对于顺序操作，LinkedList不一定比ArrayList慢
3. 对于随机操作，LinkedList效率明显较低