rpi_node
========

A node application to get up and running with Raspberry Pi and Cassandra


## Install node.js
```sh
ssh pi@192.168.1.100 (Your Paspberry Pi ip address)
```

```sh
wget http://nodejs.org/dist/v0.10.35/node-v0.10.35.tar.gz
tar xvf node-v0.10.35.tar.gz
cd node-v0.10.35
./configure
make (It takes a while to compile - 2+ hours)
sudo make install
```

## Install Cassandra
TODO

## Prepare Cassandra

```javascript
node ./server/tools/CQL -s -f ../cql/resetAppKeyspace.cql
```

```javascript
node ./server/tools/CQL -s -f ../cql/setupDB.cql
```

## Run app
```sh
node ./server/app.js
```
