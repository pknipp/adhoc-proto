const fs = require('fs');

const read = (n, fd) => (new Array(n)).fill(null).reduce(array => {
    const buffer = Buffer.alloc(1);
    const num = fs.readSync(fd, buffer, 0, 1, null);
    return [...array, buffer[0]];
}, []);

const parseArray = array => {
    const types = ['Debit', 'Credit', 'StartAutopay', 'EndAutopay'];
    let recordType = types[array[0]];
    let timeStamp = array.reduce((sum, element, i) => {
        return (i && i < 5) ? sum * 256 + element : sum;
    });
    let id = array.reduce((sum, element, i) => {
        return (i > 4 && i < 13) ? sum * 256n + BigInt(element) : sum;
    }, 0n);
    return {recordType, timeStamp, id};
}

const amount = array => {
    let exponent = array.shift();
    let bit = exponent < 128 ? 0 : 1;
    let sign = (-1) ** bit;
    exponent -= bit * 128 ;
    exponent *= 16;
    let nextByte = array.shift();
    exponent += Math.floor(nextByte / 16);
    exponent *= sign;
    exponent -= 1023;
    let fraction = 1 + (nextByte % 16) / 16;
    array.forEach((byte, i) => {
        fraction += byte / 16 / 256 ** (i + 1)
    });
    return sign * 2 ** exponent * fraction;
}

fs.open('txnlog.dat', 'r', function(err, fd) {
    if (err) throw err;
    const magicString = read(4, fd).map(n => String.fromCharCode(n)).join('');
    if (magicString !== 'MPS7') return console.log("I don't know how to parse this type of file.");
    const version = read(1, fd)[0];
    let numberOfRecords = read(4, fd).reduce((sum, n) => sum * 256 + n);
    // console.log("magic string = ", magicString, ", version = ", version, ", and # of records = ", numberOfRecords)
    let [totalCreditAmount, totalDebitAmount, autopaysStarted, autopaysEnded, balanceForUser] = new Array(5).fill(0);
    let userId = 2456938384156277127n;
    for (let i = 0; i < numberOfRecords; i++) {
        let row = parseArray(read(13, fd));
        if (['Debit', 'Credit'].includes(row.recordType)) row.amount = amount(read(8, fd));
        switch (row.recordType) {
            case 'Debit':
              totalDebitAmount += row.amount;
              if (row.id === userId) balanceForUser -= row.amount;
              break;
            case 'Credit':
              totalCreditAmount += row.amount;
              if (row.id === userId) balanceForUser += row.amount;
              break;
            case 'StartAutopay':
              autopaysStarted++;
              break;
            case 'EndAutopay':
              autopaysEnded++;
              break;
            default:
        }
        // console.log(i, row);
    }
    console.log("total credit amount=", totalCreditAmount.toFixed(2));
    console.log("total debit amount=" , totalDebitAmount.toFixed(2));
    console.log("autopays started="   , autopaysStarted);
    console.log("autopays ended="     , autopaysEnded);
    console.log("balance for user ", String(userId), "=", balanceForUser.toFixed(2));
});
