import AlgoliaSearch from 'algoliasearch';
import { fromIsoDateToElapsed } from '../util.js';
const algoliaConf = {
  // appId: 'OPDWYH4IR4',
  // searchKey: '0b28a5913167a1618773992171c04344',
  indexName: 'cuely_dev_documents'
}

let index;
let algoliaClient;
let settings = {
  hitsPerPage: 10,
  getRankingInfo: true
};

export function setAlgoliaCredentials(credentials) {
  algoliaClient = AlgoliaSearch(credentials.appId, credentials.searchKey);
  settings.filters = `user_id=${credentials.userid}`;
  index = algoliaClient.initIndex(algoliaConf.indexName);
  console.log("Updated Algolia credentials");
}


export function search(query) {
  return index.search(query, settings).then(content => {
    return content.hits.map(hit => {
      let users = [
        { name: highlightedValue('owner_displayName', hit), type: 'Owner' },
      ];
      if (hit.lastModifyingUser_displayName && hit.lastModifyingUser_displayName !== hit.owner_displayName) {
        users.push({ name: highlightedValue('lastModifyingUser_displayName', hit), type: 'Modifier' });
      }
      
      let content = null;
      if (hit.content && hit.content.length > 0) {
        content = highlightedValue('content', hit).replace(/\n\s*\n/g, '\n\n').replace(/<em>/g, '<em class="algolia_highlight">');
      }

      return {
        type: 'gdrive',
        title: highlightedValue('title', hit),
        content: content,
        metaInfo: {
          time: fromIsoDateToElapsed(hit.last_updated),
          users: users
        },
        displayIcon: hit.iconLink,
        webLink: hit.webViewLink,
        thumbnailLink: hit.thumbnailLink,
        modified: hit.last_updated,
        _algolia: hit._rankingInfo
      }
    });
  }).catch(err => {
    console.log(err);
  });
}

function highlightedValue(attribute, hit, emptyIfNotHighlighted) {
  if(attribute in hit._highlightResult && hit._highlightResult[attribute].matchedWords.length > 0) {
    return hit._highlightResult[attribute].value;
  }
  return emptyIfNotHighlighted ? "" : hit[attribute];
}
