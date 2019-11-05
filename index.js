const cron = require('cron');
const moment = require('moment');
const axios = require("axios").default;
axios.defaults.headers.common['Authorization'] = process.argv[2];
axios.defaults.headers.post['accept'] = 'application/json';
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';

axios.defaults.baseURL = 'https://napi.arvancloud.com/ecc/v1/regions';
async function start() {
    let regions = await axios({
        method: "GET"
    }).catch(console.error);
    regions = regions.data.data.map(item => item.code);
    let oneGigaByte = 1073741824;
    for await (const region of regions) {
        let server = await axios(`/${region}/servers`, {
            method: "GET"
        }).catch(console.error);
        let date = moment().format('YYYY-MM-DD_HH-mm    ')
        server = server.data.data;
        server = server.map(item => {
            return {
                id: item.id,
                backupSize: item.flavor.disk * oneGigaByte,
                name: `${date}` //_${item.name}_${item.image.name}
            }
        })
        for await (const itemServer of server) {
            let snapshot = await axios(`/${region}/servers/${itemServer.id}/snapshot`, {
                method: 'post',
                data: {
                    name: itemServer.name
                },
            }).catch(console.error);

            console.info(`snapShot: \n ${snapshot.data.message}`);
        }
    }
}
cron.schedule('* * 59 * * *', async () => {
    start()
});