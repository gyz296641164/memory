---
title: 48_AOP代理的创建：aspectj是怎么来完成方法级别精准匹配的？
category:
  - Spring源码
star: true
sticky: true
date: 2023-03-17
---

<!-- more -->

## 开篇

上篇文章我们分析了切点表达式与目标类匹配的前半部分，也就是类级别的匹配，而这篇文章我们就来看最最核心的一块，那就是方法级别的精确匹配是怎么来玩儿的。

方法精确匹配这块源码呢，其实不难，但就是比较繁琐，不过只要大家多看几遍，相信大家都是可以掌握的，本篇文章主要会从以下几部分进行讲解：

1. 首先我们会衔接着上篇文章，一路往下分析，然后找到真正的**方法精确匹配入口`matchesExactlyMethod()`**
2. 接着我们会来分析matchesExactlyMethod()中的核心源码，看下方法精确匹配到底会从哪几个维度进行匹配
3. 最后我们会详细看下方法参数维度的匹配是怎么来玩儿的

在开始分析之前，我们先来猜测一下方法精确匹配，可能会从哪几个维度进行匹配，首先我们知道方法中比较重要的“属性”分别有`方法参数`、`方法名字`、`方法返回值`等信息，那么方法精确匹配是不是从这几个维度下手，进行的匹配呢？

目前虽然确定不了，但是这确实是一种可行的方案，那aspectj到底是不是按照这套方案进行匹配的呢？只能说目前不知道，但是我们可以带着这个疑问探索下去。

好了，废话不多说，我们现在就开始分析。

---

## 千辛万苦，终于找到方法精确匹配的入口了

> 涉及方法：
>
> - `org.aspectj.weaver.tools.PointcutExpression.matchesMethodExecution(Method aMethod)`
> - `org.aspectj.weaver.internal.tools.PointcutExpressionImpl.matchesExecution(Member aMember)`
> - `org.aspectj.weaver.internal.tools.PointcutExpressionImpl.getShadowMatch(Shadow forShadow)`
> - `org.aspectj.weaver.patterns.Pointcut.match(Shadow shadow)`
> - `org.aspectj.weaver.patterns.Pointcut.matchInternal(Shadow shadow)`
> - `org.aspectj.weaver.patterns.SignaturePattern.matches(Member joinPointSignature, World world, boolean allowBridgeMethods)`

上篇文章我们分析到了这个地方，大家先来回顾一下，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302131321474.png)

现在我们知道obtainPointcutExpression()方法返回的是一个PointcutExpressionImpl类的实例，那么接下来就会调用PointcutExpressionImpl类的matchesMethodExecution(methodToMatch)方法，来完成切点表达式和目标类的匹配。

那我们现在就来看下PointcutExpressionImpl类的matchesMethodExecution(methodToMatch)方法吧，此时我们会看到如下代码：

代码所在类的全限定类名：org.aspectj.weaver.internal.tools.PointcutExpressionImpl

```java
	public ShadowMatch matchesMethodExecution(Method aMethod) {
		// 从这里进去匹配
        ShadowMatch match = matchesExecution(aMethod);
		if (MATCH_INFO && match.maybeMatches()) {
			System.out.println("MATCHINFO: method execution match on '" + aMethod + "' for '" + this.expression + "': "
					+ (match.alwaysMatches() ? "YES" : "MAYBE"));
		}
		return match;
	}

	private ShadowMatch matchesExecution(Member aMember) {
		// 这行代码可以暂时忽略
        Shadow s = ReflectionShadow.makeExecutionShadow(world, aMember, this.matchContext);
		// 这里是重点
        ShadowMatchImpl sm = getShadowMatch(s);
		sm.setSubject(aMember);
		sm.setWithinCode(null);
		sm.setWithinType(aMember.getDeclaringClass());
		return sm;
	}

	private ShadowMatchImpl getShadowMatch(Shadow forShadow) {
		// 切点表达式匹配
        org.aspectj.util.FuzzyBoolean match = pointcut.match(forShadow);
		// 省略部分代码
		return sm;
	}
```

