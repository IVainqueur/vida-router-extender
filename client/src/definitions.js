const dialogs = {
    limit: document.querySelector("dialog.dialog-limit"),
    filterlist: document.querySelector("dialog.dialog-filterlist"),
};



class Utils {
    static toMinutes(time) {
        const units = time.split(',');
        const unitMapping = {
            'hours': 60,
            'mins': 1,
            'secs': (1 / 60),
        }
        let result = 0;
        for (const t of units) {
            const T = {
                value: t.split(' ')[0] ? t.split(' ')[0] : t.split(' ')[1],
                unit: t.split(' ')[0] ? t.split(' ')[1] : t.split(' ')[2],
            }
            if (!t || !unitMapping[T.unit]) continue;
            result += Number(T.value) * unitMapping[T.unit];
        }

        return result;
    }

    static toHHMMSS(minutes) {
        let h = Math.floor(minutes / 60);
        let m = minutes % 60;
        let s = 0;
        return `${h} hours,${m} mins,${s} secs`;
    }

    static HexToString(hex) {
        let str = '';
        let chunks = hex.split(' ');
        for (let chunk of chunks) {
            if (!chunk) continue;
            str += String.fromCharCode(parseInt(chunk, 16));
        }
        return str;
    }
}

class Card_ConnectedDevice extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        const dataset = this.dataset;

        const card = document.createElement("div");
        card.classList.add("connected-device-card");

        const h1 = document.createElement("h1");
        h1.classList.add("device-name");
        h1.innerHTML = dataset.deviceName;

        const p_ip = document.createElement("p");
        p_ip.classList.add("device-ip");
        p_ip.innerHTML = dataset.deviceIp;

        const p_mac = document.createElement("p");
        p_mac.classList.add("device-mac");
        p_mac.innerHTML = dataset.deviceMac;

        const span_duration = document.createElement("p");
        span_duration.classList.add("device-duration");
        span_duration.innerHTML = dataset.deviceDuration;

        const span_limit = document.createElement("p");
        span_limit.classList.add("device-limit");
        span_limit.innerHTML = '/ -- hours, -- mins, -- secs';

        const div_actionButtons = document.createElement("div");
        div_actionButtons.classList.add("action-buttons");
        div_actionButtons.dataset.deviceIndex = dataset.deviceIndex;
        div_actionButtons.dataset.deviceName = dataset.deviceName;
        div_actionButtons.dataset.deviceMac = dataset.deviceMac;

        const btn_block = document.createElement("button");
        btn_block.classList.add("btn-block");
        btn_block.innerHTML = "Block";

        const btn_limit = document.createElement("button");
        btn_limit.classList.add("btn-limit");
        btn_limit.innerHTML = "Limit";
        btn_limit.addEventListener("click", this.limit_device);

        div_actionButtons.appendChild(btn_block);
        div_actionButtons.appendChild(btn_limit);

        card.appendChild(h1);
        card.appendChild(p_ip);
        card.appendChild(p_mac);
        card.appendChild(span_duration);
        card.appendChild(span_limit);
        card.appendChild(div_actionButtons);

        this.appendChild(card);

        // Adding the limit (if any)
        const parsedData = JSON.parse(localStorage.getItem('RE_limited') ?? '[]');
        if (!Array.isArray(parsedData)) return;

        for (let device of parsedData) {
            if (device.deviceMac === dataset.deviceMac) {
                span_limit.innerHTML = `/ ${device.duration}`;
                this.dataset.deviceLimit = device.duration;
                btn_limit.innerHTML = "UNLimit";

                const limit = Utils.toMinutes(this.dataset.deviceLimit);
                const duration = Utils.toMinutes(this.dataset.deviceDuration);
                if (duration >= limit && !this.classList.contains('over-limit')) {
                    this.classList.add('over-limit');
                    // Find the device in the whitelist and click its delete button
                    const corresponding = document.querySelector(`.WhiteList card-filterlist-device[data-device-mac="${this.dataset.deviceMac}"]`);
                    if(corresponding) corresponding.querySelector('button').click();
                }
                break;
            };
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        const correspondingDisplay = this.querySelector(`.${name.split('data-')[1]}`);
        if (correspondingDisplay) correspondingDisplay.innerHTML = newValue;

        // If the attribute changed is data-device-duration, check if the current time isn't past the limit
        if (name === 'data-device-duration') {
            if (!this.dataset.deviceLimit) return;

            const limit = Utils.toMinutes(this.dataset.deviceLimit);
            const duration = Utils.toMinutes(newValue);
            if (duration >= limit && !this.classList.contains('over-limit')) {
                this.classList.add('over-limit');
                // Find the device in the whitelist and click its delete button
                const corresponding = document.querySelector(`.WhiteList card-filterlist-device[data-device-mac="${this.dataset.deviceMac}"]`);
                if(corresponding) corresponding.querySelector('button').click();
            }
        }

    }

    static get observedAttributes() { return ['data-device-name', 'data-device-ip', 'data-device-duration', 'data-device-limit', 'data-device-mac']; }


    limit_device(e) {
        if(e.currentTarget.innerHTML.toLowerCase() === "unlimit") {
            // Remove device from RE_limited
            const parsedData = JSON.parse(localStorage.getItem('RE_limited') ?? '[]');
            if (!Array.isArray(parsedData)) return;

            const newParsedData = parsedData.filter((device) => device.deviceMac !== e.currentTarget.parentElement.dataset.deviceMac);
            localStorage.setItem('RE_limited', JSON.stringify(newParsedData));

            // Remove the limit from the card
            const card = e.currentTarget.parentElement.parentElement;
            card.dataset.deviceLimit = "";
            card.querySelector(".device-limit").innerHTML = '/ -- hours, -- mins, -- secs';
            card.classList.remove('over-limit');
            e.currentTarget.innerHTML = "Limit";
            return;
        };
        const dataSet = Object.assign({}, e.currentTarget.parentElement.dataset);
        if (Object.values(dataSet).includes("")) return;

        Object.assign(dialogs.limit.dataset, dataSet);
        dialogs.limit.setAttribute("open", true);

        dialogs.limit.querySelector("h1 span").innerHTML = dataSet.deviceName;
    }

    static populate(new_cards) {
        const oldCards = Array.from(
            document.querySelectorAll("card-connected-device")
        ).map((card) => card.dataset);

        const cardsToBeRemoved = oldCards.filter(
            (oldCard) => !new_cards.some((newCard) => newCard.deviceMac === oldCard.deviceMac)
        );

        const cardsToBeAdded = new_cards.filter(
            (newCard) => !oldCards.some((oldCard) => newCard.deviceMac === oldCard.deviceMac)
        );

        cardsToBeRemoved.forEach((card) => {
            document.querySelector(`[data-device-mac="${card.deviceMac}"]`).remove();
        });

        cardsToBeAdded.forEach((card) => {
            const newCard = document.createElement("card-connected-device");
            Object.assign(newCard.dataset, card);
            document.querySelector(".ConnectedDevices .devices").appendChild(newCard);
        });

        const cardsToBeUpdated = new_cards.filter((newCard) =>
            oldCards.some((oldCard) => newCard.deviceMac === oldCard.deviceMac)
        );

        cardsToBeUpdated.forEach((card) => {
            const oldCard = document.querySelector(
                `card-connected-device[data-device-mac="${card.deviceMac}"]`
            );
            Object.assign(oldCard.dataset, card);
        });
    }
}

