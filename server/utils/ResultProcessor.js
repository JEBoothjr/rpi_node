module.exports = exports = function(result, blacklist) {
    var row,
        processed_result = [],
        prop,
        i,
        j,
        rows,
        rowLen,
        listLen;

    blacklist = blacklist || ["__columns"];

    if (!result || !result.rows || !result.rows.length) {
        return processed_result;
    }

    rows = result.rows;
    rowLen = rows.length;

    for (i = 0; i < rowLen; i++) {
        row = rows[i];

        //delete null properties
        for (prop in row) {
            if (row[prop] === null) {
                delete row[prop];
            }
        }

        listLen = blacklist.length;
        for (j = 0; j < listLen; j++) {
            delete row[blacklist[j]];
        }

        //These are javascript objects and not json, so we have to do this magic to strip it of get methods.
        processed_result.push(JSON.parse(JSON.stringify(row)));
    }

    return processed_result;
}