通过上边的代码，我们可以看到在matchesMethodExecution()方法中又调用了matchesExecution(aMethod)方法来完成匹配，而matchesExecution(aMethod)方法中的重点是getShadowMatch(s)方法

在getShadowMatch(s)方法中，调用了pointcut.match(forShadow)完成了切点表达式的匹配，而pointcut.match(forShadow)的代码如下：

代码所在类的全限定类名：org.aspectj.weaver.patterns.Pointcut

```java
	/**
	 * Do I really match this shadow? XXX implementors need to handle state
	 */
	public final FuzzyBoolean match(Shadow shadow) {
		// 省略部分代码
		if (shadow.getKind().isSet(couldMatchKinds())) {
			// 这里开始匹配
            ret = matchInternal(shadow);
		} else {
			ret = FuzzyBoolean.NO;
		}
		// 省略部分代码
		return ret;
	}
```

通过上边的代码，我们可以看到，这里又继续调用了matchInternal(shadow)方法完成了匹配，我们继续往下深入，此时matchInternal(shadow)代码如下：

代码所在类的全限定类名：org.aspectj.weaver.patterns.KindedPointcut

```java
	@Override
	protected FuzzyBoolean matchInternal(Shadow shadow) {
		if (shadow.getKind() != kind) {
			return FuzzyBoolean.NO;
		}

		if (shadow.getKind() == Shadow.SynchronizationLock && kind == Shadow.SynchronizationLock) {
			return FuzzyBoolean.YES;
		}
		if (shadow.getKind() == Shadow.SynchronizationUnlock && kind == Shadow.SynchronizationUnlock) {
			return FuzzyBoolean.YES;
		}

        // signature.matches() 签名匹配，核心方法
		if (!signature.matches(shadow.getMatchingSignature(), shadow.getIWorld(), this.kind == Shadow.MethodCall)) {
			// 省略部分代码
			return FuzzyBoolean.NO;
		}

		return FuzzyBoolean.YES;
	}
```

通过上边的代码，我们可以看到，在matchInternal()方法刚进来时先做了一些判断，然后接着又调用了signature.matches()，从这个方法的名字来看，是对签名进行匹配，看起来离匹配的核心逻辑已经非常近了，接下来我们点进去看下这个signature.matches()的代码，大家看这里

代码所在类的全限定类名：org.aspectj.weaver.patterns.SignaturePattern

```java
	@Override
	public boolean matches(Member joinPointSignature, World world, boolean allowBridgeMethods) {
		// 省略部分代码
		while (candidateMatches.hasNext()) {
			JoinPointSignature aSig = candidateMatches.next();
			// System.out.println(aSig);
            // 精确匹配
			FuzzyBoolean matchResult = matchesExactly(aSig, world, allowBridgeMethods, subjectMatch);
			if (matchResult.alwaysTrue()) {
				return true;
			} else if (matchResult.alwaysFalse()) {
				return false;
			}
			// 省略部分代码
		}
		return false;
	}

	private FuzzyBoolean matchesExactly(JoinPointSignature aMember, World inAWorld, boolean allowBridgeMethods, boolean subjectMatch) {
		// 省略部分代码

		FuzzyBoolean matchesIgnoringAnnotations = FuzzyBoolean.YES;
		if (kind == Member.STATIC_INITIALIZATION) {
            // 静态初始化类型的匹配
			matchesIgnoringAnnotations = matchesExactlyStaticInitialization(aMember, inAWorld);
		} else if (kind == Member.FIELD) {
            // 属性精确匹配
			matchesIgnoringAnnotations = matchesExactlyField(aMember, inAWorld);
		} else if (kind == Member.METHOD) {
            // 方法精确匹配，因为我们就是要匹配方法，所以当然会走这里
			matchesIgnoringAnnotations = matchesExactlyMethod(aMember, inAWorld, subjectMatch);
		} else if (kind == Member.CONSTRUCTOR) {
            // 构造方法精确匹配
			matchesIgnoringAnnotations = matchesExactlyConstructor(aMember, inAWorld);
		}
		if (matchesIgnoringAnnotations.alwaysFalse()) {
			return FuzzyBoolean.NO;
		}

		// 省略部分代码

	}
```

