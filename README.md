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

## Install Java (If necessary as it comes preinstalled with Raspbian, now)
```sh
sudo apt-get update && sudo apt-get install oracle-java7-jdk
```

```sh
nano ~/.bashrc
```

Add the following lines.

```sh
export JAVA_HOME="/usr/lib/jvm/jdk-7-oracle-armhf"
export PATH=$PATH:$JAVA_HOME/bin
```

## Install Cassandra
```sh
http://downloads.datastax.com/community/dsc-cassandra-2.1.2-bin.tar.gz
tar -zxvf dsc-cassandra-2.1.2-bin.tar.gz
sudo ./dsc-cassandra-2.1.2/bin/cassandra
```

Edit the ./conf/cassandra.yaml and the the 'broadcast_rpc_address' to the ipaddress of the Raspberry Pi. You should be able to connect DataStax DevCenter to it.

## Create Cassandra Keyspace and Tables

```javascript
node ./server/tools/CQL -s -f ../cql/resetAppKeyspace.cql
```

```javascript
node ./server/tools/CQL -s -f ../cql/setupDB.cql -k rpi
```

## Run app
```sh
sudo node ./server/app.js
```
