'use strict';

const debug = require('debug')('reps-archive:fetch');
const async = require('async');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const DATA_PATH = '../data';

module.exports = {
  fetchAllData,
};

function fetchAllData(dataEndpoints) {
  debug('Starting to fetch all data..');
  return Promise.all(dataEndpoints.map((config) => fetchAndSave(config)));
}

async function fetchAndSave(config, fetchedEntries = []) {
  const { url, name } = config;
  debug(`Fetching ${url}`);

  const { data } = await axios.get(url);

  if (data && data.results) {
    fetchedEntries = await appendDetailData(fetchedEntries, data.results);
  }

  if (data.next) {
    return fetchAndSave({
      url: data.next,
      name,
    }, fetchedEntries);
  }

  const outputFile = path.join(__dirname, DATA_PATH, `${name}.json`);
  debug(`Writing data to ${outputFile}`);
  return fs.writeFile(outputFile, JSON.stringify(fetchedEntries), { flag: 'w' }); // eslint-disable-line security/detect-non-literal-fs-filename
}

async function appendDetailData(existingEntries, newEntries) {
  const detailData = await async.mapSeries(newEntries, async (entry) => {
    debug(`Fetching ${entry._url}`);
    const response = await axios.get(entry._url);
    return response.data;
  });

  return existingEntries.concat(detailData);
}