在这个matches()方法中，最最核心的是调用了matchesExactly()方法，从方法名matchesExactly()来看，它的作用就是做精确匹配的。

当我们看到matchesExactly()方法的代码后，我们发现了新大陆，在这个方法中，它进一步区分了当前你要做的是属性的精确匹配，还是方法的精确匹配，又或者是构造方法的精确匹配.

我们现在要做的当然是方法级别的精确匹配啦，所以就会进入if (kind == Member.METHOD)这个if分支，接着就会调用matchesExactlyMethod()方法来完成方法级别的精确匹配。

---

## 初步分析下精确匹配matchesExactlyMethod()的代码

此时我们迫不及待的点开matchesExactlyMethod()方法，方法中的代码也随之展示在了我们的眼前

代码所在类的全限定类名：`org.aspectj.weaver.patterns.SignaturePattern`

```java
	/**
	 * Matches on name, declaring type, return type, parameter types, throws types
	 */
	private FuzzyBoolean matchesExactlyMethod(JoinPointSignature aMethod, World world, boolean subjectMatch) {
		// 判断方法参数是够匹配，不匹配返回NO
        if ( (aMethod)) {
			// System.err.println("Parameter types pattern " + parameterTypes + " pcount: " + aMethod.getParameterTypes().length);
			return FuzzyBoolean.NO;
		}
		// OPTIMIZE only for exact match do the pattern match now? Otherwise defer it until other fast checks complete?
		// 判断方法名称是够匹配，不匹配返回NO
        if (!name.matches(aMethod.getName())) {
			return FuzzyBoolean.NO;
		}
		// Check the throws pattern
        // 判断方法抛出异常是够匹配，不匹配返回NO
		if (subjectMatch && !throwsPattern.matches(aMethod.getExceptions(), world)) {
			return FuzzyBoolean.NO;
		}

		// '*' trivially matches everything, no need to check further
		if (!declaringType.isStar()) {
			if (!declaringType.matchesStatically(aMethod.getDeclaringType().resolve(world))) {
				return FuzzyBoolean.MAYBE;
			}
		}

		// '*' would match any return value
        // 判断返回值类型是够匹配，不匹配返回NO
        // 如果切点表达式返回值类型为*，则表示可以匹配任何类型，就没必要进行下边的匹配
        // 而如果切点表达式返回值类型不是*，则对返回值类型进行匹配
		if (!returnType.isStar()) {
			boolean b = returnType.isBangVoid();
			if (b) {
				String s = aMethod.getReturnType().getSignature();
				if (s.length() == 1 && s.charAt(0) == 'V') {
					// it is void, so not a match
					return FuzzyBoolean.NO;
				}
			} else {
				if (returnType.isVoid()) {
					String s = aMethod.getReturnType().getSignature();
					if (s.length() != 1 || s.charAt(0) != 'V') {
						// it is not void, so not a match
						return FuzzyBoolean.NO;
					}
				} else {
					if (!returnType.matchesStatically(aMethod.getReturnType().resolve(world))) {
						// looking bad, but there might be parameterization to consider...
						if (!returnType.matchesStatically(aMethod.getGenericReturnType().resolve(world))) {
							// ok, it's bad.
							return FuzzyBoolean.MAYBE;
						}
					}
				}
			}
		}

		// The most simple case: pattern is (..) will match anything
		// 如果切点表达式方法参数只配置了一个参数，且这个参数是..
        // 那么就表示可以匹配任何参数类型，此时直接返回YES
        if (parameterTypes.size() == 1 && parameterTypes.get(0).isEllipsis()) {
			return FuzzyBoolean.YES;
		}

        // 如果切点表达式配置的参数个数和目标方法的参数个数不相等时，那么直接返回NO
		if (!parameterTypes.canMatchSignatureWithNParameters(aMethod.getParameterTypes().length)) {
			return FuzzyBoolean.NO;
		}

		// OPTIMIZE both resolution of these types and their annotations should be deferred - just pass down a world and do it lower
		// down
		// ResolvedType[] resolvedParameters = world.resolve(aMethod.getParameterTypes());

		ResolvableTypeList rtl = new ResolvableTypeList(world, aMethod.getParameterTypes());
		// Only fetch the parameter annotations if the pointcut is going to be matching on them
		// 当方法参数上加了注解时，就需要来匹配参数注解
        ResolvedType[][] parameterAnnotationTypes = null;
		if (isMatchingParameterAnnotations()) {
			parameterAnnotationTypes = aMethod.getParameterAnnotationTypes();
			if (parameterAnnotationTypes != null && parameterAnnotationTypes.length == 0) {
				parameterAnnotationTypes = null;
			}
		}

        // 对方法参数的类型进行匹配
		if (!parameterTypes.matches(rtl, TypePattern.STATIC, parameterAnnotationTypes).alwaysTrue()) {
			// It could still be a match based on the generic sig parameter types of a parameterized type
			if (!parameterTypes.matches(new ResolvableTypeList(world, aMethod.getGenericParameterTypes()), TypePattern.STATIC,
					parameterAnnotationTypes).alwaysTrue()) {
				return FuzzyBoolean.MAYBE;
				// It could STILL be a match based on the erasure of the parameter types??
				// to be determined via test cases...
			}
		}

		// check that varargs specifications match
        // 对可变参数的处理，检查可变参数是否匹配
		if (!matchesVarArgs(aMethod, world)) {
			return FuzzyBoolean.MAYBE;
		}

		// passed all the guards..
		return FuzzyBoolean.YES;
	}
```

