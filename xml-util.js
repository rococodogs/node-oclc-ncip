// utility xml-building functions

module.exports = {
  bibID: bibID,
  initiationHeader: initiationHeader,
  itemID: itemID,
  parseXMLResponse: parseXMLResponse,
  tag: tag,
  userID: userID,
  xmlHeader: xmlHeader
}

function bibID(bibNumber) {
  return [
    '<BibliographicId>',
      '<BibliographicRecordId>', 
        tag('BibliographicRecordIdentifier', bibNumber),
        tag('BibliographicRecordIdentifierCode', 'OCLC'),
      '</BibliographicRecordId>', 
    '</BibliographicId>'
  ].join('');
}

function initiationHeader(fromAgencyID, toAgencyID, profileType) {
  if ( !toAgencyID ) toAgencyID = fromAgencyID;
  if ( !profileType ) profileType = 'Version 2011';

  return [
  '<InitiationHeader>',
    '<FromAgencyId>',
      '<AgencyId>' + fromAgencyID + '</AgencyId>',
    '</FromAgencyId>',
    '<ToAgencyId>',
      '<AgencyId>' + toAgencyID + '</AgencyId>',
    '</ToAgencyId>',
    '<ApplicationProfileType>' + profileType + '</ApplicationProfileType>',
  '</InitiationHeader>'
  ].join('');
}

function itemID(itemBarcode, agencyID) {
    if ( !itemBarcode || !agencyID) throw Error('itemID requires an itemBarcode and an agencyID');

    return [
    '<ItemId>',
      '<AgencyId>' + agencyID + '</AgencyId>',
      '<ItemIdentifierValue>' + itemBarcode + '</ItemIdentifierValue>',
    '</ItemId>'
    ].join('');
}

function parseXMLResponse(resp, ignore) {
  var xml = require('node-xml');
  var out = {}, depth = [];

  ignore = ignore || [];

  var Parser = new xml.SaxParser(function(p) {
    p.onStartElementNS(function(el, attr, prefix, uri, ns) {
      if ( el === 'NCIPMessage' || ignore.indexOf(el) > -1) return;
      
      // convert ProperCaseKeys to camelCaseKeys
      // + convert 'Id' to 'ID'
      depth.push(el.substr(0,1).toLowerCase() + el.substr(1).replace(/Id$/, 'ID'));

      var l = depth.length
        , i = 0
        , next, last, key
        ;

      while(i < l) {
        key = depth[i];

        if ( !last ) last = out;
        if ( !last[key] ) last[key] = {};

        next = last[key];
        last = next;

        i++;
      }
    });

    p.onCharacters(function(chars) {
      var l = depth.length
        , i = -1
        , field, next, prev
        ;


      while(++i < l) {
        key = depth[i];

        if ( !prev ) prev = out;
      
        // can't think of an easier way to do this:
        // if we've hit an empty object, we're at our spot
        if ( !Object.keys(prev[key]).length ) {
          return prev[key] = chars;
        } else {
          next = prev[key]
          prev = next;
        }
      }
    });

    p.onEndElementNS(function(el) {
      if ( el === 'NCIPMessage' || el === 'RequestItemResponse' ) return;
      depth.pop();
    })
  });

  Parser.parseString(resp);
  return out;
}

function tag(name, content) {
  return ('<' + name + (!content ? '/>' : '>' + content + '</' + name + '>'))
}

function userID(userBarcode, agencyID) {
    if ( !userBarcode || !agencyID ) throw Error('userID requires an userBarcode and an agencyID');

    return [
    '<UserId>',
      '<AgencyId>' + agencyID + '</AgencyId>',
      '<UserIdentifierValue>' + userBarcode + '</UserIdentifierValue>',
    '</UserId>'
    ].join('');
}

function xmlHeader(version, encoding, standalone) {
    version = version || '1.0';
    encoding = encoding || 'UTF-8';
    standalone = standalone || 'yes';
    
    return '<?xml version="'+version+'" encoding="'+encoding+'" standalone="'+standalone+'"?>';
}
