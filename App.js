import React from "react";
import { StyleSheet, Text, View, Button } from "react-native";
import { useState } from "react";
import forge from "node-forge";
import { Network, Passport } from "@0xpass/passport";
import { ReactNativeSigner } from "./signer";

export const generateAesKey = () => {
  // Generate a random 256-bit key
  const key = forge.random.getBytesSync(32); // 32 bytes * 8 bits/byte = 256 bits
  return key;
};

export const aesEncrypt = async (plainText, encryptionKey) => {
  if (!encryptionKey) {
    throw Error("Encryption key not initialized");
  }

  const key = forge.util.createBuffer(encryptionKey).bytes();
  const iv = forge.random.getBytesSync(12);
  const cipher = forge.cipher.createCipher("AES-GCM", key);

  cipher.start({ iv: iv });
  cipher.update(forge.util.createBuffer(plainText, "utf8"));
  cipher.finish();

  const encrypted = cipher.output.getBytes();
  const tag = cipher.mode.tag.getBytes();

  const combined = forge.util.createBuffer(iv + encrypted + tag).getBytes();
  return btoa(combined);
};

export default function App() {
  const [state, setState] = useState({
    running: false,
    time: null,
  });

  const passport = new Passport({
    scopeId: "40c44258-6d9b-404c-b4ae-da83fe1d1696",
    signer: new ReactNativeSigner({
      rpId: "passkey-http.alkassimk.workers.dev", // Update to match the domain where `apple-app-site-association` is hosted
      rpName: "Passkey Example", // Update to your RP name
    }),
    network: Network.LOCAL,
  });

  async function setupEncryption() {
    try {
      await passport.setupEncryption();
      console.log("Encryption setup complete");

      console.log("here");
      try {
        const res = await passport.register({
          username: "helloooo",
          userDisplayName: "helloooo",
        });

        console.log("Registration response:", res);
        console.log("here 2");
      } catch (registerError) {
        console.error("Error during registration:", registerError);
      }
    } catch (setupError) {
      console.error("Error during setupEncryption:", setupError);
    }
  }

  run = () => {
    const start = new Date().getTime();
    console.log(aesEncrypt("hello", generateAesKey()));

    // Give time to update UI
    setTimeout(() => {
      setState({
        running: false,
        time: (new Date().getTime() - start) / 1000,
      });
    }, 100);
  };

  return (
    <View style={styles.container}>
      <Button
        title="Generate"
        onPress={async () => {
          await setupEncryption();
        }}
      />
      {state.running && <Text>Running...</Text>}
      {state.time && <Text>Took {state.time}s</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
