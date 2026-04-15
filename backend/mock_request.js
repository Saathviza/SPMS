const controller = require('./src/controllers/examiner.controller');
const req = { user: { id: 2, role: 'EXAMINER' } };
const res = { 
    status: function(code) { this.code = code; return this; },
    json: function(data) { 
        require('fs').writeFileSync('manual_crash.txt', JSON.stringify({code: this.code, data: data}, null, 2)); 
    }
};

controller.getPendingBadges(req, res).then(() => {
    console.log("Done");
    setTimeout(() => process.exit(), 1000);
}).catch(e => {
    require('fs').writeFileSync('manual_crash.txt', e.message);
    process.exit();
});
