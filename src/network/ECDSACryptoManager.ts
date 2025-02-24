import { Field, Crypto, Bytes, createForeignCurve, createEcdsa, ForeignField, PrivateKey, AlmostForeignField, ForeignCurve, PublicKey, Hash, EcdsaSignature, Bool, Poseidon } from 'o1js';

// We are still in the context of a 2-player turn-based execution

// o1js crypto primitives for ECDSA signatures on the Secp256k1 curve
class Secp256k1 extends createForeignCurve(Crypto.CurveParams.Secp256k1) { }
class Scalar extends Secp256k1.Scalar { }
class Ecdsa extends createEcdsa(Secp256k1) { }
class Bytes32 extends Bytes(32) { }
class Bytes43 extends Bytes(43) { }
class Bytes64 extends Bytes(64) { }
class Bytes512 extends Bytes(512) { }


export class ECDSACryptoManager {
  private localPublicKey: ForeignCurve | null = null;
  private localPrivateKey: AlmostForeignField | null = null;
  private otherPublicKey: ForeignCurve | null = null;

  //private peersPublicKeys: Map<string, Field> = new Map();
  //private participants: Set<string> = new Set();

  constructor() {
    // generate the local keypair
    this.genKeyPair();
  }


  private genKeyPair(): void {
    if (this.localPublicKey || this.localPrivateKey) {
      throw new Error("local Public or Private keys already generated");
    }
    this.localPrivateKey = Scalar.random();
    this.localPublicKey = Secp256k1.generator.scale(this.localPrivateKey);
  }

  signMessage(m: string): {r: string, s: string} {
    if (this.localPrivateKey) {
      let mBytes = Bytes512.fromString(m);
      let signature = Ecdsa.sign(mBytes.toBytes(), this.localPrivateKey.toBigInt());
      let {r,s} = signature.toBigInt();
      return {
        r: r.toString(),
        s: s.toString()
      };
    } else {
      throw new Error("Private Key not generated");
    }
  }

  verifySignature(sig: {r: string, s: string}, m: string): Boolean {
    if (!this.otherPublicKey) {
      throw new Error("Trying to verify signature while other's public key not registered");
    }
    const ECDSAsig = Ecdsa.from({r:BigInt(sig.r), s:BigInt(sig.s)});
    let mBytes = Bytes512.fromString(m);
    //let mBytesBytes = Uint8Array.from(m.split('').map(letter => letter.charCodeAt(0)));
    const isValid = ECDSAsig.verify(mBytes, this.otherPublicKey);
    return isValid.toBoolean();

  }

  setPeerPublicKey(x: string, y: string): void {
    try {
        // Convert string to BigInt first
        const xBigInt = BigInt(x);
        const yBigInt = BigInt(y);
        
        // Create the curve point directly
        this.otherPublicKey = Secp256k1.from({
            x: Secp256k1.Field.from(xBigInt),
            y: Secp256k1.Field.from(yBigInt)
        });
        
        console.log("Registered peer's public key");
    } catch (error) {
        console.error("Error setting peer public key:", error);
        throw error;
    }
  }

  getMyPublicKey() {
    if (this.localPublicKey) {
        return {
            x: this.localPublicKey.x.toBigInt().toString(),
            y: this.localPublicKey.y.toBigInt().toString()
        };
    }
    throw new Error("Local public key not initialized");
  }


}
