---
title: 600条Linux常用命令
category:
  - Linux
date: 2025-06-15

---

<!-- more -->



## 一、基本命令

:::info
+ <font style="color:rgb(1, 1, 1);">uname -m 	显示机器的处理器架构</font>
+ <font style="color:rgb(1, 1, 1);">uname -r 	显示正在使用的内核版本</font>
+ <font style="color:rgb(1, 1, 1);">cat /etc/centos-release	查看centos版本</font>
+ <font style="color:rgb(1, 1, 1);">dmidecode -q 	显示硬件系统部件</font>
+ <font style="color:rgb(1, 1, 1);">(SMBIOS / DMI) hdparm -i /dev/hda 罗列一个磁盘的架构特性</font>
+ <font style="color:rgb(1, 1, 1);">hdparm -tT /dev/sda 	在磁盘上执行测试性读取操作系统信息</font>
+ <font style="color:rgb(1, 1, 1);">arch 	显示机器的处理器架构</font>



**<font style="color:rgb(1, 1, 1);">CPU</font>**

**<font style="color:rgb(1, 1, 1);">总核数 = 物理CPU个数 X 每颗物理CPU的核数 </font>**

**<font style="color:rgb(1, 1, 1);">总逻辑CPU数 = 物理CPU个数 X 每颗物理CPU的核数 X 超线程数</font>**

+ <font style="color:rgb(1, 1, 1);">cat /proc/cpuinfo 显示CPU info的信息</font>
+ <font style="color:rgb(1, 1, 1);">lscpu   直接显示系统cpu核数</font>
+ <font style="color:rgb(1, 1, 1);">cat /proc/cpuinfo | grep "physical id" | uniq | wc -l    	查看物理CPU个数</font>
+ <font style="color:rgb(1, 1, 1);">cat /proc/cpuinfo | grep "cpu cores" | uniq			查看每个物理CPU中core的个数(即核数)</font>
+ <font style="color:rgb(1, 1, 1);">cat /proc/cpuinfo | grep 'model name' |uniq		查看CPU型号</font>
+ <font style="color:rgb(1, 1, 1);">cat /proc/interrupts 显示中断</font>
+ <font style="color:rgb(1, 1, 1);">cat /proc/meminfo 查看内容总容量</font>
+ <font style="color:rgb(1, 1, 1);">cat /proc/swaps 显示哪些swap被使用</font>
+ <font style="color:rgb(1, 1, 1);">cat /proc/version 显示内核的版本</font>
+ <font style="color:rgb(1, 1, 1);">cat /proc/net/dev 显示网络适配器及统计</font>
+ <font style="color:rgb(1, 1, 1);">cat /proc/mounts 显示已加载的文件系统</font>
+ <font style="color:rgb(1, 1, 1);">lspci -tv 罗列 PCI 设备</font>
+ <font style="color:rgb(1, 1, 1);">lsusb -tv 显示 USB 设备</font>
+ <font style="color:rgb(1, 1, 1);">date 显示系统日期</font>
+ <font style="color:rgb(1, 1, 1);">cal 2007 显示2007年的日历表</font>
+ <font style="color:rgb(1, 1, 1);">date 041217002007.00 设置日期和时间 - 月日时分年.秒</font>
+ <font style="color:rgb(1, 1, 1);">clock -w 将时间修改保存到 BIOS</font>

:::

---

## 二、关机


:::info
+ <font style="color:rgb(1, 1, 1);">shutdown -h now 关闭系统(1)</font>
+ <font style="color:rgb(1, 1, 1);">init 0 关闭系统(2)</font>
+ <font style="color:rgb(1, 1, 1);">telinit 0 关闭系统(3)</font>
+ <font style="color:rgb(1, 1, 1);">shutdown -h hours:minutes & 按预定时间关闭系统</font>
+ <font style="color:rgb(1, 1, 1);">shutdown -c 取消按预定时间关闭系统</font>
+ <font style="color:rgb(1, 1, 1);">shutdown -r now 重启(1)</font>
+ <font style="color:rgb(1, 1, 1);">reboot 重启(2)</font>
+ <font style="color:rgb(1, 1, 1);">logout 注销</font>

:::

---

