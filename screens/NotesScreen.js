import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  TouchableHighlightBase,
  TouchableWithoutFeedback,
} from "react-native";
import { Entypo, AntDesign } from "@expo/vector-icons";
import { roundToNearestPixel } from "react-native/Libraries/Utilities/PixelRatio";
import * as SQLite from "expo-sqlite";
import { back } from "react-native/Libraries/Animated/src/Easing";
import firebase from "../database/firebaseDB";

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
        "SELECT * FROM notes ORDER BY done ASC; ",
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

  //Monitor route.params for changes and add items to the database

  useEffect(() => {
    if (route.params?.text) {
      //if route.params.text return something, then perfrom the following operations.
      const newNote = {
        title: route.params.text,
        done: false,
        created: firebase.firestore.FieldValue.serverTimestamp(),
        //alternative
        //created: Date.now().toString(),
        // id: notes.length.toString(), //not using id line for firestore db since we using the automatically generated ID.
      };

      //database
      firebase.firestore().collection("todos").add(newNote);
      setNotes([...notes, newNote]); //the 2nd parameter here is if there is a change in this array, then the useEffect() hook will run again.

      // db.transaction(
      //   (tx) => {
      //     tx.executeSql("Insert into notes (done, title) values (0, ?)", [
      //       route.params.text,
      //     ]);
      //   },
      //   null,
      //   refreshNotes
      // );
    }
  }, [route.params?.text]);

  //load up firebase database on start.
  //the snapshot keeps everything synced -- no need to refresh it later!
  useEffect(() => {
    const unsubscribe = firebase
      .firestore()
      .collection("todos")
      .orderBy("created", "desc")
      .onSnapshot((collection) => {
        //Let's get back a snapshot of this collection
        const updatedNotes = collection.docs.map((doc) => {
          //create our own object that pulls the ID into a property
          const noteObject = {
            ...doc.data(),
            id: doc.id,
          };
          console.log(noteObject);
          return noteObject;
        });
        setNotes(updatedNotes); //And set our notes state array to its docs
      });

    //Unsubscribe when unmounting
    return () => {
      unsubscribe();
    };
  }, []);

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
    console.log("Deleting", +id);
    firebase.firestore().collection("todos").doc(id).delete(); // this is much simpler now we have the firestore ID
  }

  function checkedNote(id, done) {
    db.transaction(
      (tx) => {
        if (done == 0) {
          tx.executeSql(`UPDATE notes set done = 1 where id=${id}`);
        } else if (done == 1) {
          tx.executeSql(`UPDATE notes set done = 0 where id=${id}`);
        }
      },
      null,
      refreshNotes
    );
  }

  function renderItem({ item }) {
    return (
      <View
        style={item.done ? styles.check : styles.uncheck}
        onTouchStart={() => {
          checkedNote(item.id, item.done);
        }}
      >
        {/* <TouchableWithoutFeedback
          onPress={() => {
            checkedNote(item.id, item.done);
          }}
        > */}
        <Text style={{ textAlign: "left", fontSize: 16 }}>{item.title}</Text>
        {/* </TouchableWithoutFeedback> */}

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
  check: {
    backgroundColor: "lightgrey",
    padding: 10,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomColor: "#ccc",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  uncheck: {
    backgroundColor: "#ffc",
    padding: 10,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomColor: "#ccc",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