可以看到，这个方法的代码还是挺多的，我们还是一块代码一块代码来分析。

在刚进去matchesExactlyMethod()方法时，首先会执行下边这块代码：

```java
		// 判断方法参数是够匹配，不匹配返回NO
        if (parametersCannotMatch(aMethod)) {
			// System.err.println("Parameter types pattern " + parameterTypes + " pcount: " + aMethod.getParameterTypes().length);
			return FuzzyBoolean.NO;
		}
		// OPTIMIZE only for exact match do the pattern match now? Otherwise defer it until other fast checks complete?
		// 判断方法名称是够匹配，不匹配返回NO
        if (!name.matches(aMethod.getName())) {
			return FuzzyBoolean.NO;
		}
		// Check the throws pattern
        // 判断方法抛出异常是够匹配，不匹配返回NO
		if (subjectMatch && !throwsPattern.matches(aMethod.getExceptions(), world)) {
			return FuzzyBoolean.NO;
		}

		// 省略部分代码

		// '*' would match any return value
        // 判断返回值类型是够匹配，不匹配返回NO
        // 如果切点表达式返回值类型为*，则表示可以匹配任何类型，就没必要进行下边的匹配
        // 而如果切点表达式返回值类型不是*，则对返回值类型进行匹配
		if (!returnType.isStar()) {
			// 省略部分代码
		}
```

通过上边的代码，我们可以看到，先是调用了parametersCannotMatch(aMethod)方法来判断方法参数是够匹配，然后又调用了name.matches()判断方法名字是够匹配，接着又调用了throwsPattern.matches()判断方法抛出异常是够匹配。

而且我们再往下看，还发现了对方法返回值的匹配逻辑。

说白了这里就是将增强中定义的切点表达式与目标方法进行匹配，也就是看下这个方法是否符合切点表达式的要求，而具体匹配的内容分别包含方法参数是否匹配、方法名字是否匹配、方法抛出异常是否匹配、方法返回值是否匹配等。