## 三、文件和目录
:::info
+ <font style="color:rgb(1, 1, 1);">cd /home 进入 '/ home' 目录'</font>
+ <font style="color:rgb(1, 1, 1);">cd .. 返回上一级目录</font>
+ <font style="color:rgb(1, 1, 1);">cd ../.. 返回上两级目录</font>
+ <font style="color:rgb(1, 1, 1);">cd 进入个人的主目录</font>
+ <font style="color:rgb(1, 1, 1);">cd ~user1 进入个人的主目录</font>
+ <font style="color:rgb(1, 1, 1);">cd - 返回上次所在的目录</font>
+ <font style="color:rgb(1, 1, 1);">pwd 显示工作路径</font>
+ <font style="color:rgb(1, 1, 1);">ls 查看目录中的文件</font>
+ <font style="color:rgb(1, 1, 1);">ls -F 查看目录中的文件</font>
+ <font style="color:rgb(1, 1, 1);">ls -l 显示文件和目录的详细资料</font>
+ <font style="color:rgb(1, 1, 1);">ls -a 显示隐藏文件</font>
+ <font style="color:rgb(1, 1, 1);">ls [0-9] 显示包含数字的文件名和目录名</font>
+ <font style="color:rgb(1, 1, 1);">tree 显示文件和目录由根目录开始的树形结构(1)</font>
+ <font style="color:rgb(1, 1, 1);">lstree 显示文件和目录由根目录开始的树形结构(2)</font>
+ <font style="color:rgb(1, 1, 1);">mkdir dir1 创建一个叫做 'dir1' 的目录'</font>
+ <font style="color:rgb(1, 1, 1);">mkdir dir1 dir2 同时创建两个目录</font>
+ <font style="color:rgb(1, 1, 1);">mkdir -p /tmp/dir1/dir2 创建一个目录树</font>
+ <font style="color:rgb(1, 1, 1);">rm -f file1 删除一个叫做 'file1' 的文件'</font>
+ <font style="color:rgb(1, 1, 1);">rmdir dir1 删除一个叫做 'dir1' 的目录'</font>
+ <font style="color:rgb(1, 1, 1);">rm -rf dir1 删除一个叫做 'dir1' 的目录并同时删除其内容</font>
+ <font style="color:rgb(1, 1, 1);">rm -rf dir1 dir2 同时删除两个目录及它们的内容</font>
+ <font style="color:rgb(1, 1, 1);">mv dir1 new_dir 重命名/移动 一个目录</font>
+ <font style="color:rgb(1, 1, 1);">cp file1 file2 复制一个文件</font>
+ <font style="color:rgb(1, 1, 1);">cp dir/* . 复制一个目录下的所有文件到当前工作目录</font>
+ <font style="color:rgb(1, 1, 1);">cp -a /tmp/dir1 . 复制一个目录到当前工作目录</font>
+ <font style="color:rgb(1, 1, 1);">cp -a dir1 dir2 复制一个目录</font>
+ <font style="color:rgb(1, 1, 1);">ln -s file1 lnk1 创建一个指向文件或目录的软链接</font>
+ <font style="color:rgb(1, 1, 1);">ln file1 lnk1 创建一个指向文件或目录的物理链接</font>
+ <font style="color:rgb(1, 1, 1);">touch -t 0712250000 file1 修改一个文件或目录的时间戳 - (YYMMDDhhmm)</font>
+ <font style="color:rgb(1, 1, 1);">file file1 outputs the mime type of the file as text</font>
+ <font style="color:rgb(1, 1, 1);">iconv -l 列出已知的编码</font>
+ <font style="color:rgb(1, 1, 1);">iconv -f fromEncoding -t toEncoding inputFile > outputFile creates a new from the given input file by assuming it is encoded in fromEncoding and converting it to toEncoding.</font>
+ <font style="color:rgb(1, 1, 1);">find . -maxdepth 1 -name *.jpg -print -exec convert "{}" -resize 80x60 "thumbs/{}" ; batch resize files in the current directory and send them to a thumbnails directory (requires convert from Imagemagick)</font>

:::

---

## 四、文件搜索
:::info
+ <font style="color:rgb(1, 1, 1);">find / -name file1 从 '/' 开始进入根文件系统搜索文件和目录</font>
+ <font style="color:rgb(1, 1, 1);">find / -user user1 搜索属于用户 'user1' 的文件和目录</font>
+ <font style="color:rgb(1, 1, 1);">find /home/user1 -name *.bin 在目录 '/ home/user1' 中搜索带有'.bin' 结尾的文件</font>
+ <font style="color:rgb(1, 1, 1);">find /usr/bin -type f -atime +100 搜索在过去100天内未被使用过的执行文件</font>
+ <font style="color:rgb(1, 1, 1);">find /usr/bin -type f -mtime -10 搜索在10天内被创建或者修改过的文件</font>
+ <font style="color:rgb(1, 1, 1);">find / -name *.rpm -exec chmod 755 '{}' ; 搜索以 '.rpm' 结尾的文件并定义其权限</font>
+ <font style="color:rgb(1, 1, 1);">find / -xdev -name *.rpm 搜索以 '.rpm' 结尾的文件，忽略光驱、捷盘等可移动设备</font>
+ <font style="color:rgb(1, 1, 1);">locate *.ps 寻找以 '.ps' 结尾的文件 - 先运行 'updatedb' 命令</font>
+ <font style="color:rgb(1, 1, 1);">whereis halt 显示一个二进制文件、源码或man的位置</font>
+ <font style="color:rgb(1, 1, 1);">which halt 显示一个二进制文件或可执行文件的完整路径</font>

:::

---

## 五、挂载一个文件系统
:::info
+ <font style="color:rgb(1, 1, 1);">mount /dev/hda2 /mnt/hda2 挂载一个叫做hda2的盘 - 确定目录 '/ mnt/hda2' 已经存在</font>
+ <font style="color:rgb(1, 1, 1);">umount /dev/hda2 卸载一个叫做hda2的盘 - 先从挂载点 '/ mnt/hda2' 退出</font>
+ <font style="color:rgb(1, 1, 1);">fuser -km /mnt/hda2 当设备繁忙时强制卸载</font>
+ <font style="color:rgb(1, 1, 1);">umount -n /mnt/hda2 运行卸载操作而不写入 /etc/mtab 文件- 当文件为只读或当磁盘写满时非常有用</font>
+ <font style="color:rgb(1, 1, 1);">mount /dev/fd0 /mnt/floppy 挂载一个软盘</font>
+ <font style="color:rgb(1, 1, 1);">mount /dev/cdrom /mnt/cdrom 挂载一个cdrom或dvdrom</font>
+ <font style="color:rgb(1, 1, 1);">mount /dev/hdc /mnt/cdrecorder 挂载一个cdrw或dvdrom</font>
+ <font style="color:rgb(1, 1, 1);">mount /dev/hdb /mnt/cdrecorder 挂载一个cdrw或dvdrom</font>
+ <font style="color:rgb(1, 1, 1);">mount -o loop file.iso /mnt/cdrom 挂载一个文件或</font>ISO镜像文件
+ <font style="color:rgb(1, 1, 1);">mount -t vfat /dev/hda5 /mnt/hda5 挂载一个Windows FAT32文件系统</font>
+ <font style="color:rgb(1, 1, 1);">mount /dev/sda1 /mnt/usbdisk 挂载一个usb 捷盘或闪存设备</font>
+ <font style="color:rgb(1, 1, 1);">mount -t smbfs -o username=user,password=pass //WinClient/share /mnt/share 挂载一个windows网络共享</font>

:::

---

## 六、磁盘空间
:::info
+ <font style="color:rgb(1, 1, 1);">df -h 	显示已经挂载的分区列表</font>
+ <font style="color:rgb(1, 1, 1);">df -i  	查看索引节点的占用（Inodes）</font>
+ <font style="color:rgb(1, 1, 1);">du -sh *  	查看当前目录下每个子目录的磁盘使用情况</font>
+ <font style="color:rgb(1, 1, 1);">lsblk   查看所有磁盘及分区大小</font>
    - <font style="color:rgb(1, 1, 1);">SIZE 列显示磁盘/分区大小。</font>
    - <font style="color:rgb(1, 1, 1);">TYPE="disk" 表示物理磁盘（如 /dev/sda、/dev/vda）。</font>
    - <font style="color:rgb(1, 1, 1);">TYPE="part" 表示分区（如 /dev/sda1）。</font>
+ <font style="color:rgb(1, 1, 1);">find -name "error_2024-12-*.log" -type f -newermt "2024-12-01" ! -newermt "2024-12-03" -delete      按照日期删除匹配的日志文件，删除前不加"-delete"参数确认要删除的文件，防止误删除</font>
+ <font style="color:rgb(1, 1, 1);">du -h --max-depth=N	递归查看当前目录及其子目录下的磁盘使用情况，并只显示前N层目录的总大小</font>
+ <font style="color:rgb(1, 1, 1);">du -ah . | sort -rh | head -n N	    查找并排序显示当前目录及其子目录下占用空间最大的前N个文件或目录</font>
+ <font style="color:rgb(1, 1, 1);">du -sh .[!.]*	检查隐藏文件和目录</font>
+ <font style="color:rgb(1, 1, 1);">du -sh /var/log/*	检查系统日志文件</font>
+ <font style="color:rgb(1, 1, 1);">du -sh /tmp/*		检查临时文件目录</font>



+ <font style="color:rgb(1, 1, 1);">ls -lSr | more 	以尺寸大小排列文件和目录</font>
+ <font style="color:rgb(1, 1, 1);">du -sh dir1 	估算目录 'dir1' 已经使用的磁盘空间'</font>
+ <font style="color:rgb(1, 1, 1);">du -sk * | sort -rn 	以容量大小为依据依次显示文件和目录的大小</font>
+ <font style="color:rgb(1, 1, 1);">rpm -q -a --qf '%10{SIZE}t%{NAME}n' | sort -k1,1n 	以大小为依据依次显示已安装的rpm包所使用的空间 (fedora, redhat类系统)</font>
+ <font style="color:rgb(1, 1, 1);">dpkg-query -W -f='Installed-Size;10t{Package}n' | sort -k1,1n 	以大小为依据显示已安装的deb包所使用的空间 (ubuntu, debian类系统)</font>

:::

---

## 七、用户和群组
:::info
+ <font style="color:rgb(1, 1, 1);">groupadd group_name 创建一个新用户组</font>
+ <font style="color:rgb(1, 1, 1);">groupdel group_name 删除一个用户组</font>
+ <font style="color:rgb(1, 1, 1);">groupmod -n new_group_name old_group_name 重命名一个用户组</font>
+ <font style="color:rgb(1, 1, 1);">useradd -c "Name Surname " -g admin -d /home/user1 -s /bin/bash user1 创建一个属于 "admin" 用户组的用户</font>
+ <font style="color:rgb(1, 1, 1);">useradd user1 创建一个新用户</font>
+ <font style="color:rgb(1, 1, 1);">userdel -r user1 删除一个用户 ( '-r' 排除主目录)</font>
+ <font style="color:rgb(1, 1, 1);">usermod -c "User FTP" -g system -d /ftp/user1 -s /bin/nologin user1 修改用户属性</font>
+ <font style="color:rgb(1, 1, 1);">passwd 修改口令</font>
+ <font style="color:rgb(1, 1, 1);">passwd user1 修改一个用户的口令 (只允许root执行)</font>
+ <font style="color:rgb(1, 1, 1);">chage -E 2005-12-31 user1 设置用户口令的失效期限</font>
+ <font style="color:rgb(1, 1, 1);">pwck 检查 '/etc/passwd' 的文件格式和语法修正以及存在的用户</font>
+ <font style="color:rgb(1, 1, 1);">grpck 检查 '/etc/passwd' 的文件格式和语法修正以及存在的群组</font>
+ <font style="color:rgb(1, 1, 1);">newgrp group_name 登陆进一个新的群组以改变新创建文件的预设群组</font>

:::

---

## 八、文件的权限 使用 “+” 设置权限，使用 “-” 用于取消
:::info
+ <font style="color:rgb(1, 1, 1);">ls -lh 显示权限</font>
+ <font style="color:rgb(1, 1, 1);">ls /tmp | pr -T5 -W$COLUMNS 将终端划分成5栏显示</font>
+ <font style="color:rgb(1, 1, 1);">chmod ugo+rwx directory1 设置目录的所有人(u)、群组(g)以及其他人(o)以读（r ）、写(w)和执行(x)的权限</font>
+ <font style="color:rgb(1, 1, 1);">chmod go-rwx directory1 删除群组(g)与其他人(o)对目录的读写执行权限</font>
+ <font style="color:rgb(1, 1, 1);">chown user1 file1 改变一个文件的所有人属性</font>
+ <font style="color:rgb(1, 1, 1);">chown -R user1 directory1 改变一个目录的所有人属性并同时改变改目录下所有文件的属性</font>
+ <font style="color:rgb(1, 1, 1);">chgrp group1 file1 改变文件的群组</font>
+ <font style="color:rgb(1, 1, 1);">chown user1:group1 file1 改变一个文件的所有人和群组属性</font>
+ <font style="color:rgb(1, 1, 1);">find / -perm -u+s 罗列一个系统中所有使用了SUID控制的文件</font>
+ <font style="color:rgb(1, 1, 1);">chmod u+s /bin/file1 设置一个二进制文件的 SUID 位 - 运行该文件的用户也被赋予和所有者同样的权限</font>
+ <font style="color:rgb(1, 1, 1);">chmod u-s /bin/file1 禁用一个二进制文件的 SUID位</font>
+ <font style="color:rgb(1, 1, 1);">chmod g+s /home/public 设置一个目录的SGID 位 - 类似SUID ，不过这是针对目录的</font>
+ <font style="color:rgb(1, 1, 1);">chmod g-s /home/public 禁用一个目录的 SGID 位</font>
+ <font style="color:rgb(1, 1, 1);">chmod o+t /home/public 设置一个文件的 STIKY 位 - 只允许合法所有人删除文件</font>
+ <font style="color:rgb(1, 1, 1);">chmod o-t /home/public 禁用一个目录的 STIKY 位</font>
+ <font style="color:rgb(1, 1, 1);">chmod +x 文件路径 为所有者、所属组和其他用户添加执行的权限</font>
+ <font style="color:rgb(1, 1, 1);">chmod -x 文件路径 为所有者、所属组和其他用户删除执行的权限</font>
+ <font style="color:rgb(1, 1, 1);">chmod u+x 文件路径 为所有者添加执行的权限</font>
+ <font style="color:rgb(1, 1, 1);">chmod g+x 文件路径 为所属组添加执行的权限</font>
+ <font style="color:rgb(1, 1, 1);">chmod o+x 文件路径 为其他用户添加执行的权限</font>
+ <font style="color:rgb(1, 1, 1);">chmod ug+x 文件路径 为所有者、所属组添加执行的权限</font>
+ <font style="color:rgb(1, 1, 1);">chmod =wx 文件路径 为所有者、所属组和其他用户添加写、执行的权限，取消读权限</font>
+ <font style="color:rgb(1, 1, 1);">chmod ug=wx 文件路径 为所有者、所属组添加写、执行的权限，取消读权限</font>

:::

---

## 九、文件的特殊属性 ，使用 “+” 设置权限，使用 “-” 用于取消
:::info
+ <font style="color:rgb(1, 1, 1);">chattr +a file1 只允许以追加方式读写文件</font>
+ <font style="color:rgb(1, 1, 1);">chattr +c file1 允许这个文件能被内核自动压缩/解压</font>
+ <font style="color:rgb(1, 1, 1);">chattr +d file1 在进行文件系统备份时，dump程序将忽略这个文件</font>
+ <font style="color:rgb(1, 1, 1);">chattr +i file1 设置成不可变的文件，不能被删除、修改、重命名或者链接</font>
+ <font style="color:rgb(1, 1, 1);">chattr +s file1 允许一个文件被安全地删除</font>
+ <font style="color:rgb(1, 1, 1);">chattr +S file1 一旦应用程序对这个文件执行了写操作，使系统立刻把修改的结果写到磁盘</font>
+ <font style="color:rgb(1, 1, 1);">chattr +u file1 若文件被删除，系统会允许你在以后恢复这个被删除的文件</font>
+ <font style="color:rgb(1, 1, 1);">lsattr 显示特殊的属性</font>

:::

---

## 十、打包和压缩文件
:::info
+ <font style="color:rgb(1, 1, 1);">bunzip2 file1.bz2 解压一个叫做 'file1.bz2'的文件</font>
+ <font style="color:rgb(1, 1, 1);">bzip2 file1 压缩一个叫做 'file1' 的文件</font>
+ <font style="color:rgb(1, 1, 1);">gunzip file1.gz 解压一个叫做 'file1.gz'的文件</font>
+ <font style="color:rgb(1, 1, 1);">gzip file1 压缩一个叫做 'file1'的文件</font>
+ <font style="color:rgb(1, 1, 1);">gzip -9 file1 最大程度压缩</font>
+ <font style="color:rgb(1, 1, 1);">rar a file1.rar test_file 创建一个叫做 'file1.rar' 的包</font>
+ <font style="color:rgb(1, 1, 1);">rar a file1.rar file1 file2 dir1 同时压缩 'file1', 'file2' 以及目录 'dir1'</font>
+ <font style="color:rgb(1, 1, 1);">rar x file1.rar 解压rar包</font>
+ <font style="color:rgb(1, 1, 1);">unrar x file1.rar 解压rar包</font>
+ <font style="color:rgb(1, 1, 1);">tar -cvf archive.tar file1 创建一个非压缩的 tarball</font>
+ <font style="color:rgb(1, 1, 1);">tar -cvf archive.tar file1 file2 dir1 创建一个包含了 'file1', 'file2' 以及 'dir1'的档案文件</font>
+ <font style="color:rgb(1, 1, 1);">tar -tf archive.tar 显示一个包中的内容</font>
+ <font style="color:rgb(1, 1, 1);">tar -xvf archive.tar 释放一个包</font>
+ <font style="color:rgb(1, 1, 1);">tar -xvf archive.tar -C /tmp 将压缩包释放到 /tmp目录下</font>
+ <font style="color:rgb(1, 1, 1);">tar -cvfj archive.tar.bz2 dir1 创建一个bzip2格式的压缩包</font>
+ <font style="color:rgb(1, 1, 1);">tar -xvfj archive.tar.bz2 解压一个bzip2格式的压缩包</font>
+ <font style="color:rgb(1, 1, 1);">tar -cvfz archive.tar.gz dir1 创建一个gzip格式的压缩包</font>
+ <font style="color:rgb(1, 1, 1);">tar -xvfz archive.tar.gz 解压一个gzip格式的压缩包</font>
+ <font style="color:rgb(1, 1, 1);">zip file1.zip file1 创建一个zip格式的压缩包</font>
+ <font style="color:rgb(1, 1, 1);">zip -r file1.zip file1 file2 dir1 将几个文件和目录同时压缩成一个zip格式的压缩包</font>
+ <font style="color:rgb(1, 1, 1);">unzip file1.zip 解压一个zip格式压缩包</font>

:::

---

## 十一、RPM 包
:::info
+ <font style="color:rgb(1, 1, 1);">rpm -ivh package.rpm 安装一个rpm包</font>
+ <font style="color:rgb(1, 1, 1);">rpm -ivh --nodeeps package.rpm 安装一个rpm包而忽略依赖关系警告</font>
+ <font style="color:rgb(1, 1, 1);">rpm -U package.rpm 更新一个rpm包但不改变其配置文件</font>
+ <font style="color:rgb(1, 1, 1);">rpm -F package.rpm 更新一个确定已经安装的rpm包</font>
+ <font style="color:rgb(1, 1, 1);">rpm -e package_name.rpm 删除一个rpm包</font>
+ <font style="color:rgb(1, 1, 1);">rpm -qa 显示系统中所有已经安装的rpm包</font>
+ <font style="color:rgb(1, 1, 1);">rpm -qa | grep httpd 显示所有名称中包含 "httpd" 字样的rpm包</font>
+ <font style="color:rgb(1, 1, 1);">rpm -qi package_name 获取一个已安装包的特殊信息</font>
+ <font style="color:rgb(1, 1, 1);">rpm -qg "System Environment/Daemons" 显示一个组件的rpm包</font>
+ <font style="color:rgb(1, 1, 1);">rpm -ql package_name 显示一个已经安装的rpm包提供的文件列表</font>
+ <font style="color:rgb(1, 1, 1);">rpm -qc package_name 显示一个已经安装的rpm包提供的配置文件列表</font>
+ <font style="color:rgb(1, 1, 1);">rpm -q package_name --whatrequires 显示与一个rpm包存在依赖关系的列表</font>
+ <font style="color:rgb(1, 1, 1);">rpm -q package_name --whatprovides 显示一个rpm包所占的体积</font>
+ <font style="color:rgb(1, 1, 1);">rpm -q package_name --scripts 显示在安装/删除期间所执行的脚本l</font>
+ <font style="color:rgb(1, 1, 1);">rpm -q package_name --changelog 显示一个rpm包的修改历史</font>
+ <font style="color:rgb(1, 1, 1);">rpm -qf /etc/httpd/conf/httpd.conf 确认所给的文件由哪个rpm包所提供</font>
+ <font style="color:rgb(1, 1, 1);">rpm -qp package.rpm -l 显示由一个尚未安装的rpm包提供的文件列表</font>
+ <font style="color:rgb(1, 1, 1);">rpm --import /media/cdrom/RPM-GPG-KEY 导入公钥数字证书</font>
+ <font style="color:rgb(1, 1, 1);">rpm --checksig package.rpm 确认一个rpm包的完整性</font>
+ <font style="color:rgb(1, 1, 1);">rpm -qa gpg-pubkey 确认已安装的所有rpm包的完整性</font>
+ <font style="color:rgb(1, 1, 1);">rpm -V package_name 检查文件尺寸、 许可、类型、所有者、群组、MD5检查以及最后修改时间</font>
+ <font style="color:rgb(1, 1, 1);">rpm -Va 检查系统中所有已安装的rpm包- 小心使用</font>
+ <font style="color:rgb(1, 1, 1);">rpm -Vp package.rpm 确认一个rpm包还未安装</font>
+ <font style="color:rgb(1, 1, 1);">rpm2cpio package.rpm | cpio --extract --make-directories</font><font style="color:rgb(1, 1, 1);"> </font>_<font style="color:rgb(145, 109, 213);">bin</font>_<font style="color:rgb(1, 1, 1);"> </font><font style="color:rgb(1, 1, 1);">从一个rpm包运行可执行文件</font>
+ <font style="color:rgb(1, 1, 1);">rpm -ivh /usr/src/redhat/RPMS/</font>`<font style="color:rgb(1, 1, 1);">arch</font>`<font style="color:rgb(1, 1, 1);">/package.rpm 从一个rpm源码安装一个构建好的包</font>
+ <font style="color:rgb(1, 1, 1);">rpmbuild --rebuild package_name.src.rpm 从一个rpm源码构建一个 rpm 包</font>

:::

---

## 十二、YUM 软件包升级器
:::info
+ <font style="color:rgb(1, 1, 1);">yum install package_name 下载并安装一个rpm包</font>
+ <font style="color:rgb(1, 1, 1);">yum localinstall package_name.rpm 将安装一个rpm包，使用你自己的软件仓库为你解决所有依赖关系</font>
+ <font style="color:rgb(1, 1, 1);">yum update package_name.rpm 更新当前系统中所有安装的rpm包</font>
+ <font style="color:rgb(1, 1, 1);">yum update package_name 更新一个rpm包</font>
+ <font style="color:rgb(1, 1, 1);">yum remove package_name 删除一个rpm包</font>
+ <font style="color:rgb(1, 1, 1);">yum list 列出当前系统中安装的所有包</font>
+ <font style="color:rgb(1, 1, 1);">yum search package_name 在rpm仓库中搜寻软件包</font>
+ <font style="color:rgb(1, 1, 1);">yum clean packages 清理rpm缓存删除下载的包</font>
+ <font style="color:rgb(1, 1, 1);">yum clean headers 删除所有头文件</font>
+ <font style="color:rgb(1, 1, 1);">yum clean all 删除所有缓存的包和头文件</font>

:::

---

## 十三、deb 包
:::info
+ <font style="color:rgb(1, 1, 1);">dpkg -i package.deb 安装/更新一个 deb 包</font>
+ <font style="color:rgb(1, 1, 1);">dpkg -r package_name 从系统删除一个 deb 包</font>
+ <font style="color:rgb(1, 1, 1);">dpkg -l 显示系统中所有已经安装的 deb 包</font>
+ <font style="color:rgb(1, 1, 1);">dpkg -l | grep httpd 显示所有名称中包含 "httpd" 字样的deb包</font>
+ <font style="color:rgb(1, 1, 1);">dpkg -s package_name 获得已经安装在系统中一个特殊包的信息</font>
+ <font style="color:rgb(1, 1, 1);">dpkg -L package_name 显示系统中已经安装的一个deb包所提供的文件列表</font>
+ <font style="color:rgb(1, 1, 1);">dpkg --contents package.deb 显示尚未安装的一个包所提供的文件列表</font>
+ <font style="color:rgb(1, 1, 1);">dpkg -S /bin/ping 确认所给的文件由哪个deb包提供</font>
+ <font style="color:rgb(1, 1, 1);">APT 软件工具 (Debian, Ubuntu 以及类似系统)</font>
+ <font style="color:rgb(1, 1, 1);">apt-get install package_name 安装/更新一个 deb 包</font>
+ <font style="color:rgb(1, 1, 1);">apt-cdrom install package_name 从光盘安装/更新一个 deb 包</font>
+ <font style="color:rgb(1, 1, 1);">apt-get update 升级列表中的软件包</font>
+ <font style="color:rgb(1, 1, 1);">apt-get upgrade 升级所有已安装的软件</font>
+ <font style="color:rgb(1, 1, 1);">apt-get remove package_name 从系统删除一个deb包</font>
+ <font style="color:rgb(1, 1, 1);">apt-get check 确认依赖的软件仓库正确</font>
+ <font style="color:rgb(1, 1, 1);">apt-get clean 从下载的软件包中清理缓存</font>
+ <font style="color:rgb(1, 1, 1);">apt-cache search searched-package 返回包含所要搜索字符串的软件包名称</font>

:::

---

## 十四、查看文件内容
:::info
+ <font style="color:rgb(1, 1, 1);">cat file1 从第一个字节开始正向查看文件的内容</font>
+ <font style="color:rgb(1, 1, 1);">tac file1 从最后一行开始反向查看一个文件的内容</font>
+ <font style="color:rgb(1, 1, 1);">more file1 查看一个长文件的内容</font>
+ <font style="color:rgb(1, 1, 1);">less file1 类似于 'more' 命令，但是它允许在文件中和正向操作一样的反向操作</font>
+ <font style="color:rgb(1, 1, 1);">head -2 file1 查看一个文件的前两行</font>
+ <font style="color:rgb(1, 1, 1);">tail -2 file1 查看一个文件的最后两行</font>
+ <font style="color:rgb(1, 1, 1);">tail -f /var/log/messages 实时查看被添加到一个文件中的内容</font>

:::

---

## 十五、文本处理
:::info
+ <font style="color:rgb(1, 1, 1);">cat file1 file2 ... | command <> file1_in.txt_or_file1_out.txt general syntax for text manipulation using PIPE, STDIN and STDOUT</font>
+ <font style="color:rgb(1, 1, 1);">cat file1 | command( sed, grep, awk, grep, etc...) > result.txt 合并一个文件的详细说明文本，并将简介写入一个新文件中</font>
+ <font style="color:rgb(1, 1, 1);">cat file1 | command( sed, grep, awk, grep, etc...) >> result.txt 合并一个文件的详细说明文本，并将简介写入一个已有的文件中</font>
+ <font style="color:rgb(1, 1, 1);">grep Aug /var/log/messages 在文件 '/var/log/messages'中查找关键词"Aug"</font>
+ <font style="color:rgb(1, 1, 1);">grep ^Aug /var/log/messages 在文件 '/var/log/messages'中查找以"Aug"开始的词汇</font>
+ <font style="color:rgb(1, 1, 1);">grep [0-9] /var/log/messages 选择 '/var/log/messages' 文件中所有包含数字的行</font>
+ <font style="color:rgb(1, 1, 1);">grep Aug -R /var/log/* 在目录 '/var/log' 及随后的目录中搜索字符串"Aug"</font>
+ <font style="color:rgb(1, 1, 1);">sed 's/stringa1/stringa2/g' example.txt 将example.txt文件中的 "string1" 替换成 "string2"</font>
+ <font style="color:rgb(1, 1, 1);">sed '/^$/d' example.txt 从example.txt文件中删除所有空白行</font>
+ <font style="color:rgb(1, 1, 1);">sed '/ *#/d; /^$/d' example.txt 从example.txt文件中删除所有注释和空白行</font>
+ <font style="color:rgb(1, 1, 1);">echo 'esempio' | tr '[:lower:]' '[:upper:]' 合并上下单元格内容</font>
+ <font style="color:rgb(1, 1, 1);">sed -e '1d' result.txt 从文件example.txt 中排除第一行</font>
+ <font style="color:rgb(1, 1, 1);">sed -n '/stringa1/p' 查看只包含词汇 "string1"的行</font>
+ <font style="color:rgb(1, 1, 1);">sed -e 's/ *$//' example.txt 删除每一行最后的空白字符</font>
+ <font style="color:rgb(1, 1, 1);">sed -e 's/stringa1//g' example.txt 从文档中只删除词汇 "string1" 并保留剩余全部</font>
+ <font style="color:rgb(1, 1, 1);">sed -n '1,5p;5q' example.txt 查看从第一行到第5行内容</font>
+ <font style="color:rgb(1, 1, 1);">sed -n '5p;5q' example.txt 查看第5行</font>
+ <font style="color:rgb(1, 1, 1);">sed -e 's/00*/0/g' example.txt 用单个零替换多个零</font>
+ <font style="color:rgb(1, 1, 1);">cat -n file1 标示文件的行数</font>
+ <font style="color:rgb(1, 1, 1);">cat example.txt | awk 'NR%2==1' 删除example.txt文件中的所有偶数行</font>
+ <font style="color:rgb(1, 1, 1);">echo a b c | awk '{print $1}' 查看一行第一栏</font>
+ <font style="color:rgb(1, 1, 1);">echo a b c | awk '{print 1,3}' 查看一行的第一和第三栏</font>
+ <font style="color:rgb(1, 1, 1);">paste file1 file2 合并两个文件或两栏的内容</font>
+ <font style="color:rgb(1, 1, 1);">paste -d '+' file1 file2 合并两个文件或两栏的内容，中间用"+"区分</font>
+ <font style="color:rgb(1, 1, 1);">sort file1 file2 排序两个文件的内容</font>
+ <font style="color:rgb(1, 1, 1);">sort file1 file2 | uniq 取出两个文件的并集(重复的行只保留一份)</font>
+ <font style="color:rgb(1, 1, 1);">sort file1 file2 | uniq -u 删除交集，留下其他的行</font>
+ <font style="color:rgb(1, 1, 1);">sort file1 file2 | uniq -d 取出两个文件的交集(只留下同时存在于两个文件中的文件)</font>
+ <font style="color:rgb(1, 1, 1);">comm -1 file1 file2 比较两个文件的内容只删除 'file1' 所包含的内容</font>
+ <font style="color:rgb(1, 1, 1);">comm -2 file1 file2 比较两个文件的内容只删除 'file2' 所包含的内容</font>
+ <font style="color:rgb(1, 1, 1);">comm -3 file1 file2 比较两个文件的内容只删除两个文件共有的部分</font>

