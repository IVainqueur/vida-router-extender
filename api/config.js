module.exports = {
    URLS: {
        'connected-devices': "http://192.168.0.1/xml_action.cgi?method=get&module=duster&file=json_device_management_all1672992281000",

        'mac-filters': "http://192.168.0.1/xml_action.cgi?method=get&module=duster&file=json_uapx_wlan_mac_filters1673041419000",

        'blacklist-add': "http://192.168.0.1/xml_action.cgi?method=post&module=duster&file=json_uapx_wlan_mac_filters1673040804000",

        'blacklist-remove': "http://192.168.0.1/xml_action.cgi?method=post&module=duster&file=json_uapx_wlan_mac_filters1673040905000",

        "whitelist-add": "http://192.168.0.1/xml_action.cgi?method=post&module=duster&file=json_uapx_wlan_mac_filters1673041261000",

        "whitelist-remove": "http://192.168.0.1/xml_action.cgi?method=post&module=duster&file=json_uapx_wlan_mac_filters1673041396000",

        
    },
    FILTERLIST_TYPES: ["whitelist", "blacklist"]
}