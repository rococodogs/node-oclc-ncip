# oclc-ncip

A WIP implementation of OCLC's [WMS NCIP Services](http://www.oclc.org/developer/develop/web-services/wms-ncip-service.en.html). 
In the interest of keeping things simple, both staff and patron-level services will/should be available.

## requires

* OCLC [WebService Key](http://www.oclc.org/developer/develop/authentication/what-is-a-wskey.en.html)
* `principalID` and `principalIDNS` of the user that will be making these automated requests (at a later point, this could/should allow for OCLC [Access Tokens](http://www.oclc.org/developer/develop/authentication/access-tokens.en.html))
* currently only tested on iojs version 1.6.3

## todo list

- [Staff Profile](http://www.oclc.org/content/developer/worldwide/en_us/develop/web-services/wms-ncip-service/staff-profile.html)
  - [ ] Check Out
  - [ ] Check In
  - [x] Request Item
  - [x] Request Bibliographic Item
  - [x] Cancel Request Item
  - [x] Cancel Bibliographic Item

- [Patron Profile](http://www.oclc.org/developer/develop/web-services/wms-ncip-service/patron-profile.en.html)
  - [ ] Lookup User
  - [ ] Renew Item
  - [ ] Renew All Item
  - [x] Request Item - Bibliographic
  - [x] Request Item - Item
  - [ ] Update Request Item
  - [x] Cancel Request Item

**NOTE:** for operations w/in Patron Profile that duplicate functionality of those in Staff Profile (request/cancel items), the
Staff Profile implementation is being used. 

## usage

### new NCIP(agencyID, WSKey)

```javascript
var NCIP = require('oclc-ncip');
var WSKey = require('oclc-wskey');
var key = new WSKey('public_wskey', 'secret', {principalID: 'yadda-yadda', principalIDNS: 'yad:da:ya:dda'});

var ncip = new NCIP(128807, key);
```

### ncip.requestItem(itemBarcode, userBarcode, pickupLocation, cb)

Place an item-level hold on an item.

```javascript
var itemBarcode = 10176
  , userBarcode = 6147646220
  , pickupLocation = 123456
  ;

ncip.requestItem(itemBarcode, userBarcode, pickupLocation, function(err, resp) {
    if ( err ) return console.warn(err);
    console.log(resp)
})

// { 
//   requestID: { 
//     agencyID: '128807',
//     requestIdentifierValue: 'f93d83db-14b4-49bb-80fc-bde513af3733' 
//   },
//   userID: { 
//     agencyID: '128807', 
//     userIdentifierValue: '6147646220' 
//   },
//   requestType: 'Hold',
//   requestScopeType: 'Item' 
// }
```

### ncip.requestBibItem(oclcNumber, userBarcode, pickupLocation, cb)

Place a Bibliographic-level item hold. Essentially a wrapper around `NCIP.requestItem`.

```javascript
var oclcNumber = 606774536
  , userBarcode = 6147646220
  , pickupLocation = 123456
  ;

ncip.requestBibItem(oclcNumber, userBarcode, pickupLocation, function(err, resp) {
  if ( err ) return console.warn(err.detail);
  console.log(resp);
});

// { 
//   requestID: { 
//     agencyID: '128807',
//     requestIdentifierValue: 'f93d83db-14b4-49bb-80fc-bde513af3733' 
//   },
//   userID: { 
//     agencyID: '128807', 
//     userIdentifierValue: '6147646220' 
//   },
//   requestType: 'Hold',
//   requestScopeType: 'Bibliographic Item' 
// }
```

### cancelRequestItem(itemID || requestID, userBarcode, cb)

Cancels an item-level request item. The item's ID or the request's ID can be passed through the first parameter.

```javascript
ncip.cancelRequestItem('f93d83db-14b4-49bb-80fc-bde513af3733', 6147646220, function(err, resp) {
    console.log(resp);
});

// { 
//   userID: { 
//     agencyID: '128807', 
//     userIdentifierValue: '6147646220' 
//   } 
// }
```

### cancelRequestBibItem(oclcNumber || requestID, userBarcode, cb)

Cancels a bib-level request item. The bib-record's OCLC number or the request ID can be passed through the first parameter.

```javascript
ncip.cancelRequestBibItem('f93d83db-14b4-49bb-80fc-bde513af3733', 6147646220, function(err, resp) {
    console.log(resp);
});

// { 
//   userID: { 
//     agencyID: '128807', 
//     userIdentifierValue: '6147646220' 
//   } 
// }
```