:::

---

## 十六、字符设置和文件格式转换
:::info
+ <font style="color:rgb(1, 1, 1);">dos2unix filedos.txt fileunix.txt 将一个文本文件的格式从MSDOS转换成UNIX</font>
+ <font style="color:rgb(1, 1, 1);">unix2dos fileunix.txt filedos.txt 将一个文本文件的格式从UNIX转换成MSDOS</font>
+ <font style="color:rgb(1, 1, 1);">recode ..HTML < page.txt > page.html 将一个文本文件转换成html</font>
+ <font style="color:rgb(1, 1, 1);">recode -l | more 显示所有允许的转换格式</font>

:::

---

## 十七、文件系统分析
:::info
+ <font style="color:rgb(1, 1, 1);">badblocks -v /dev/hda1 检查磁盘hda1上的坏磁块</font>
+ <font style="color:rgb(1, 1, 1);">fsck /dev/hda1 修复/检查hda1磁盘上linux文件系统的完整性</font>
+ <font style="color:rgb(1, 1, 1);">fsck.ext2 /dev/hda1 修复/检查hda1磁盘上ext2文件系统的完整性</font>
+ <font style="color:rgb(1, 1, 1);">e2fsck /dev/hda1 修复/检查hda1磁盘上ext2文件系统的完整性</font>
+ <font style="color:rgb(1, 1, 1);">e2fsck -j /dev/hda1 修复/检查hda1磁盘上ext3文件系统的完整性</font>
+ <font style="color:rgb(1, 1, 1);">fsck.ext3 /dev/hda1 修复/检查hda1磁盘上ext3文件系统的完整性</font>
+ <font style="color:rgb(1, 1, 1);">fsck.vfat /dev/hda1 修复/检查hda1磁盘上fat文件系统的完整性</font>
+ <font style="color:rgb(1, 1, 1);">fsck.msdos /dev/hda1 修复/检查hda1磁盘上dos文件系统的完整性</font>
+ <font style="color:rgb(1, 1, 1);">dosfsck /dev/hda1 修复/检查hda1磁盘上dos文件系统的完整性</font>

