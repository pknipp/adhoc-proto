var fs = require('fs');

let method = 1;
if (method === 0) {
fs.open('txnlog.dat', 'r', function(status, fd) {
    if (status) {
        console.log(status.message);
        return;
    }
    var buffer = Buffer.alloc(9);
    fs.read(fd, buffer, 0, 9, 0, function(err, num) {
        console.log(buffer.toString('utf8', 0, num));
    });
    // var buffer = Buffer.alloc(5);
    // fs.read(fd, buffer, 0, 1, 0, function(err, num) {
    //     console.log(buffer.toString('utf8', 0, num));
    // });
});
} else {
fs.open('txnlog.dat', 'r', function(err, fd) {
    if (err)
      throw err;
    var buffer = Buffer.alloc(1);
    let count = 0;
    let magicString = '';
    let recordType;
    let types = ['Debit', 'Credit', 'StartAutopay', 'EndAutopay'];
    let [version, numRecords, time, id, amount] = [0, 0, 0, BigInt(0), 0];
    let [numRecordsArray, timeArray, idArray, amountArray] = [[], [], [], []];
    while (true)
    {
        var num = fs.readSync(fd, buffer, 0, 1, null);
        let n = buffer[0];
        if (num === 0) break;
        if (count < 4) {
            magicString += String.fromCharCode(n);
        } else if (count < 4 + 1) {
            version = n;
        } else if (count < 5 + 4) {
            numRecordsArray.push(n);
        } else if (count < 9 + 1) {
            recordType = n;
        } else if (count < 10 + 4) {
            timeArray.push(n);
        } else if (count < 14 + 8) {
            idArray.push(n);
        } else if (count < 22 + 8) {
            amountArray.push(n);
        }
        if (count === 4 - 1) console.log("magic string = ", magicString);
        if (count === 5 - 1) console.log("version = ", version);
        if (count === 9 - 1) {
            numRecords = numRecordsArray.reduce((numRecords, element) => numRecords * 256 + element);
            console.log("# of records = ", numRecords);
        }
        if (count === 10 - 1) console.log("record type = ", types[recordType]);
        if (count === 14 - 1) {
            time = timeArray.reduce((time, element) => time * 256 + element);
            console.log("Unix timestamp = ", time);
        }
        if (count === 22 - 1) {
            id = idArray.reduce((id, element) => id * 256n + BigInt(element), 0n);
            // stringifying the bigint removes the trailing "n"
            console.log("user ID = ", String(id));
        }
        if (count === 30 - 1) {
            time = timeArray.reduce((time, element) => time * 256 + element);
            console.log("Unix timestamp = ", time);
        }
    //   console.log(count, 'byte read', buffer[0], String.fromCharCode(buffer[0]));
        count++;
    }
});
}