大家都知道，通过方法参数、方法名字、方法抛出异常、方法返回值这些信息都可以唯一确定一个方法了，所以aspectj就是通过分别判断方法参数、方法名字、方法抛出异常、方法返回值是够匹配，来确定目标类的方法是够匹配切点表达式的。

好，我们继续往下看，此时会看到下边这块代码：

```java
		// The most simple case: pattern is (..) will match anything
		// 如果切点表达式方法参数只配置了一个参数，且这个参数是..
        // 那么就表示可以匹配任何参数类型，此时直接返回YES
        if (parameterTypes.size() == 1 && parameterTypes.get(0).isEllipsis()) {
			return FuzzyBoolean.YES;
		}
```

结合变量的命名和注释来看，我们可以判断出这个parameterTypes其实就是切点表达式中的方法参数数组，那么parameterTypes.size() == 1满足的话说明此时切点表达式只配置了一个参数，并且此时parameterTypes.get(0).isEllipsis()满足的话，说明这个参数是一个省略号..

说白了当整个条件parameterTypes.size() == 1 && parameterTypes.get(0).isEllipsis()的结果为true时，说明此时切点表达式的方法参数中，也就是那个括号中只配置了一个参数，并且**这个参数配置的是省略号..，就比如我们日志增强配置的切点表达式**，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302131415498.png)

说白了这种情况就是**切点表达式不限制目标方法的参数个数，因此不管你目标方法中有没有参数，或者有多少个参数，统统都满足**，所以当parameterTypes.size() == 1 && parameterTypes.get(0).isEllipsis()这行代码满足时，直接返回了FuzzyBoolean.YES，此时代表匹配成功。

那如果切点表达式方法参数个数和目标方法参数个数不相等呢？此时会返回什么？

别急，我们继续往下看，此时会看到这个判断

```java
if (!parameterTypes.canMatchSignatureWithNParameters(aMethod.getParameterTypes().length)) {
    return FuzzyBoolean.NO;
}
```

这里调用了canMatchSignatureWithNParameters()方法进行判断，并且将目标方法的参数个数作为入参传了进去，再结合这个canMatchSignatureWithNParameters()方法的名字，我们大概判断出这个方法就是当切点表达式配置的参数个数和目标方法的参数个数不相等时，会直接返回NO，说白了就是不匹配的意思。

剩下的代码我们就不深入去看了，这些都是aspectj包下的代码，我们的重点还是分析Spring本身的源码，有兴趣的同学可以按照本篇文章的思路自行阅读源码，其实匹配这块不难，就是处理流程非常繁琐，所以我们还是把握住主线。

---

## 来分析下方法的参数匹配是怎么玩儿的

对了，在刚进入matchesExactlyMethod()方法时，不是分别判断了一下方法参数、方法名字和方法抛出异常是否匹配吗？其实就是这块代码

```java
		// 判断方法参数是够匹配，不匹配返回NO
        if (parametersCannotMatch(aMethod)) {
			// System.err.println("Parameter types pattern " + parameterTypes + " pcount: " + aMethod.getParameterTypes().length);
			return FuzzyBoolean.NO;
		}
		// OPTIMIZE only for exact match do the pattern match now? Otherwise defer it until other fast checks complete?
		// 判断方法名称是够匹配，不匹配返回NO
        if (!name.matches(aMethod.getName())) {
			return FuzzyBoolean.NO;
		}
		// Check the throws pattern
        // 判断方法抛出异常是够匹配，不匹配返回NO
		if (subjectMatch && !throwsPattern.matches(aMethod.getExceptions(), world)) {
			return FuzzyBoolean.NO;
		}
```

这里我们就以方法参数匹配为例，来看一下aspectj是怎么来玩儿的，这个方法参数匹配核心方法parametersCannotMatch()代码如下：

代码所在类的全限定类名：org.aspectj.weaver.patterns.SignaturePattern