:::

---

## 十八、初始化一个文件系统
:::info
+ <font style="color:rgb(1, 1, 1);">mkfs /dev/hda1 在hda1分区创建一个文件系统</font>
+ <font style="color:rgb(1, 1, 1);">mke2fs /dev/hda1 在hda1分区创建一个linux ext2的文件系统</font>
+ <font style="color:rgb(1, 1, 1);">mke2fs -j /dev/hda1 在hda1分区创建一个linux ext3(日志型)的文件系统</font>
+ <font style="color:rgb(1, 1, 1);">mkfs -t vfat 32 -F /dev/hda1 创建一个 FAT32 文件系统</font>
+ <font style="color:rgb(1, 1, 1);">fdformat -n /dev/fd0 格式化一个软盘</font>
+ <font style="color:rgb(1, 1, 1);">mkswap /dev/hda3 创建一个swap文件系统</font>

:::

---

## 十九、SWAP 文件系统
:::info
+ <font style="color:rgb(1, 1, 1);">mkswap /dev/hda3 创建一个swap文件系统</font>
+ <font style="color:rgb(1, 1, 1);">swapon /dev/hda3 启用一个新的swap文件系统</font>
+ <font style="color:rgb(1, 1, 1);">swapon /dev/hda2 /dev/hdb3 启用两个swap分区</font>

