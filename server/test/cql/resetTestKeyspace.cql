-- <cql>
DROP KEYSPACE IF EXISTS rpi_test;
-- </cql>

-- <cql>
CREATE KEYSPACE IF NOT EXISTS rpi_test
WITH REPLICATION = {'class' : 'SimpleStrategy', 'replication_factor': 1};
-- </cql>