```java
	/**
	 * Quickly detect if the joinpoint absolutely cannot match becaused the method parameters at the joinpoint cannot match against
	 * this signature pattern.
	 * 
	 * @param methodJoinpoint the joinpoint to quickly match against
	 * @return true if it is impossible for the joinpoint to match this signature
	 */
	private boolean parametersCannotMatch(JoinPointSignature methodJoinpoint) {
		// 当目标方法是可变参数方法时，直接返回false
        // 此时表示切点表达式和目标方法是匹配的
        if (methodJoinpoint.isVarargsMethod()) {
			// just give up early (for now)
			return false;
		}
		
        // 切点表达式配置的方法参数个数
		int patternParameterCount = parameterTypes.size();

        // 切点表达式配置的方法参数个数是0 或 切点表达式配置的省略号个数是0，也就是没有配置省略号..
		if (patternParameterCount == 0 || parameterTypes.ellipsisCount == 0) {
			boolean equalCount = patternParameterCount == methodJoinpoint.getParameterTypes().length;

			// Quick rule: pattern specifies zero parameters, and joinpoint has parameters *OR*
			// 切点表达式配置的参数个数为0，但是目标方法参数个数不为0，代表不匹配，此时直接返回false
            if (patternParameterCount == 0 && !equalCount) {
				return true;
			}

			// Quick rule: pattern doesn't specify ellipsis and there are a different number of parameters on the
			// method join point as compared with the pattern
			// 进入这个if分支需要同时满足2个条件
            // 条件1：当切点表达式配置的省略号个数为0，也就是参数没有配置为..
            // 条件2：目标方法参数个数和切点表达式配置的参数个数不相等
            if (parameterTypes.ellipsisCount == 0 && !equalCount) {
				// 如果此时是切点表达式参数个数大于0，并且切点表达式的最后一个参数是可变参数，那么代表是匹配的，此时直接返回false
                if (patternParameterCount > 0 && parameterTypes.get(patternParameterCount - 1).isVarArgs()) {
					return false;
				}
                // 其他情况表示不匹配，此时返回true
				return true;
			}
		}

		return false;
	}
```

上边的代码，按照惯例，我们还是一块一块来分析

在刚进入这个parametersCannotMatch()方法时，首先会看到这块代码，如下：

```java
		// 当目标方法是可变参数方法时，直接返回false
        // 此时表示切点表达式和目标方法是匹配的
        if (methodJoinpoint.isVarargsMethod()) {
			// just give up early (for now)
			return false;
		}
```

上边这块代码的意思是看一下目标方法是不是可变参数类型，如果是可变参数方法的话直接返回false，此时代表是匹配的。

如果目标方法不是可变参数方法的话，那么就会继续往下运行，此时就会执行下边这块代码：

```java
		// 切点表达式配置的方法参数个数是0 或 切点表达式配置的省略号个数是0，也就是没有配置省略号..
		if (patternParameterCount == 0 || parameterTypes.ellipsisCount == 0) {
			boolean equalCount = patternParameterCount == methodJoinpoint.getParameterTypes().length;

			// Quick rule: pattern specifies zero parameters, and joinpoint has parameters *OR*
			// 切点表达式配置的参数个数为0，但是目标方法参数个数不为0，代表不匹配，此时直接返回false
            if (patternParameterCount == 0 && !equalCount) {
				return true;
			}

			// Quick rule: pattern doesn't specify ellipsis and there are a different number of parameters on the
			// method join point as compared with the pattern
			// 进入这个if分支需要同时满足2个条件
            // 条件1：当切点表达式配置的省略号个数为0，也就是参数没有配置为..
            // 条件2：目标方法参数个数和切点表达式配置的参数个数不相等
            if (parameterTypes.ellipsisCount == 0 && !equalCount) {
				// 如果此时是切点表达式参数个数大于0，并且切点表达式的最后一个参数是可变参数，那么代表是匹配的，此时直接返回false
                if (patternParameterCount > 0 && parameterTypes.get(patternParameterCount - 1).isVarArgs()) {
					return false;
				}
                // 其他情况表示不匹配，此时返回true
				return true;
			}
		}
```