:::

---

## 二十、备份
:::info
+ <font style="color:rgb(1, 1, 1);">dump -0aj -f /tmp/home0.bak /home 制作一个 '/home' 目录的完整备份</font>
+ <font style="color:rgb(1, 1, 1);">dump -1aj -f /tmp/home0.bak /home 制作一个 '/home' 目录的交互式备份</font>
+ <font style="color:rgb(1, 1, 1);">restore -if /tmp/home0.bak 还原一个交互式备份</font>
+ <font style="color:rgb(1, 1, 1);">rsync -rogpav --delete /home /tmp 同步两边的目录</font>
+ <font style="color:rgb(1, 1, 1);">rsync -rogpav -e ssh --delete /home ip_address:/tmp 通过SSH通道rsync</font>
+ <font style="color:rgb(1, 1, 1);">rsync -az -e ssh --delete ip_addr:/home/public /home/local 通过ssh和压缩将一个远程目录同步到本地目录</font>
+ <font style="color:rgb(1, 1, 1);">rsync -az -e ssh --delete /home/local ip_addr:/home/public 通过ssh和压缩将本地目录同步到远程目录</font>
+ <font style="color:rgb(1, 1, 1);">dd bs=1M if=/dev/hda | gzip | ssh user@ip_addr 'dd of=hda.gz' 通过ssh在远程主机上执行一次备份本地磁盘的操作</font>
+ <font style="color:rgb(1, 1, 1);">dd if=/dev/sda of=/tmp/file1 备份磁盘内容到一个文件</font>
+ <font style="color:rgb(1, 1, 1);">tar -Puf backup.tar /home/user 执行一次对 '/home/user' 目录的交互式备份操作</font>
+ <font style="color:rgb(1, 1, 1);">( cd /tmp/local/ && tar c . ) | ssh -C user@ip_addr 'cd /home/share/ && tar x -p' 通过ssh在远程目录中复制一个目录内容</font>
+ <font style="color:rgb(1, 1, 1);">( tar c /home ) | ssh -C user@ip_addr 'cd /home/backup-home && tar x -p' 通过ssh在远程目录中复制一个本地目录</font>
+ <font style="color:rgb(1, 1, 1);">tar cf - . | (cd /tmp/backup ; tar xf - ) 本地将一个目录复制到另一个地方，保留原有权限及链接</font>
+ <font style="color:rgb(1, 1, 1);">find /home/user1 -name '*.txt' | xargs cp -av --target-directory=/home/backup/ --parents 从一个目录查找并复制所有以 '.txt' 结尾的文件到另一个目录</font>
+ <font style="color:rgb(1, 1, 1);">find /var/log -name '*.log' | tar cv --files-from=- | bzip2 > log.tar.bz2 查找所有以 '.log' 结尾的文件并做成一个bzip包</font>
+ <font style="color:rgb(1, 1, 1);">dd if=/dev/hda of=/dev/fd0 bs=512 count=1 做一个将 MBR (</font>Master Boot Record<font style="color:rgb(1, 1, 1);">)内容复制到软盘的动作</font>
+ <font style="color:rgb(1, 1, 1);">dd if=/dev/fd0 of=/dev/hda bs=512 count=1 从已经保存到软盘的备份中恢复MBR内容</font>

:::

---

## 二十一、光盘
:::info
+ <font style="color:rgb(1, 1, 1);">cdrecord -v gracetime=2 dev=/dev/cdrom -eject blank=fast -force 清空一个可复写的光盘内容</font>
+ <font style="color:rgb(1, 1, 1);">mkisofs /dev/cdrom > cd.iso 在磁盘上创建一个光盘的iso镜像文件</font>
+ <font style="color:rgb(1, 1, 1);">mkisofs /dev/cdrom | gzip > cd_iso.gz 在磁盘上创建一个压缩了的光盘iso镜像文件</font>
+ <font style="color:rgb(1, 1, 1);">mkisofs -J -allow-leading-dots -R -V "Label CD" -iso-level 4 -o ./cd.iso data_cd 创建一个目录的iso镜像文件</font>
+ <font style="color:rgb(1, 1, 1);">cdrecord -v dev=/dev/cdrom cd.iso 刻录一个ISO镜像文件</font>
+ <font style="color:rgb(1, 1, 1);">gzip -dc cd_iso.gz | cdrecord dev=/dev/cdrom - 刻录一个压缩了的ISO镜像文件</font>
+ <font style="color:rgb(1, 1, 1);">mount -o loop cd.iso /mnt/iso 挂载一个ISO镜像文件</font>
+ <font style="color:rgb(1, 1, 1);">cd-paranoia -B 从一个CD光盘转录音轨到 wav 文件中</font>
+ <font style="color:rgb(1, 1, 1);">cd-paranoia -- "-3" 从一个CD光盘转录音轨到 wav 文件中（参数-3）</font>
+ <font style="color:rgb(1, 1, 1);">cdrecord --scanbus 扫描总线以识别scsi通道</font>
+ <font style="color:rgb(1, 1, 1);">dd if=/dev/hdc | md5sum 校验一个设备的md5sum编码，例如一张 CD</font>

:::

---

