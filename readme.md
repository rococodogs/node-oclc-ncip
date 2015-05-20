# oclc-ncip

Beta implementation of OCLC's [WMS NCIP Services](http://www.oclc.org/developer/develop/web-services/wms-ncip-service.en.html). Currently only supports [Staff services](http://www.oclc.org/developer/develop/web-services/wms-ncip-service/staff-profile.en.html), as the Patron services seem to require token authorization instead of a generic HMAC signature.

## caveat

The XML response parser is pretty rudimentary, meaning that attributes/namespacing are ignored, repeating nodes 
aren't stored as arrays, and single tags (`<example />`) result in an empty object (see the below examples).

Currently, this is best used for single transactions. Any help with this (or anything else, really) is greatly 
appreciated.

## requires

* OCLC [WebService Key](http://www.oclc.org/developer/develop/authentication/what-is-a-wskey.en.html)
* `principalID` and `principalIDNS` of the user that will be making these automated requests (at a later point, this could/should allow for OCLC [Access Tokens](http://www.oclc.org/developer/develop/authentication/access-tokens.en.html))
* currently only tested on iojs v1.6.3, but it'll probably work on your moderately-new version of node too.

## usage

```
npm install oclc-ncip
```

### design note

All five methods are designed to also accept an object of params as the first parameter and a callback as the second. 
The keys for these objects are the parameter names used below as well as within the source. In addition to those listed,
each object allows for a custom WSKey (as `wskey`) and agencyID (as `agencyID`) to be passed, if that appeals to you.

Also, each of the callbacks provides two parameters: an error object (null on success), and a response object (null on failure). 

### new NCIP(agencyID, WSKey)

```javascript
var NCIP = require('oclc-ncip');
var WSKey = require('oclc-wskey');
var key = new WSKey('public_wskey', 'secret', {principalID: 'yadda-yadda', principalIDNS: 'yad:da:ya:dda'});

var ncip = new NCIP(128807, key);
```

The WSKey library doesn't require a user object for creation, but all of the NCIP calls rely on a `principalID` and `principalIDNS` pair to construct a url and HMAC signature.

### ncip.checkOutItem(branchID, itemBarcode, userBarcode, dueDate, callback)

Check an item out to a patron. `branchID` is whatever branch the item belongs to (which differs from the `agencyID` used
to instantiate the NCIP object). From what I've found, this ID isn't easily discoverable, but can be found by: switching branches in WMS, 'inspect element'-ing the modal that appears, and finding the values of the select options.

The `dueDate` parameter can be substituted for the callback to use the date as determined by the loan rules.

#### examples

```javascript
function cb(err, resp) {
  if (err) {
    console.warn(err);
  } else {
    console.log(resp);
  }
}

ncip.checkOutItem(129479, 10176, 6147646220, new Date('05/20/15'), cb);

/** or **/

var opt = {
      branchID: 129479,
      itemBarcode: 10176,
      userBarcode: 6147646220,
      dueDate: '5/20/15'
    };

ncip.checkOutItem(opt, cb);

// {
//   userID: { 
//     agencyID: '128807', 
//     userIdentifierValue: '6147646220' 
//   },
//   dateDue: '2015-06-17T23:59:59.000-04:00',
//   renewalCount: '4',
//   itemOptionalFields: { 
//     bibliographicDescription: { 
//       author: 'Clancy, Tom,',
//       bibliographicRecordID: [Object],
//       publicationDate: '2010',
//       publisher: 'New York : G.P. Putnam\'s Sons,',
//       title: 'Dead or alive /',
//       language: 'eng',
//       mediumType: 'Book' 
//     },
//     itemUseRestrictionType: 'DEFAULT_4BOOK',
//     circulationStatus: 'On Loan',
//     itemDescription: { 
//       callNumber: 'PS3553.L245 D425 2010',
//       itemDescriptionLevel: 'Item',
//       holdingsInformation: [Object],
//       numberOfPieces: '1'
//     },
//     location: { 
//       locationType: 'Permanent Location', 
//       locationName: [Object] 
//     } 
//   } 
// }
```

### ncip.checkInItem(branchID, itemBarcode, callback)

Checks an item in.

#### example

```javascript
ncip.checkInItem(129479, 10176, function(err, resp) { console.log(resp); });

// { 
//   itemID: { 
//     agencyID: '128807', 
//     itemIdentifierValue: '10176' 
//   },
//   userID: { 
//     agencyID: '128807', 
//     userIdentifierValue: '6147646220'
//   },
//   routingInformation: { 
//     routingInstructions: 'Re-shelve', 
//     destination: {} 
//   } 
// }
```


### ncip.requestItem(itemBarcode, userBarcode, pickupLocation, callback)

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

### ncip.requestBibItem(oclcNumber, userBarcode, pickupLocation, callback)

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

### cancelRequestItem(itemID || requestID, userBarcode, callback)

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

### cancelRequestBibItem(oclcNumber || requestID, userBarcode, callback)

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

# License

MIT