通过上边的代码，大家可以看到，在进入这个if分支后，会执行patternParameterCount == 0 && !equalCount这行代码，意思就是当切点表达式配置参数个数为0，且目标方法参数个数不为0时就返回true

说白了就是切点表达式配置的参数个数和目标方法的参数个数不匹配的情况，那么此时就会直接返回true，代表不匹配，就是这个意思，而剩下的代码也类似，都是一个套路。

这里唯一需要注意的，就是这个parametersCannotMatch()方法表示的是“参数是不是不匹配？”，所以当它返回false时，代表切点表达式和目标方法的参数是匹配的，而如果返回true的话，反而表示切点表达式和目标方法的参数是不匹配的，这个大家要注意，一定要结合上下文来理解这个parametersCannotMatch()方法。

还有就是我们发现上边的一大块代码，只有在条件patternParameterCount == 0 || parameterTypes.ellipsisCount == 0为true时，才会执行，也就是这块代码主要处理 “切点表达式方法参数个数为0” 或 “切点表达式没有配置省略号..”这2种情况的

那这里可能有同学问了，那如果是“切点表达式参数个数不为0” 或 “切点表达式配置了省略号..” 这两种情况的话，既然不是在这里处理的，那是在哪里进行处理的呢？

其实，这个parametersCannotMatch()方法只是一个初步的方法参数判断而已，如果真的出现了这两种情况，就会走下边这块代码进行处理

```java
	/**
	 * Matches on name, declaring type, return type, parameter types, throws types
	 */
	private FuzzyBoolean matchesExactlyMethod(JoinPointSignature aMethod, World world, boolean subjectMatch) {
		// 省略部分代码...

		// The most simple case: pattern is (..) will match anything
		// 如果切点表达式方法参数只配置了一个参数，且这个参数是..
        // 那么就表示可以匹配任何参数类型，此时直接返回YES
        if (parameterTypes.size() == 1 && parameterTypes.get(0).isEllipsis()) {
			return FuzzyBoolean.YES;
		}

        // 如果切点表达式配置的参数个数和目标方法的参数个数不相等时，那么直接返回NO
		if (!parameterTypes.canMatchSignatureWithNParameters(aMethod.getParameterTypes().length)) {
			return FuzzyBoolean.NO;
		}

		// 省略部分代码

		// passed all the guards..
		return FuzzyBoolean.YES;
	}
```

大家发现没，这个不就是我们一开始分析的那块代码吗？所以分析源码的时候，大家要结合着上下文去理解，整体思路大家要把握好，这样分析源码会事半功倍

分析到这里，我们基本搞清楚了aspectj匹配方法的套路，简单说就是，aspectj会根据切点表达式的配置，分别与目标方法的方法参数、方法名字、方法返回参数、方法抛出异常进行匹配，如果都满足的话，那么就表示当前目标方法是满足切点表达式的，也同时说明目标方法所在的类是需要设置代理的！

---

## 回到主线，看看我们目前进展到哪里了

如果目标方法匹配上了切点表达式之后，那么此时就会返回true

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302131438764.png)

当matches()方法返回后，那么canApply()方法就会返回true，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302131438323.png)

通过上边的代码，我们可以知道，只要目标类中任意一个方法与增强中的切点表达式匹配上，那么就直接返回true，此时就代表当前增强是适合这个目标类的，同时也表示这个目标类是需要设置为代理的。

接着canApply(candidate, clazz, hasIntroductions)这行代码也返回了true，此时就会将这个匹配成功的增强Advisor放入到eligibleAdvisors集合中，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302131438843.png)

需要注意的是，这里匹配的时候是一个for循环，也就是目标类会和所有的增强Advisors都匹配一遍，最终将目标类匹配上的增强Advisor给放到这个eligibleAdvisors集合中作为结果返回。

