#### Redis

###### Set env ip
> switch to wsl
> ip addr

###### Start Redis
> switch to wsl
> redis-server --protected-mode no

###### Close redis
> sudo su
> /etc/init.d/redis-server stop

Force close
> 

###### Confirm connection
> redis-cli
> ping
> ps -aux|grep redis
> kill -9 {pid}

###### Check log
> sudo tail /var/log/redis/redis-server.log -n 100






> redis-cli shutdown

