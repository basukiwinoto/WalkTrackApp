import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { List, Title, Headline, Text, Appbar } from 'react-native-paper';
import * as geolib from 'geolib';
import MapView, { Polyline, Marker } from 'react-native-maps';

/*---------------- App Component ---------------------*/
const WalkTrackApp = () => {
  /*---------------- Data ---------------------*/
  const [walklist, setWalklist] = React.useState([]);
  const [csvdata, setCsvdata] = React.useState([]);
  const [refreshing, setRefreshing] = React.useState(false);
  const [walkinfo, setWalkinfo] = React.useState([]);
  const mapRef = React.useRef();

  /*---------------- Data Processing functions ---------------------*/
  const pullData = async () => {
    await setRefreshing(true);
    const url = "https://bit.ly/3vjOhiJ";
    try {
      await fetch(url)
        .then(response => response.text())
        .then(data => parseCsvdata(data));
    } catch(e) {
      console.error("failed to fetch and parse data",e);
    }
    await setRefreshing(false);
    return true;
  };

  const parseCsvdata = async (raw) => {
    const csvlist = raw.split('\n');
    // iterate through csvlist, skip first element/header
    let aWalk = [];
    let allWalks = [];
    for (let i=1; i < csvlist.length; i++) {
        const gpsRecord = csvlist[i].split(";");
        const timestamp = gpsRecord[0];
        const latitude = parseFloat(gpsRecord[1]);
        const longitude = parseFloat(gpsRecord[2]);
        const altitude = parseFloat(gpsRecord[3]);
        const horizontalAccuracy = parseFloat(gpsRecord[4]);
        const verticalaccuracy = parseFloat(gpsRecord[5]);
        const speed = parseFloat(gpsRecord[6]);
        const course = parseFloat(gpsRecord[7]);
        //push gpsRecord to aWalk
        const gpsJson = {timestamp,latitude,longitude,altitude,horizontalAccuracy,verticalaccuracy,speed,course};
        //if course is -1,
        if (gpsJson.course < 0) {
          // calculate distance/duration/speed,
          const dds = calculateWalk(aWalk);
          // construct walkData and push to allWalks if > 1 points,
          const walkData = {...dds, gps: aWalk};
          if (aWalk.length>1) {
            allWalks.push(walkData);
          }
          // clear aWalk
          aWalk = [];
        } else { // gps data is a valid walk
          aWalk.push(gpsJson);
        }
        // if (allWalks.length >20) {
        //   break;
        // }
    }
    // update useState
    await setWalklist(allWalks);
    return true;
  };

  const calculateWalk = (aWalk) => {
    if (aWalk.length===0) { // sanitize empty array
      return {}
    }
    const start = aWalk[0].timestamp.substring(0,19).replace(" ","T");
    const end = aWalk[aWalk.length -1].timestamp.substring(0,19).replace(" ","T");
    const distance = geolib.getPathLength(aWalk);
    const duration = (Date.parse(end) - Date.parse(start)) / 1000;
    const speed = duration>0?distance / duration : 0;
    return {distance, duration, speed};
  };

  /*---------------- FlatList functions ---------------------*/
  const renderItem = ({item, index}) => {
    return (
      <View>
        <List.Item
          style={styles.listitem}
          title={`Walk #${index + 1}`}
          description={`Dist:${item.distance}mt Dur:${Math.floor(item.duration / 60)}min Avg Spd:${Math.floor(item.speed)}mt/sec`}
          left={props => <List.Icon {...props} icon="walk" style={styles.icon} />}
          onPress={()=>{
            const newWalkinfo = item.gps.map(e => {return {latitude:e.latitude, longitude:e.longitude}})
            setWalkinfo(newWalkinfo);
            mapRef.current.fitToCoordinates(newWalkinfo);
          }}
        />
      </View>
    );
  };

  /*---------------- useEffect ---------------------*/
  React.useEffect(() => {
    pullData();
  }, []);

  /*---------------- Main App View ---------------------*/
  return (
    <View style={styles.mainView}>
      <View style={styles.infoView}>
      <Appbar.Header>
        <Appbar.Content title="Walk Track" />
      </Appbar.Header>
        <MapView
          ref={mapRef}
          style={styles.mapView}
          initialRegion={{
            latitude: 37.78825,
            longitude: -122.4324,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
        	<Polyline
        		coordinates={walkinfo}
        		strokeColor="#8E94F2" // fallback for when `strokeColors` is not supported by the map-provider
        		strokeWidth={6}
            lineDashPattern={[3,1,3,1]}
        	/>
          <Marker title="start" coordinate={walkinfo[0]} />
        </MapView>
      </View>
      <View style={styles.walklistView}>
        <Title style={styles.title}>Walk List ({walklist.length})</Title>
        <FlatList
          data={walklist}
          renderItem={renderItem}
          keyExtractor={(item,index) => index}
          refreshing={refreshing}
          onRefresh={pullData}
        />
      </View>
    </View>
  );
};

/*---------------- Stylesheet ---------------------*/
const styles = StyleSheet.create({
  mainView: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  infoView: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  mapView: {
    flex:1,
  },
  walklistView: {
    flex: 1,
    borderRadius: 12,
    paddingLeft: 10,
    paddingRight: 10
  },
  listitem: {
    borderWidth: 2,
    borderStyle: "solid",
    borderColor: "gray",
    borderRadius: 36,
    margin: 6
  },
  title: {
    paddingLeft: 20,
    paddingTop: 10,
    color: "#6200ee"
  },
  icon: {
    borderRadius: 36,
    backgroundColor: "gray",
  }
});

export default WalkTrackApp;
