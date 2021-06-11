import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { Entypo, AntDesign } from "@expo/vector-icons";
import { roundToNearestPixel } from "react-native/Libraries/Utilities/PixelRatio";
import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabase("notes.db"); //if not exist, it will create one for it

export default function NotesScreen({ route, navigation }) {
  const [notes, setNotes] = useState([
    //{ title: "Walk the cat", done: false, id: "0" },
    //{ title: "Feed the elephant", done: false, id: "1" },
    //Set the initial array to empty for the database.
  ]);

  function refreshNotes() {
    //a function to refresh the notes stored in teh array.
    db.transaction((tx) => {
      tx.executeSql(
        "SELECT * FROM notes",
        null,
        (txObj, { rows: { _array } }) => setNotes(_array), // a sucess function that contains the results of the query and set the reults into the setNotes useState.
        (txObj, error) => console.log("Error", error)
      );
    });
  }

  //Use a useEffect() to set up your database.
  useEffect(
    () => {
      db.transaction((tx) => {
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, done INT);`
        );
      });
    },
    null, //null is the error function parameter which in this case we dont want to return anything if there is an error.
    refreshNotes
  ); //syntax for transaction: db.transaction(callback, error, success)
  //refreshNotes is a callback function that will run if the transaction is sucessful.

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={addNote}>
          <Entypo
            name="new-message"
            size={24}
            color="black"
            style={{ marginRight: 20 }}
          />
        </TouchableOpacity>
      ),
    });
  });

  useEffect(() => {
    if (route.params?.text) {
      //if route.params.text return something, then perfrom the following operations.
      //   const newNote = {
      //     title: route.params.text,
      //     done: false,
      //     id: notes.length.toString(),
      //   };
      //   setNotes([...notes, newNote]); //the 2nd parameter here is if there is a change in this array, then the useEffect() hook will run again.
      db.transaction(
        (tx) => {
          tx.executeSql("Insert into notes (done, title) values (0, ?)", [
            route.params.text,
          ]);
        },
        null,
        refreshNotes
      );
    }
  }, [route.params?.text]);

  function addNote() {
    navigation.navigate("Add Note");
  }

  function deleteNote(id) {
    console.log("Deleting" + id);
    db.transaction(
      (tx) => {
        tx.executeSql(`DELETE FROM notes where id=${id}`);
      },
      null,
      refreshNotes
    );
  }

  function renderItem({ item }) {
    return (
      <View
        style={{
          padding: 10,
          paddingTop: 20,
          paddingBottom: 20,
          borderBottomColor: "#ccc",
          borderBottomWidth: 1,
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ textAlign: "left", fontSize: 16 }}>{item.title}</Text>
        <TouchableOpacity onPress={() => deleteNote(item.id)}>
          <AntDesign name="delete" size={24} color="#944" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        style={{ width: "100%" }}
        data={notes}
        renderItem={renderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffc",
    alignItems: "center",
    justifyContent: "center",
  },
});