## 二十二、网络（以太网和 WIFI 无线）
:::info
+ <font style="color:rgb(1, 1, 1);">ifconfig eth0 显示一个以太网卡的配置</font>
+ <font style="color:rgb(1, 1, 1);">ifup eth0 启用一个 'eth0' 网络设备</font>
+ <font style="color:rgb(1, 1, 1);">ifdown eth0 禁用一个 'eth0' 网络设备</font>
+ <font style="color:rgb(1, 1, 1);">ifconfig eth0 192.168.1.1 netmask 255.255.255.0 控制IP地址</font>
+ <font style="color:rgb(1, 1, 1);">ifconfig eth0 promisc 设置 'eth0' 成混杂模式以嗅探数据包 (sniffing)</font>
+ <font style="color:rgb(1, 1, 1);">dhclient eth0 以dhcp模式启用 'eth0'</font>
+ <font style="color:rgb(1, 1, 1);">route -n show routing table</font>
+ <font style="color:rgb(1, 1, 1);">route add -net 0/0 gw IP_Gateway configura default gateway</font>
+ <font style="color:rgb(1, 1, 1);">route add -net 192.168.0.0 netmask 255.255.0.0 gw 192.168.1.1 configure static route to reach network '192.168.0.0/16'</font>
+ <font style="color:rgb(1, 1, 1);">route del 0/0 gw IP_gateway remove static route</font>
+ <font style="color:rgb(1, 1, 1);">echo "1" > /proc/sys/net/ipv4/ip_forward activate ip routing</font>
+ <font style="color:rgb(1, 1, 1);">hostname show hostname of system</font>
+ <font style="color:rgb(1, 1, 1);">host www.example.com lookup hostname to resolve name to ip address and viceversa(1)</font>
+ <font style="color:rgb(1, 1, 1);">nslookup www.example.com lookup hostname to resolve name to ip address and viceversa(2)</font>
+ <font style="color:rgb(1, 1, 1);">ip link show show link status of all interfaces</font>
+ <font style="color:rgb(1, 1, 1);">mii-tool eth0 show link status of 'eth0'</font>
+ <font style="color:rgb(1, 1, 1);">ethtool eth0 show statistics of network card 'eth0'</font>
+ <font style="color:rgb(1, 1, 1);">netstat -tup show all active network connections and their PID</font>
+ <font style="color:rgb(1, 1, 1);">netstat -tupl show all network services listening on the system and their PID</font>
+ <font style="color:rgb(1, 1, 1);">tcpdump tcp port 80 show all HTTP traffic</font>
+ <font style="color:rgb(1, 1, 1);">iwlist scan show wireless networks</font>
+ <font style="color:rgb(1, 1, 1);">iwconfig eth1 show configuration of a wireless network card</font>
+ <font style="color:rgb(1, 1, 1);">hostname show hostname</font>
+ <font style="color:rgb(1, 1, 1);">host www.example.com lookup hostname to resolve name to ip address and viceversa</font>
+ <font style="color:rgb(1, 1, 1);">nslookup www.example.com lookup hostname to resolve name to ip address and viceversa</font>
+ <font style="color:rgb(1, 1, 1);">whois www.example.com lookup on Whois database</font>

:::

---

## 二十三、列出目录内容
:::info
+ <font style="color:rgb(1, 1, 1);">ls -a：显示所有文件（包括隐藏文件）；</font>
+ <font style="color:rgb(1, 1, 1);">ls -l：显示详细信息；</font>
+ <font style="color:rgb(1, 1, 1);">ls -R：递归显示子目录结构；</font>
+ <font style="color:rgb(1, 1, 1);">ls -ld：显示目录和链接信息；</font>
+ <font style="color:rgb(1, 1, 1);">ctrl+r：历史记录中所搜命令（输入命令中的任意一个字符）；</font>
+ <font style="color:rgb(1, 1, 1);">Linux中以.开头的文件是隐藏文件；</font>
+ <font style="color:rgb(1, 1, 1);">pwd:显示当前目录</font>

:::

---

## 二十四、查看文件的类型
:::info
+ <font style="color:rgb(1, 1, 1);">file:查看文件的类型</font>

:::

---

## 二十五、文件目录其他命令
:::info
<font style="color:rgb(0, 0, 0);">cp：复制文件和目录 cp 源文件（文件夹）目标文件（文件夹）</font>

+ <font style="color:rgb(1, 1, 1);">常用参数：</font>
    - <font style="color:rgb(1, 1, 1);">-r: 递归复制整个目录树；</font>
    - <font style="color:rgb(1, 1, 1);">-v：显示详细信息；</font>
+ <font style="color:rgb(1, 1, 1);">复制文件夹时要在 cp 命令后面加一个-r 参数：</font>
+ <font style="color:rgb(1, 1, 1);">如：cp -r 源文件夹 目标文件夹</font>

<font style="color:rgb(0, 0, 0);"></font>

<font style="color:rgb(0, 0, 0);">touch+文件名：当文件不存在的时候，创建相应的文件；当文件存在的时候，修改文件的创建时间。</font>

+ <font style="color:rgb(1, 1, 1);">功能：生成一个空文件或修改文件的存取/修改的时间记录值。</font>
    - <font style="color:rgb(1, 1, 1);">touch * ：将当前下的文件时间修改为系统的当前时间</font>
    - <font style="color:rgb(1, 1, 1);">touch –d 20040210 test：将 test 文件的日期改为 20040210</font>
    - <font style="color:rgb(1, 1, 1);">touch abc  ：若 abc 文件存在，则修改为系统的当前时间；若不存在，则生成一个为当前时间的空文件</font>

<font style="color:rgb(0, 0, 0);"></font>

<font style="color:rgb(0, 0, 0);">mv 文件 目标目录：移动或重命名文件或目录（如果指定文件名，则可以重命名文件）。可以将文件及目录移到另一目录下，或更改文件及目录的名称。</font>

+ <font style="color:rgb(1, 1, 1);">格式为：mv [参数] <源文件或目录> <目标文件或目录></font>
    - <font style="color:rgb(1, 1, 1);">mv a.txt ../ ：将 a.txt 文件移动上层目录</font>
    - <font style="color:rgb(1, 1, 1);">mv a.txt b.txt ：将 a.txt 改名为 b.txt</font>
    - <font style="color:rgb(1, 1, 1);">mv dir2 ../ ：将 dir2 目录上移一层</font>

<font style="color:rgb(0, 0, 0);"></font>

<font style="color:rgb(0, 0, 0);">rm：删除文件；</font>

+ <font style="color:rgb(1, 1, 1);">常用参数：</font>
    - <font style="color:rgb(1, 1, 1);">-i：交互式 </font>
    - <font style="color:rgb(1, 1, 1);">-r：递归的删除包括目录中的所有内容</font>

<font style="color:rgb(0, 0, 0);"></font>

<font style="color:rgb(0, 0, 0);">mkdir + 文件夹名称：创建文件夹；</font>

<font style="color:rgb(0, 0, 0);">rm -r + 文件夹名称：删除文件夹（空文件夹和非空文件夹都可删除）</font>

<font style="color:rgb(0, 0, 0);">rmdir 文件夹名称：删除文件夹（只能删除空文件夹）</font>

<font style="color:rgb(0, 0, 0);">mkdir -p dir1/dir2：在当前目录下创建 dir1 目录，并在 dir1 目录下创建 dir2 目录， 也就是连续创建两个目录（dir1/和 dir1/dir2）</font>

<font style="color:rgb(0, 0, 0);"></font>

<font style="color:rgb(0, 0, 0);">rmdir –p dir1/dir2：删除 dir1 下的 dir2 目录，若 dir1 目录为空也删除它</font>

+ <font style="color:rgb(1, 1, 1);">rm *：删除当前目录下的所有文件</font>
+ <font style="color:rgb(1, 1, 1);">-f 参数：强迫删除文件 rm –f *.txt：强迫删除所有以后缀名为 txt 文件</font>
+ <font style="color:rgb(1, 1, 1);">-i 参数：删除文件时询问</font>
+ <font style="color:rgb(1, 1, 1);">rm –i * ：删除当前目录下的所有文件会有如下提示：</font>
+ <font style="color:rgb(1, 1, 1);">rm:backup:is a directory 遇到目录会略过</font>
+ <font style="color:rgb(1, 1, 1);">rm: remove ‘myfiles.txt’ ? Y</font>
+ <font style="color:rgb(1, 1, 1);">删除文件时会询问,可按 Y 或 N 键表示允许或拒绝删除文件</font>
+ <font style="color:rgb(1, 1, 1);">-r 参数：递归删除（连子目录一同删除，这是一个相当常用的参数）</font>
+ <font style="color:rgb(1, 1, 1);">rm -r test ：删除 test 目录（含 test 目录下所有文件和子目录）</font>
+ <font style="color:rgb(1, 1, 1);">rm -r *：删除所有文件（含当前目录所有文件、所有子目录和子目录下的文件） 一般在删除目录时 r 和 f 一起用，避免麻烦</font>
+ <font style="color:rgb(1, 1, 1);">rm -rf test ：强行删除、不加询问</font>

<font style="color:rgb(1, 1, 1);"></font>

<font style="color:rgb(0, 0, 0);">grep：功能：在文件中搜索匹配的字符并进行输出</font>

+ <font style="color:rgb(1, 1, 1);">格式：grep[参数] <要找的字串> <要寻找字 串的源文件></font>

<font style="color:rgb(0, 0, 0);"></font>

<font style="color:rgb(0, 0, 0);">grep linux test.txt ：搜索 test.txt 文件中字符串 linux 并输出</font>

<font style="color:rgb(0, 0, 0);"></font>

<font style="color:rgb(0, 0, 0);">ln 命令</font>

+ <font style="color:rgb(1, 1, 1);">功能：在文件和目录之间建立链接</font>
+ <font style="color:rgb(1, 1, 1);">格式：ln [参数] <源文件或目录> <目标文件或目录></font>

<font style="color:rgb(0, 0, 0);"></font>

<font style="color:rgb(0, 0, 0);">链接分“软链接”和“硬链接”</font>