class Card_FilterListDevice extends HTMLElement {
    ACTION_MAP = {
        'whitelist': this.filterListRemove,
        'blacklist': this.filterListRemove
    }
    ALLOWED_TYPES = Object.keys(this.ACTION_MAP)
    constructor() {
        super();
    }

    connectedCallback() {
        if (!this.dataset.deviceMac) throw new Error('card-filterlist-device Element must have data-device-mac attribute');
        if (!this.getAttribute('type')) throw new Error('card-filterlist-device Element must have type attribute');
        if (!this.dataset.deviceIndex) throw new Error('card-filter-list must have data-device-index attribute')

        const type = this.getAttribute('type');
        const deviceMac = this.dataset.deviceMac;

        if (!this.ALLOWED_TYPES.includes(type)) throw new Error('card-filterlist-device type can only be one of ' + JSON.stringify(this.ALLOWED_TYPES))

        // Create and append the needed elements
        const card = document.createElement('div');
        card.classList.add('filter-list-device-card');

        const h3 = document.createElement('h3');
        h3.innerHTML = deviceMac;

        const button = document.createElement('button');
        button.innerHTML = 'DELETE';
        button.addEventListener('click', this.ACTION_MAP[type]);

        card.appendChild(h3);
        card.appendChild(button);

        this.appendChild(card);

    }

