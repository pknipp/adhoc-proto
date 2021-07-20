var fs = require('fs');
fs.open('txnlog.dat', 'r', function(err, fd) {
    if (err)
      throw err;
    var buffer = Buffer.alloc(1);
    let count = 0;
    let magicString = '';
    let recordType;
    let types = ['Debit', 'Credit', 'StartAutopay', 'EndAutopay'];
    let [version, numRecords, time, id, amount] = [0, 0, 0, BigInt(0), 1];
    let [numRecordsArray, timeArray, idArray, fractionArray] = [[], [], [], []];
    let sign, exponent, fraction;
    while (true) {
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
        } else if (count === 22) {
            let bit = n < 128 ? 0 : 1;
            sign = bit ? -1 : 1;
            exponent = n - bit * 128;
        } else if (count === 23) {
            exponent = exponent * 16 + Math.floor(n / 16) - 1023;
            fraction = ((n % 16) / 16);
        } else if (count === 24) {
            fraction += n / 256 / 16;
        } else if (count === 25) {
            fraction += n / 256 / 256 / 16;
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
        if (count === 25) {
            amount *= (2 ** exponent) * (1 + fraction);
            console.log("amount = ", amount);
        }
        count++;
    }
});
