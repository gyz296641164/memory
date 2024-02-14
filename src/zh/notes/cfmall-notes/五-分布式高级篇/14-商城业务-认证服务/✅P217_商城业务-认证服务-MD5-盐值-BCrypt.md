## MD5&MD5盐值加密

### MD5

**Message Digest algorithm 5，信息摘要算法**

- 压缩性：任意长度的数据，算出的MD5值长度都是固定的。
- 容易计算：从原数据计算出MD5值很容易。
- 抗修改性：对原数据进行任何改动，哪怕只修改1个字节，所得到的MD5值都有很大区别。
- 强抗碰撞：想找到两个不同的数据，使它们具有相同的MD5值，是非常困难的。
- 不可逆

### 加盐

- 通过生成随机数与MD5生成字符串进行组合
- 数据库同时存储MD5值与salt值。验证正确性时使用salt进行MD5即可

MD5并不安全，很多在线网站都可以破解MD5，通过使用彩虹表，暴力破解。**因此，需要通过使用MD5+盐值进行加密**。

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202304/202304071758009.png#id=rPgQu&originHeight=417&originWidth=989&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

> 附：**Apache.common下DigestUtils工具类的md5Hex()方法，将MD5加密后的数据转化为16进制**
>  
> ![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202304/202304071802655.png#id=mevvg&originHeight=143&originWidth=414&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)


---

## 密码加密

**加密分为可逆加密和不可逆加密。密码的加密为不可逆加密**

加盐：

- 方法1是加默认盐值：$1$xxxxxxxx
- 方法2是加自定义盐值

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202304/202304071800834.png#id=QjFTp&originHeight=315&originWidth=616&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

缺点：还需额外在数据库中存储盐值。

因此，可以使用Spring的**BCryptPasswordEncoder**，它的encode()方法使用的就是`MD5+盐值`进行加密，盐值是随机产生的

```java
package com.gyz.test.test;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class Md5SaltTest {
    public static void main(String[] args) {
        BCryptPasswordEncoder bCryptPasswordEncoder = new BCryptPasswordEncoder();
        String encode = bCryptPasswordEncoder.encode("123456");
        //$2a$10$qpgqG1buG1c4Z5VlFnrm5.ozWEaopebSvBVA6o7wljQ8uiEw9hfN2
        //$2a$10$4hBMaJhwLdcNJQyQHM9EeeB82h1zhh22bTHyyTcQbBRvWL77mA0eu
        System.out.println(encode);
    }
}
```

通过matches()方法进行密码是否一致

```java
package com.gyz.test.test;

import org.apache.commons.codec.digest.Md5Crypt;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class Md5SaltTest {
    public static void main(String[] args) {
        BCryptPasswordEncoder bCryptPasswordEncoder = new BCryptPasswordEncoder();
        String encode = bCryptPasswordEncoder.encode("123456");
        //$2a$10$qpgqG1buG1c4Z5VlFnrm5.ozWEaopebSvBVA6o7wljQ8uiEw9hfN2
        //$2a$10$4hBMaJhwLdcNJQyQHM9EeeB82h1zhh22bTHyyTcQbBRvWL77mA0eu
        System.out.println(encode);

        boolean matchFlag = bCryptPasswordEncoder.matches("123456", "$2a$10$qpgqG1buG1c4Z5VlFnrm5.ozWEaopebSvBVA6o7wljQ8uiEw9hfN2");
        System.out.println(matchFlag);
    }
}
```

运行结果

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202304/202304071815044.png#id=ntdeD&originHeight=59&originWidth=621&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

**用户注册业务中的密码加密**

`cfmall-member/src/main/java/com/gyz/cfmall/member/service/impl/MemberServiceImpl.java`
```java
    @Override
    public void register(MemberUserRegisterVo vo) {
        MemberEntity memberEntity = new MemberEntity();
        MemberEntity memberLevel = memberLevelDao.selectMemberLevel();
        memberEntity.setLevelId(memberLevel.getId());

        //检查用户名和手机号是否唯一
        checkUserNameUnique(vo.getUserName());
        checkPhoneUnique(vo.getPhone());
        memberEntity.setUsername(vo.getUserName());
        memberEntity.setMobile(vo.getPhone());

        BCryptPasswordEncoder bCryptPasswordEncoder = new BCryptPasswordEncoder();
        String encode = bCryptPasswordEncoder.encode(vo.getPassword());

        memberEntity.setPassword(encode);

        this.baseMapper.insert(memberEntity);
    }
```