    async filterListRemove(e) {
        try {
            const mac = e.currentTarget.closest('card-filterlist-device').dataset.deviceMac;
            const index = e.currentTarget.closest('card-filterlist-device').dataset.deviceIndex;
            const type = e.currentTarget.closest('card-filterlist-device').getAttribute('type');
            const data = JSON.parse(localStorage.getItem('RE_filterlist'));
            const enable = data.enabled;
            const mode = type === 'whitelist' ? 1 : 2;
            await fetch(`http://localhost/api/filterlist?type=${type}&action=remove`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ mac, index, type, enable, mode, action: 'remove' }),
            })
            console.log(`removed from ${type}`)
        } catch (error) {
            console.log(error)
        }

    }



    static async filterListAdd(e) {
        try {
            const type = e.currentTarget.closest('dialog').dataset.type;
            const mac = e.currentTarget.elements['device-mac'].value;

            const data = JSON.parse(localStorage.getItem('RE_filterlist'));
            const enable = data.enabled;
            const mode = type === 'whitelist' ? 1 : 2;

            await fetch(`http://localhost/api/filterlist?type=${type}&action=add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ mac, type, mode, enable, action: 'add' }),
            })
        } catch (error) {
            console.log(error)
        }
    }

    static whiteListAdd() { }

    static blackListAdd() { }

    static populate(newList) {
        const whiteListContainer = document.querySelector('.WhiteList')
        const whiteListDevices = whiteListContainer.querySelectorAll('.devices card-filterlist-device')

        const blackListContainer = document.querySelector('.BlackList');
        const blackListDevices = blackListContainer.querySelectorAll('.devices card-filterlist-device');

        // First the whitelist
        const whiteListDevicesToBeRemoved = Array.from(whiteListDevices).filter((device) => !newList.whitelist.includes(device.dataset.deviceMac));
        const whiteListDevicesToBeAdded = newList.whitelist.filter((device) => !Array.from(whiteListDevices).some((device) => device.dataset.deviceMac === device));

        whiteListDevicesToBeRemoved.forEach((device) => device.remove());
        whiteListDevicesToBeAdded.forEach((device) => {
            const newDevice = document.createElement('card-filterlist-device');
            newDevice.setAttribute('type', 'whitelist');
            newDevice.dataset.deviceMac = device.mac;
            newDevice.dataset.deviceIndex = device.index;
            whiteListContainer.querySelector('.devices').appendChild(newDevice);
        }
        );

        // Now the blacklist
        const blackListDevicesToBeRemoved = Array.from(blackListDevices).filter((device) => !newList.blacklist.includes(device.dataset.deviceMac));
        const blackListDevicesToBeAdded = newList.blacklist.filter((device) => !Array.from(blackListDevices).some((device) => device.dataset.deviceMac === device));

        blackListDevicesToBeRemoved.forEach((device) => device.remove());
        blackListDevicesToBeAdded.forEach((device) => {
            const newDevice = document.createElement('card-filterlist-device');
            newDevice.setAttribute('type', 'blacklist');
            newDevice.dataset.deviceMac = device.mac;
            newDevice.dataset.deviceIndex = device.index;
            blackListContainer.querySelector('.devices').appendChild(newDevice);
        }
        );


    }
}

customElements.define("card-connected-device", Card_ConnectedDevice);
customElements.define("card-filterlist-device", Card_FilterListDevice);

const onSubmitHandlers = {
    limit: (e) => {
        const duration = e.currentTarget.elements["limit-duration"].value;
        const deviceMac = e.currentTarget.parentElement.dataset.deviceMac;
        const limitedArr = JSON.parse(localStorage.getItem('RE_limited') ?? '[]');
        limitedArr.push({ duration: `0 hours,${duration} mins,0 secs`, deviceMac })
        localStorage.setItem(
            "RE_limited",
            JSON.stringify(limitedArr)
        );
        document.querySelector(`[data-device-mac="${deviceMac}"]`).dataset.deviceLimit = `0 hours,${duration} mins,0 secs`;
    },
    filterlist: Card_FilterListDevice.filterListAdd,
};

// fetch the data from the server
async function fetch_connectedDevices() {
    try {
        if(window.focused === false) {
            return;
        }   
        const response = await fetch("http://localhost:80/api/connected-devices");
        const data = await response.json();
        const connectedDevices = data.data;
        const parsedData = [];

        for (let device of connectedDevices) {
            const deviceData = {
                deviceName: Utils.HexToString(device.name),
                deviceIp: device.ip_address,
                deviceMac: device.mac,
                deviceDuration: (device.conn_time),
                deviceIndex: device.index,
            }
            parsedData.push(deviceData);
        }


        Card_ConnectedDevice.populate(parsedData);

    } catch (error) {
        console.log(error);
    } finally {
        // setTimeout(fetch_connectedDevices, 2000);
    }
}

async function fetch_filterlist() {
    try {
        if(window.focused === false) {
            return setTimeout(fetch_filterlist, 2000);
        }
        const response = await fetch('http://localhost/api/filterlist');
        const data = await response.json();

        Card_FilterListDevice.populate({
            whitelist: data.whitelist,
            blacklist: data.blacklist
        });

        localStorage.setItem('RE_filterlist', JSON.stringify(data))

        // indicate the active mode in the UI
        const selector = data.mode === 'whitelist' ? '.WhiteList' : '.BlackList';

        document.querySelector(selector).classList.add('active-filter');

    } catch (error) {
        console.log(error)
    } finally {
        // setTimeout(fetch_filterlist, 2000);
    }
}


