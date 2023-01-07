const express = require('express');
const app = express();
const cors = require('cors');
const port = 80 || process.env.PORT;
const config = require('./config');
const { default: axios } = require('axios');

app.use(cors());
app.use(express.json());

app.get('/api/connected-devices', async (req, res) => {
    try {
        const response = await axios.get(config.URLS['connected-devices']);
        const data = response.data;
        const connectedDevices = data.Item;
        res.send({ success: true, data: connectedDevices });
    } catch (error) {
        res.status(500).send({ success: false, error: error.message });
    }

})

app.get('/api/filterlist', async (req, res) => {
    try {
        const response = await axios.get(config.URLS['mac-filters']);
        const data = response.data;
        res.status(200).json({
            enabled: !!Number(data.enable),
            mode: data.mode === '1' ? 'whitelist' : 'blacklist',
            whitelist: data.allow_list,
            blacklist: data.deny_list,
        })
    } catch (error) {
        res.status(500).send({ success: false, error: error.message });
    }
})

app.post('/api/filterlist', async (req, res) => {
    try {
        const { type, action } = req.query;

        if (!type) throw new Error('type should be specified in the query');

        if (!config.FILTERLIST_TYPES.includes(type)) throw new Error('type can only be one of ' + JSON.stringify(config.FILTERLIST_TYPES));

        if (!action) throw new Error('action should be specified in the query');

        if (!['add', 'remove'].includes(action)) throw new Error('action can only be one of [add, remove]');

        const { mac, index, enable, mode } = req.body;
        if (!mac) throw new Error('mac should be specified in the body');

        if (action === 'remove' && !index) throw new Error('index should be specified in the body when action is remove');

        const url = config.URLS[`${type}-${action}`];

        const _data = {
            enable: Number(enable).toString() ?? 1,
            mode: String(mode) ?? (type === 'whitelist' ? '1' : '2'),
            ...(action === 'add' ?
                (
                    type === 'whitelist' ?
                        { allow_list: { mac } } :
                        { deny_list: { mac } }
                )
                :
                (
                    type === 'whitelist' ?
                        { 'allow_delete_index': `${Number(index) -1},` } :
                        { 'deny_delete_index': `${Number(index) -1},` }
                )
            ),
        }

        const response = await axios.post(url, JSON.stringify(_data), {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        console.log(response.data)
        res.status(200).json({ success: true })
    } catch (error) {
        console.log(error)
        res.status(500).send({ success: false, error: error.message });
    }
})

app.listen(port, () => console.log(`#Listening on port ${port}!`));