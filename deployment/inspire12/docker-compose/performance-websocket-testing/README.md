# For local 실행

```shell
k6 run ./js/<test-name>.js -e USERS=20 -e PORT=8080
```
# For container test run with:

## influxdb network settings
```
docker network create load-testing-network
```
```
docker network connect load-testing-network influxdb-performance
```


```shell
docker-compose run --rm k6 run /k6-scripts/run/stomp.js 
```

```shell
docker-compose run --rm k6 run /k6-scripts/run/stomp.js -e USERS=20
```