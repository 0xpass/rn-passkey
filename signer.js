import { Passkey } from "react-native-passkey";
import { parseCreationOptionsFromJSON } from "./webauthn";
import { Buffer } from "buffer";

// Header name for a webauthn signer
const signHeaderName = "X-Encrypted-WebAuthn-Signature";

const DEFAULT_TIMEOUT = 5 * 60 * 1000; // five minutes
const defaultUserVerification = "preferred";

export class ReactNativeSigner {
  rpId;
  rpName;
  timeout;
  userVerification;
  allowCredentials;

  constructor(config) {
    this.rpId = config.rpId;
    this.rpName = config.rpName;
    this.timeout = config.timeout || DEFAULT_TIMEOUT;
    this.userVerification = config.userVerification || defaultUserVerification;
    this.allowCredentials = config.allowCredentials || [];
  }

  getHeaderName() {
    return signHeaderName;
  }

  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async sign(options) {
    // if (!Passkey.isSupported()) {
    //   throw new Error("Passkeys are not supported on this device.");
    // }
    // try {
    //   const requestOptions = parseRequestOptionsFromJSON(options);
    //   // return await webauthnCredentialGet(requestOptions);
    // } catch (error) {
    //   console.error("Error parsing options or singing with WebAuthn credential:", error);
    //   throw error;
    // }
  }

  async create(options) {
    if (!Passkey.isSupported()) {
      throw new Error("Passkeys are not supported on this device.");
    }

    console.log("options", options);

    try {
      const creationOptions = parseCreationOptionsFromJSON(options);

      for (const [key, value] of Object.entries(creationOptions.publicKey)) {
        console.log(`${key}:`, value);
      }

      const passkeyOptions = {
        challenge: Buffer.from(
          creationOptions.publicKey.challenge.toString()
        ).toString("base64"),
        rp: {
          id: "passkey-http.alkassimk.workers.dev", // Update to match the domain where `apple-app-site-association` is hosted
          name: "Passkey Example",
        },
        user: {
          id: Buffer.from(
            creationOptions.publicKey.user.id.toString()
          ).toString("base64"),
          name: creationOptions.publicKey.user.name,
          displayName: creationOptions.publicKey.user.displayName,
        },
        pubKeyCredParams: creationOptions.publicKey.pubKeyCredParams,
        excludeCredentials: creationOptions.publicKey.excludeCredentials,
        authenticatorSelection: {
          requireResidentKey: true,
          residentKey: "required",
          userVerification: "preferred",
        },
        attestation: creationOptions.publicKey.attestation,
        extensions: creationOptions.publicKey.extensions,
      };

      console.log("Passkey options:", passkeyOptions);
      console.log("before passkey trigger");
      const result = await Passkey.register(passkeyOptions);
      console.log("after passkey trigger");
      console.log("result", result);

      return result;
    } catch (error) {
      console.error("Error during passkey registration:", error);
      throw error;
    }
  }

  async getAllowCredentials() {
    return {
      key: [],
      webauthn: [],
    };
  }
}
