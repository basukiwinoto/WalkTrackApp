import * as geolib from 'geolib';
import loadLocalResource from 'react-native-local-resource';
import gpsDataset from './gps_dataset.csv'

/**
 * Returns gps dataset in csv format.
 * Returns null on error.
 *
 * @param {string} url The data source url.
 * @return {string} csvdata The gps dataset in csv format.
 */
export const fetchData = async (url) => {
  try {
    const csvdata = await fetch(url)
      .then(response => response.text())
      .then(data => data);
    return csvdata;
  } catch(e) {
    console.error("failed to fetch", e);
    return null;
  }
}

/**
 * Returns gps dataset in csv format from local file.
 * Returns null on error.
 *
 * @return {string} csvdata The gps dataset in csv format.
 */
export const fetchDataFromLocal = async () => {
  const csvdata = await loadLocalResource(gpsDataset).catch((e)=> {console.log(e)});
  return csvdata;
}

/**
 * Returns JSON representation of a single row gps data.
 *
 * @param {string} csvrow A single row of gps data.
 * @return {JSON} gpsJson The gps data in JSON format.
 */
export const csvrowToJson = (csvrow) => {
  const gpsRecord = csvrow.split(";");
  const timestamp = gpsRecord[0];
  const latitude = parseFloat(gpsRecord[1]);
  const longitude = parseFloat(gpsRecord[2]);
  const altitude = parseFloat(gpsRecord[3]);
  const horizontalAccuracy = parseFloat(gpsRecord[4]);
  const verticalaccuracy = parseFloat(gpsRecord[5]);
  const speed = parseFloat(gpsRecord[6]);
  const course = parseFloat(gpsRecord[7]);
  return {timestamp,latitude,longitude,altitude,horizontalAccuracy,verticalaccuracy,speed,course};
}

/**
 * Returns an array of parsed walks from a gps dataset.
 * The gps dataset is in csv format.
 *
 * @param {string} csvdata The gps dataset in csv format.
 * @return {Array} allWalks The array of parsed walks.
 */
export const parseCsvdata = async (csvdata, minThreshold = 10) => {
  const csvlist = csvdata.split('\n');
  // iterate through csvlist, skip first element/header
  let aWalk = [];
  let allWalks = [];
  let prev = null;
  for (let i=1; i < csvlist.length; i++) {
      const gpsJson = csvrowToJson(csvlist[i]);
      // first record (no prev), start a walk
      if (!prev) {
        aWalk.push(gpsJson);
        prev = gpsJson;
        continue;
      }
      // prev not empty, check the minutes difference
      const minDifference = (parseTimestamp(gpsJson.timestamp) - parseTimestamp(prev.timestamp)) / 1000 / 60;
      if (minDifference < minThreshold) { // same walk if less by 10 minutes
        // add to current walk
        aWalk.push(gpsJson);
        prev = gpsJson;
      } else {
        // end a walk, construct walkData and push to allWalks
        const walkData = calculateWalk(aWalk);
        allWalks.push(walkData);
        // start a new walk
        aWalk = [];
        aWalk.push(gpsJson);
        prev = gpsJson;
      }
  }
  // end the last walk, construct walkData and push to allWalks
  const walkData = calculateWalk(aWalk);
  allWalks.push(walkData);
  return allWalks;
};

/**
 * Returns a JSON object of a walk calculation.
 * A walk calculation has propertios:
 * distance - total distance of a walk in meters.
 * duration - total duration of a walk in seconds.
 * speed - average speed.
 * gps - array of gps data pf a walk.
 *
 * @param {Array} aWalk The array of walk data.
 * @return {JSON} walkJson The walk data with calculation.
 */
export const calculateWalk = (aWalk) => {
  const start = parseTimestamp(aWalk[0].timestamp);
  const end = parseTimestamp(aWalk[aWalk.length -1].timestamp);
  const distance = geolib.getPathLength(aWalk);
  const duration = (end - start) / 1000;
  const speed = duration>0?distance / duration : 0;
  const gps = aWalk;
  return {distance, duration, speed, gps};
};

/**
 * Returns a unixtimestamp from a gps string timestamp.
 *
 * @param {string} timestamp The gps string timestamp.
 * @return {number} millis The UNIX timestamp om milliseconds.
 */
export const parseTimestamp = (timestamp) => {
  return Date.parse(timestamp.substring(0,19).replace(" ","T"));
};

/**
 * Returns a float rounded to two decimal places.
 *
 * @param {number} value The value to be rounded.
 * @return {number} result The value with two decimal places.
 */
export const twoDecimals = (value) => {
  return Math.round(value * 100) / 100;
};
