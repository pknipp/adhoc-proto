var fs = require('fs');

const read = (n, fd) => {
    const bufer = Buffer.alloc(n);
    fs.read(fd, buffer, 0, n, 0, (err, num) => {
        
    })

}

fs.open('txnlog.dat', 'r', function(status, fd) {
    if (status) return console.log(status.message);
    const buffer = Buffer.alloc(4);
    fs.read(fd, buffer, 0, 4, 0, function(err, num) {
        console.log(buffer.toString('utf8', 0, num));
    });
});
