import React from "react";
import { StyleSheet, Text, View, Button, TextInput } from "react-native";
import { useState } from "react";
import { Network, Passport } from "@0xpass/passport";
import axios from "axios";
import { ReactNativeSigner } from "@0xpass/react-native-signer";

global.Buffer = require("buffer").Buffer;

export default function App() {
  const [state, setState] = useState({
    running: false,
    time: null,
  });

  const [username, setUsername] = useState("");

  // c91074d6-7f09-43a0-a1c8-c94a55ec8f29
  // Create Passport instance with axios interceptor
  const passport = new Passport({
    scopeId: "074f376c-4002-4ada-a827-b49ba743c4f8",
    signer: new ReactNativeSigner({
      rpId: "passkey-http.alkassimk.workers.dev",
      rpName: "Passkey Example",
    }),
    network: Network.LOCAL,
  });

  // Function to set up encryption and handle registration
  async function register() {
    // Adding axios interceptor to modify localhost to ngrok URL and log requests
    axios.interceptors.request.use((config) => {
      if (config.url && config.url.includes("localhost:9545")) {
        const originalUrl = config.url;
        config.url = config.url.replace(
          "http://localhost:9545",
          "https://29f1-2c0f-2a80-67-9a10-98b9-92a3-8991-523e.ngrok-free.app"
        );
        console.log(
          `Modified request URL from ${originalUrl} to ${config.url}`
        );
      }

      return config;
    });

    try {
      await passport.setupEncryption();
      console.log("Encryption setup complete");

      try {
        const res = await passport.register({
          username: username,
          userDisplayName: username,
        });
        console.log("Registration response:", res);
      } catch (registerError) {
        console.error("Error during registration:", registerError);
      }
    } catch (setupError) {
      console.error("Error during setupEncryption:", setupError);
    }
  }

  async function authenticate() {
    // Adding axios interceptor to modify localhost to ngrok URL and log requests
    axios.interceptors.request.use((config) => {
      if (config.url && config.url.includes("localhost:9545")) {
        const originalUrl = config.url;
        config.url = config.url.replace(
          "http://localhost:9545",
          "https://29f1-2c0f-2a80-67-9a10-98b9-92a3-8991-523e.ngrok-free.app"
        );
        console.log(
          `Modified request URL from ${originalUrl} to ${config.url}`
        );
      }

      return config;
    });

    try {
      await passport.setupEncryption();
      console.log("Encryption setup complete");

      try {
        const res = await passport.authenticate({
          username: username,
          userDisplayName: username,
        });
        console.log("authentication response:", res);
      } catch (authError) {
        console.error("Error during authentication:", authError);
      }
    } catch (setupError) {
      console.error("Error during setupEncryption:", setupError);
    }
  }

  // Function to run encryption process
  const run = () => {
    const start = new Date().getTime();
    console.log(aesEncrypt("hello", generateAesKey()));

    setTimeout(() => {
      setState({
        running: false,
        time: (new Date().getTime() - start) / 1000,
      });
    }, 100);
  };

  return (
    <View style={styles.container}>
      <TextInput value={username} onChangeText={setUsername} />
      <Button
        title="register"
        onPress={async () => {
          await register();
        }}
      />
      <Button
        title="authenticate"
        onPress={async () => {
          await authenticate();
        }}
      />
      {state.running && <Text>Running...</Text>}
      {state.time && <Text>Took {state.time}s</Text>}
    </View>
  );
}

// Styles for the app
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
