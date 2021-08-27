import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { List, Title, Headline, Text, Appbar } from 'react-native-paper';
// import * as geolib from 'geolib';
import MapView, { Polyline, Marker } from 'react-native-maps';
import { fetchData, csvrowToJson, parseCsvdata, twoDecimals } from './libWalkTrack';

/*---------------- App Component ---------------------*/
const WalkTrackApp = () => {
  /*---------------- States & Refs ---------------------*/
  const [walklist, setWalklist] = React.useState([]);
  const [csvdata, setCsvdata] = React.useState([]);
  const [refreshing, setRefreshing] = React.useState(false);
  const [walkinfo, setWalkinfo] = React.useState([]);
  const [minThreshold, setMinThreshold] = React.useState(10);
  const mapRef = React.useRef();

  /*---------------- Constants ---------------------*/
  const urlSource = "https://bit.ly/3vjOhiJ";

  /*---------------- Data refresh function ---------------------*/
  const pullData = async (url) => {
    await setRefreshing(true);
    const csvdata = await fetchData(url);
    if (!csvdata) {
      await setRefreshing(false);
      return false;
    }
    const parsedWalks = await parseCsvdata(csvdata, minThreshold);
    await setWalklist(parsedWalks);
    await setRefreshing(false);
    return true;
  };

  /*---------------- FlatList functions ---------------------*/
  const renderItem = ({item, index}) => {
    return (
      <View>
        <List.Item
          style={styles.listitem}
          title={`Walk #${index + 1}`}
          description={`Dist:${item.distance}mt Dur:${twoDecimals(item.duration / 60)}min Avg Spd:${twoDecimals(item.speed)}mt/sec`}
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
    pullData(urlSource);
  }, []);

  /*---------------- Main App Layout ---------------------*/
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
        		strokeColor="#8E94F2"
        		strokeWidth={6}
            lineDashPattern={[3,1,3,1]}
        	/>
        </MapView>
      </View>
      <View style={styles.walklistView}>
        <Title style={styles.title}>
          Walk List ({walklist.length})
        </Title>
        <FlatList
          data={walklist}
          renderItem={renderItem}
          keyExtractor={(item,index) => index}
          refreshing={refreshing}
          onRefresh={()=>{
            pullData(urlSource)
          }}
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