那么大家好不好奇现在这个eligibleAdvisors集合中都有哪些增强呢？

其实这个很简单，我们可以使用debug大法来看下这个eligibleAdvisors中到底有哪些增强，我们来看下边这张图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302131438170.png)

可以看到，在匹配之前，一共有6个增强，分别是切面类LoggingAspect中的before和afterReturning、切面类MonitorAspect中的before和afterReturning、切面类CacheAspect中的before和afterReturning。

而最后和目标类ProductServiceImpl相匹配的增强，分别是切面类LoggingAspect中的before和afterReturning、切面类MonitorAspect中的before和afterReturning这4个增强。

那为啥是这4个增强匹配上了productServiceImpl呢？

我们来看一下这三个切面类的切点表达式就明白了

切面类LoggingAspect代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302131438052.png)

切面类MonitorAspect代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302131438637.png)

切面类CacheAspect代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302131438151.png)

通过上边3个切面类的代码可以看到，切面类LoggingAspect和切面类MonitorAspect的切点表达式，都是匹配ProductServiceImpl类中所有方法的，而切面类CacheAspect中的切点表达式是用来匹配WithoutAopV2ProductServiceImpl类中所有方法的。

所以最后匹配结果eligibleAdvisors中有这4个增强，分别是切面类LoggingAspect的before增强和afterReturning增强，以及切面类MonitorAspect的before增强和afterReturning增强。

接着findAdvisorsThatCanApply()方法将匹配到的4个增强Advisor返回，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302131438600.png)

然后在findEligibleAdvisors()方法中，对这4个增强，也就是eligibleAdvisors进行排序，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302131438600.png)

这里为啥要排序呢？

因为刚开始讲AOP的时候，我们就讲了，切面类是可以实现Ordered接口，然后通过重写getOrder()方法来控制多个切面之间的执行顺序，所以这个sortAdvisors()方法，就会根据重写的getOrder()方法返回值，来对不同切面的增强进行排序，最后将排序后的增强作为最终结果进行返回。

接着getAdvicesAndAdvisorsForBean()方法接收到findEligibleAdvisors()方法返回的增强advisors后，将增强advisors转换成数组返回，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302131438150.png)

最后wrapIfNecessary()方法就接收到getAdvicesAndAdvisorsForBean()返回的增强集合specificInterceptors了，这个specificInterceptors就是目标类ProductServiceImpl匹配出来的4个增强，也就是拦截器，接着就会使用specificInterceptors来创建AOP动态代理了，代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302131438853.png)

到这里为止，获取目标类匹配的增强逻辑就分析完毕了，下一步就要利用获取到的这些增强来创建动态代理了！

---

## 总结

一张图来梳理下AOP代理的创建流程

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302131439706.png)

上图是目前为止，我们分析的AOP代理创建流程的源码图，其中红色背景的部分就是我们今天新分析的内容。

我们来总结一下，今天我们主要分析了方法级别精确匹配的源码，这块源码是在aspectj包下的matchesExactlyMethod()方法中完成的，匹配的过程呢，主要就是从方法参数、方法名字、方法抛出异常类型以及方法返回值几个维度分别进行了匹配，如果某一个维度没有匹配上，那么就匹配下一个方法。

而如果这些维度都匹配成功的话，那么说明目标类中的这个方法，是满足当前增强配置的切点表达式的，同时说明当前这个增强适用于目标类，这个目标类需要被设置为代理！

同时将匹配成功的增强放到集合eligibleAdvisors中，接着会对增强集合eligibleAdvisors进行排序，这个排序会影响到多个切面之间的执行顺序，最终将排序后结果进行返回，这个返回的结果就是后边生成代理需要使用的拦截器集合了。

好了，到目前为止，我们已经获取到了与当前bean（目标类）相匹配的增强了，也就是拦截器，接下来就要使用这些拦截器来创建AOP代理了，关于动态代理的创建过程，我们下篇文章再接着来分析。