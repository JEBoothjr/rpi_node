/*jslint node: true */
"use strict";

var util = require('util'),
    BaseModel = require('./Base'),
    findAllQuery = "SELECT * FROM logs;",
    findByIdQuery = "SELECT * FROM logs WHERE id = ?;",
    createQuery = "INSERT INTO logs (id, name, description) VALUES(?, ?, ?);",
    updateQuery = "UPDATE logs SET <%> WHERE id=?",
    deleteQuery = "DELETE FROM logs WHERE id=?;";

function LogModel() {
    BaseModel.apply(this, arguments);
}

util.inherits(LogModel, BaseModel);
LogModel.prototype.name = 'LogModel';

LogModel.prototype.create = function(data, callback) {
    data.id = this.driver.types.timeuuid();

    this.execute(createQuery, [data.id, data.name, data.description], null, function(err) {

        //Only return the id. The service will to a proper lookup
        callback(err, err ? null : {
            id: data.id
        });
    });
};

LogModel.prototype.findAll = function(callback) {
    var self = this;

    this.execute(findAllQuery, null, null, function(err, result) {
        result = err ? null : self.processResults(result);

        callback(err, result);
    });
};

LogModel.prototype.findById = function(id, callback) {
    var self = this;

    this.execute(findByIdQuery, [id], null, function(err, result) {
        result = self.processResults(result)[0] || null;

        callback(err, result);
    });
};

//TODO : maybe only generate the code at publish time
LogModel.prototype.update = function(data, callback) {
    var logId = data.id,
        query;

    delete data.id; //We don't want this in the query

    query = this.buildSetQuery(updateQuery, data);

    this.execute(query, [logId], null, function(err) {

        //Only retun the id. The service will to a proper lookup
        callback(err, err ? null : {
            id: logId
        });
    });
};

LogModel.prototype.delete = function(id, callback) {
    this.execute(deleteQuery, [id], null, function(err) {

        callback(err, null);
    });
};

module.exports = exports = LogModel;