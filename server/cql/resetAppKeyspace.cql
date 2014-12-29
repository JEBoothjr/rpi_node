-- <cql>
DROP KEYSPACE IF EXISTS rpi;
-- </cql>

-- <cql>
CREATE KEYSPACE IF NOT EXISTS rpi
WITH REPLICATION = {'class' : 'SimpleStrategy', 'replication_factor': 1};
-- </cql>