1. <font style="color:rgb(1, 1, 1);">软链接:</font>
    1. <font style="color:rgb(1, 1, 1);">ln–s /usr/share/do doc ：创建一个链接文件 doc,并指向目录/usr/share/do</font>
2. <font style="color:rgb(1, 1, 1);">硬链接:</font>
    1. <font style="color:rgb(1, 1, 1);">ln /usr/share/test hard：创建一个硬链接文件 hard，这时对于 test 文件对应 的存储区域来说，又多了一个文件指向它</font>

<font style="color:rgb(0, 0, 0);"></font>

:::

---

## 二十六、系统常用命令
### 显示命令
:::info
+ <font style="color:rgb(1, 1, 1);">date : 查看或设置当前系统的时间：格式化显示时间：+%Y--%m--%d；</font>
+ <font style="color:rgb(1, 1, 1);">date -s : 设置当前系统的时间</font>
+ <font style="color:rgb(1, 1, 1);">hwclock(clock)：显示硬件时钟时间(需要管理员权限)；</font>
+ <font style="color:rgb(1, 1, 1);">cal：查看日历</font>
    - <font style="color:rgb(1, 1, 1);">格式 cal [参数] 月年</font>
+ <font style="color:rgb(1, 1, 1);">cal：显示当月的日历 cal4 2004 ：显示 2004 年 4 月的日历</font>
+ <font style="color:rgb(1, 1, 1);">cal- y 2003：显示 2003 年的日历</font>
+ <font style="color:rgb(1, 1, 1);">uptime：查看系统运行时间</font>

:::

### 输出查看命令
:::info
+ <font style="color:rgb(1, 1, 1);">echo：显示输入的内容 追加文件 echo "liuyazhuang" >> liuyazhuang.txt</font>
+ <font style="color:rgb(1, 1, 1);">cat：显示文件内容,也可以将数个文件合并成一个文件。</font>
+ <font style="color:rgb(1, 1, 1);">格式：格式：cat[参数]<文件名></font>
+ <font style="color:rgb(1, 1, 1);">cat test.txt：显示 test.txt 文件内容</font>
+ <font style="color:rgb(1, 1, 1);">cat test.txt | more ：逐页显示 test.txt 文件中的内容</font>
+ <font style="color:rgb(1, 1, 1);">cat test.txt >> test1.txt ：将 test.txt 的内容附加到 test1.txt 文件之后</font>
+ <font style="color:rgb(1, 1, 1);">cat test.txt test2.txt > readme.txt : 将 test.txt 和 test2.txt 文件合并成 readme.txt 文件</font>
+ <font style="color:rgb(1, 1, 1);">head : 显示文件的头几行（默认 10 行） -n：指定显示的行数格式：head -n 文件名</font>
+ <font style="color:rgb(1, 1, 1);">tail：显示文件的末尾几行（默认 10 行）</font>
    - <font style="color:rgb(1, 1, 1);">-n：指定显示的行数 </font>
    - <font style="color:rgb(1, 1, 1);">-f：追踪显示文件更新 （一般用于查看日志，命令不会退出，而是持续显示新加入的内容）</font>
+ <font style="color:rgb(1, 1, 1);">格式：tail [参数] <文件名></font>
+ <font style="color:rgb(1, 1, 1);">tail-10 /etc/passwd ：显示/etc/passwd/文件的倒数 10 行内容</font>
+ <font style="color:rgb(1, 1, 1);">tail+10 /etc/passwd ：显示/etc/passwd/文件从第 10 行开始到末尾的内容</font>
+ <font style="color:rgb(1, 1, 1);">more：用于翻页显示文件内容（只能向下翻页）</font>
+ <font style="color:rgb(1, 1, 1);">more 命令是一般用于要显示的内容会超过一个画面长度的情况。为了避免画 面显示时瞬间就闪过去，用户可以使用 more 命令，让画面在显示满一页时暂停，此时可按空格键继续显示下一个画面，或按 Q 键停止显示。</font>
+ <font style="color:rgb(1, 1, 1);">ls -al |more：以长格形式显示 etc 目录下的文件列表，显示满一个画面便暂停，可 按空格键继续显示下一画面，或按 Q 键跳离</font>
+ <font style="color:rgb(1, 1, 1);">less：翻页显示文件内容（带上下翻页）按下上键分页，按 q 退出、</font>
+ <font style="color:rgb(1, 1, 1);">less 命令的用法与 more 命令类似，也可以用来浏览超过一页的文件。所不同 的是 less 命令除了可以按空格键向下显示文件外，还可以利用上下键来卷动文件。当要结束浏览时，只要在 less 命令的提示符“：”下按 Q 键即可。</font>
+ <font style="color:rgb(1, 1, 1);">ls -al | less：以长格形式列出/etc 目录中所有的内容。用户可按上下键浏览或按 Q 键跳离</font>

:::

### 查看硬件信息
:::info
+ <font style="color:rgb(1, 1, 1);">Ispci：查看 PCI 设备 -v：查看详细信息</font>
+ <font style="color:rgb(1, 1, 1);">Isusb：查看 USB 设备 -v：查看详细信息</font>
+ <font style="color:rgb(1, 1, 1);">Ismod：查看加载的模块(驱动)</font>

:::

### 关机、重启
:::info
+ <font style="color:rgb(1, 1, 1);">shutdown 关闭、重启计算机</font>
+ <font style="color:rgb(1, 1, 1);">shutdown [关机、重启] 时间 </font>
    - <font style="color:rgb(1, 1, 1);">-h 关闭计算机 </font>
    - <font style="color:rgb(1, 1, 1);">-r 重启计算机</font>
+ <font style="color:rgb(1, 1, 1);">如：立即关机：shutdown -h now</font>
+ <font style="color:rgb(1, 1, 1);">10 分钟后关机：shutdown -h +10</font>
+ <font style="color:rgb(1, 1, 1);">23:30 分关机：shutdown -h 23:30</font>
+ <font style="color:rgb(1, 1, 1);">立即重启：shutdown -r now</font>
+ <font style="color:rgb(1, 1, 1);">poweroff：立即关闭计算机</font>
+ <font style="color:rgb(1, 1, 1);">reboot：立即重启计算机</font>

:::

### 归档、压缩
:::info
+ <font style="color:rgb(1, 1, 1);">zip：压缩文件 zip liuyazhuang.zip myfile     格式为：“zip 压缩后的 zip 文件文件名”</font>
+ <font style="color:rgb(1, 1, 1);">unzip：解压文件 unzip liuyazhuang.zip</font>
+ <font style="color:rgb(1, 1, 1);">gzip：压缩文件 gzip 文件名</font>
+ <font style="color:rgb(1, 1, 1);">tar：归档文件</font>
+ <font style="color:rgb(1, 1, 1);">tar -cvf out.tar liuyazhuang 打包一个归档（将文件"liuyazhuang"打包成一个归档）</font>
+ <font style="color:rgb(1, 1, 1);">tar -xvf liuyazhuang.tar 释放一个归档（释放 liuyazhuang.tar 归档）</font>
+ <font style="color:rgb(1, 1, 1);">tar -cvzf backup.tar.gz/etc</font>
    - <font style="color:rgb(1, 1, 1);">-z 参数将归档后的归档文件进行 gzip 压缩以减少大小。</font>
    - <font style="color:rgb(1, 1, 1);">-c：创建一个新 tar 文件</font>
    - <font style="color:rgb(1, 1, 1);">-v：显示运行过程的信息</font>
    - <font style="color:rgb(1, 1, 1);">-f：指定文件名</font>
    - <font style="color:rgb(1, 1, 1);">-z：调用 gzip 压缩命令进行压缩</font>
    - <font style="color:rgb(1, 1, 1);">-t：查看压缩文件的内容</font>
    - <font style="color:rgb(1, 1, 1);">-x：解开 tar 文件</font>
+ <font style="color:rgb(1, 1, 1);">tar -cvf test.tar *：将所有文件打包成 test.tar,扩展名.tar 需自行加上</font>
+ <font style="color:rgb(1, 1, 1);">tar -zcvf test.tar.gz *：将所有文件打包成 test.tar,再用 gzip 命令压缩</font>
+ <font style="color:rgb(1, 1, 1);">tar -tf test.tar ：查看 test.tar 文件中包括了哪些文件</font>
+ <font style="color:rgb(1, 1, 1);">tar -xvf test.tar 将 test.tar 解开</font>
+ <font style="color:rgb(1, 1, 1);">tar -zxvf foo.tar.gz 解压缩</font>
+ <font style="color:rgb(1, 1, 1);">gzip 各 gunzip 命令</font>
+ <font style="color:rgb(1, 1, 1);">gziptest.txt ：压缩文件时，不需要任何参数</font>
+ <font style="color:rgb(1, 1, 1);">gizp–l test.txt.gz：显示压缩率</font>

:::

### 查找
:::info
<font style="color:rgb(0, 0, 0);">locate：快速查找文件、文件夹：locate keyword</font>

<font style="color:rgb(0, 0, 0);"></font>

<font style="color:rgb(0, 0, 0);">此命令需要预先建立数据库，数据库默认每天更新一次，可用 updatedb 命令手工建立、更新数据库。</font>

