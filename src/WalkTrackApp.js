import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { List, Title, Headline, Text, Appbar } from 'react-native-paper';
import MapView, { Polyline, Marker } from 'react-native-maps';
import { fetchData, fetchDataFromLocal, csvrowToJson, parseCsvdata, twoDecimals } from './libWalkTrack';

/*---------------- App Component ---------------------*/
const WalkTrackApp = () => {
  /*---------------- States & Refs ---------------------*/
  const [walklist, setWalklist] = React.useState([]);
  const [csvdata, setCsvdata] = React.useState([]);
  const [refreshing, setRefreshing] = React.useState(false);
  const [walkinfo, setWalkinfo] = React.useState([]);
  const [minThreshold, setMinThreshold] = React.useState(10);
  const [selectedWalkIndex, setSelectedWalkIndex] = React.useState(-1);
  const mapRef = React.useRef();

  /*---------------- Data Source URL  ---------------------*/
  const urlSource = "https://bit.ly/3vjOhiJ";
  const isOnline = false;

  /*---------------- Data refresh function ---------------------*/
  const pullData = async (url) => {
    await setRefreshing(true);
    const csvdata = (isOnline)? await fetchData(url): await fetchDataFromLocal();
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
    const borderColor = (index === selectedWalkIndex)? "orange": "gray";
    return (
      <View>
        <List.Item
          style={[styles.listitem, {borderColor}]}
          title={`Walk #${index + 1} Distance: ${item.distance}m`}
          description={
            `Dur.: ${twoDecimals(item.duration / 60)}mins `+
            `Avg Spd: ${twoDecimals(item.speed)}m/sec`}
          left={props => <List.Icon {...props} icon="walk" style={styles.icon} />}
          onPress={()=>{
            const newWalkinfo = item.gps.map(e => {return {latitude:e.latitude, longitude:e.longitude, timestamp:e.timestamp}})
            setWalkinfo(newWalkinfo);
            mapRef.current.fitToCoordinates(newWalkinfo);
            setSelectedWalkIndex(index);
            // print current walk info on console
            // console.log(`Walk #${index + 1} Distance: ${item.distance}m `+
            //   `Duration: ${twoDecimals(item.duration / 60)}mins `+
            //   `Avg Spd: ${twoDecimals(item.speed)}m/sec`);

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
          {walkinfo.length>0 &&
            <>
              <Marker
                title={`Start: ${walkinfo[0].timestamp}` }
                pinColor="green"
                coordinate={walkinfo[0]}
              />
              <Marker
                title={`Stop: ${walkinfo[walkinfo.length -1].timestamp}` }
                pinColor="blue"
                coordinate={walkinfo[walkinfo.length -1]}
              />
            </>
          }
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