<font style="color:rgb(0, 0, 0);"></font>

<font style="color:rgb(0, 0, 0);">find 查找位置查找参数，如：</font>

+ <font style="color:rgb(1, 1, 1);">find . -nameliuyazhuang查找当前目录下名称中含有"liuyazhuang"的文件</font>
+ <font style="color:rgb(1, 1, 1);">find / -name *.conf 查找根目录下（整个硬盘）下后缀为.conf 的文件</font>
+ <font style="color:rgb(1, 1, 1);">find / -perm 777 查找所有权限是 777 的文件</font>
+ <font style="color:rgb(1, 1, 1);">find / -type d 返回根目录下所有的目录</font>
+ <font style="color:rgb(1, 1, 1);">find . -name "a*"-exec ls -l {} ;</font>
+ <font style="color:rgb(1, 1, 1);">find 功能：用来寻找文件或目录。</font>
+ <font style="color:rgb(1, 1, 1);">格式：find [<路径>][匹配条件]</font>
+ <font style="color:rgb(1, 1, 1);">find / -name httpd.conf 搜索系统根目录下名为 httpd.conf 的文件</font>

:::

### 其他常用命令
:::info
+ <font style="color:rgb(1, 1, 1);">ctrl+c : 终止当前的命令</font>
+ <font style="color:rgb(1, 1, 1);">who 或 w 命令</font>
    - <font style="color:rgb(1, 1, 1);">功能：查看当前系统中有哪些用户登录</font>
    - <font style="color:rgb(1, 1, 1);">格式：who/w[参数]</font>
+ <font style="color:rgb(1, 1, 1);">dmesg 命令</font>
    - <font style="color:rgb(1, 1, 1);">功能：显示系统诊断信息、操作系统版本号、物理内存的大小以及其它信息</font>
+ <font style="color:rgb(1, 1, 1);">df 命令</font>
    - <font style="color:rgb(1, 1, 1);">功能：用于查看文件系统的各个分区的占用情况</font>
+ <font style="color:rgb(1, 1, 1);">du 命令</font>
    - <font style="color:rgb(1, 1, 1);">功能：查看某个目录中各级子目录所使用的硬盘空间数</font>
    - <font style="color:rgb(1, 1, 1);">格式：du [参数] <目录名></font>
+ <font style="color:rgb(1, 1, 1);">free 命令</font>
    - <font style="color:rgb(1, 1, 1);">功能：用于查看系统内存，虚拟内存（交换空间）的大小占用情况</font>

:::

### VIM
:::info
<font style="color:rgb(0, 0, 0);">VIM 是一款功能强大的命令行文本编辑器，在 Linux 中通过 vim 命令可以启动 vim 编辑器。</font>

<font style="color:rgb(0, 0, 0);"></font>

<font style="color:rgb(0, 0, 0);">一般使用 vim + 目标文件路径 的形式使用 vim</font>

<font style="color:rgb(0, 0, 0);"></font>

<font style="color:rgb(0, 0, 0);">如果目标文件存在，则 vim 打开目标文件，如果目标文件不存在，则 vim 新建并打开该文件</font>

<font style="color:rgb(0, 0, 0);"></font>

<font style="color:rgb(0, 0, 0);">:q：退出 vim 编辑器</font>

:::

#### VIM 模式
vim 拥有三种模式：

:::info
##### **<font style="color:rgb(0, 0, 0);">1）命令模式（常规模式）</font>**
<font style="color:rgb(0, 0, 0);">vim 启动后，默认进入命令模式，任何模式都可以通过 esc 键回到命令模式（可以多按几次），命令模式下可以键入不同的命令完成选择、复制、粘贴、撤销等操作。</font>

<font style="color:rgb(0, 0, 0);"></font>

<font style="color:rgb(0, 0, 0);">命名模式常用命令如下：</font>

+ <font style="color:rgb(1, 1, 1);">i : 在光标前插入文本；</font>
+ <font style="color:rgb(1, 1, 1);">o：在当前行的下面插入新行；</font>
+ <font style="color:rgb(1, 1, 1);">dd：删除整行；</font>
+ <font style="color:rgb(1, 1, 1);">yy：将当前行的内容放入缓冲区（复制当前行）</font>
+ <font style="color:rgb(1, 1, 1);">n+yy ：将 n 行的内容放入缓冲区（复制 n 行）</font>
+ <font style="color:rgb(1, 1, 1);">p：将缓冲区中的文本放入光标后（粘贴）</font>
+ <font style="color:rgb(1, 1, 1);">u：撤销上一个操作</font>
+ <font style="color:rgb(1, 1, 1);">r：替换当前字符</font>
+ <font style="color:rgb(1, 1, 1);">/ 查找关键字</font>
+ <font style="color:rgb(1, 1, 1);">ggdG：删除文件中的所有内容</font>
    - <font style="color:rgb(1, 1, 1);">gg：将光标移到文件的开头</font>
    - <font style="color:rgb(1, 1, 1);">dG：删除从光标位置到文件末尾的内容</font>



##### **<font style="color:rgb(0, 0, 0);">2）插入模式</font>**
<font style="color:rgb(0, 0, 0);">在命令模式下按 " i "键，即可进入插入模式，在插入模式可以输入编辑文本内容，使用 esc 键可以返回命令模式。</font>



##### **<font style="color:rgb(0, 0, 0);">3）ex 模式</font>**
<font style="color:rgb(0, 0, 0);">在命令模式中按" : "键可以进入 ex 模式，光标会移动到底部，在这里可以保存修改或退出 vim.</font>

<font style="color:rgb(0, 0, 0);"></font>

<font style="color:rgb(0, 0, 0);">ext 模式常用命令如下：</font>

+ <font style="color:rgb(1, 1, 1);">:w	保存当前的修改</font>
+ <font style="color:rgb(1, 1, 1);">:q 	退出</font>
+ <font style="color:rgb(1, 1, 1);">:q!    强制退出，保存修改</font>
+ <font style="color:rgb(1, 1, 1);">:x     保存并退出，相当于:wq</font>
+ <font style="color:rgb(1, 1, 1);">:set number 显示行号</font>
+ <font style="color:rgb(1, 1, 1);">:! 	系统命令 执行一个系统命令并显示结果</font>
+ <font style="color:rgb(1, 1, 1);">:sh	切换到命令行，使用 ctrl+d 切换回 vim</font>

:::

---

## 软件包管理命令(RPM)
### 软件包的安装
:::info
<font style="color:rgb(0, 0, 0);">使用 RPM 命令的安装模式可以将软件包内所有的组件放到系统中的正确路径，安装软件包的命令是：rpm –ivh wu-ftpd-2.6.2-8.i386.rpm</font>

<font style="color:rgb(0, 0, 0);"></font>

<font style="color:rgb(0, 0, 0);">i：作用 rpm 的安装模式 v: 校验文件信息 h: 以＃号显示安装进度</font>

:::

### 软件包的删除
:::info
<font style="color:rgb(0, 0, 0);">删除模式会将指定软件包的内容全部删除，但并不包括已更改过的配置文件，删除 RPM 软件包的命令如下：rpm –e wu-ftpd</font>

<font style="color:rgb(0, 0, 0);"></font>

<font style="color:rgb(0, 0, 0);">注意：这里必须使用软件名“wu-ftpd”或”wu-ftpd-2.6.2-8 而不是使用当初安装时的软件包名.wu-ftpd-2.6.2-8.i386.rpm</font>

:::

### 软件包升级
:::info
<font style="color:rgb(0, 0, 0);">升级模式会安装用户所指定的更新版本，并删除已安装在系统中的相同软件包，升级软件包命令如下：</font>

<font style="color:rgb(0, 0, 0);">rpm –Uvh wu-ftpd-2.6.2-8.i386.rpm   # –Uvh：升级参数</font>

:::

### 软件包更新
:::info
<font style="color:rgb(0, 0, 0);">更新模式下，rpm 命令会检查在命令行中所指定的软件包是否比系统中原有的软件 包更新。如果情况属实，rpm 命令会自动更新指定的软件包；反之，若系统中并没有指定软件包的较旧版本，rpm 命令并不会安装此软件包。而在升级模式下，不管系统中是否有较旧的版本，rpm 命令都会安装指定的软件包。</font>

<font style="color:rgb(0, 0, 0);"></font>

<font style="color:rgb(0, 0, 0);">rpm –Fvhwu-ftpd-2.6.2-8.i386.rpm    # -Fvh：更新参数</font>

:::

### 软件包查询
:::info
<font style="color:rgb(0, 0, 0);">若要获取 RPM 软件包的相关信息，可以使用查询模式。使用-q 参数可查询一个已 安装的软件包的内容</font>

<font style="color:rgb(0, 0, 0);">rpm –q wu-ftpd</font>

<font style="color:rgb(0, 0, 0);"></font>

<font style="color:rgb(0, 0, 0);">查询软件包所安装的位置：</font>

<font style="color:rgb(0, 0, 0);">rpm –ql package-name</font>

<font style="color:rgb(0, 0, 0);"></font>

<font style="color:rgb(0, 0, 0);">rpm –ql xv (l 参数：显示文件列表)</font>

:::

