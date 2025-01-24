import { Field, Crypto, Bytes, createForeignCurve, createEcdsa, ForeignField, PrivateKey, AlmostForeignField, ForeignCurve, PublicKey, Hash, EcdsaSignature} from 'o1js';

// We are still in the context of a 2-player turn-based execution

// o1js crypto primitives for ECDSA signatures on the Secp256k1 curve
class Secp256k1 extends createForeignCurve(Crypto.CurveParams.Secp256k1) {}
class Scalar extends Secp256k1.Scalar {}
class Ecdsa extends createEcdsa(Secp256k1) {}
class Bytes32 extends Bytes(32) {}
class Bytes43 extends Bytes(43) {}

export class KeyExchangeManager {
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
    this.localPrivateKey = Secp256k1.Scalar.random();
    this.localPublicKey = Secp256k1.generator.scale(this.localPrivateKey);
  }

  signMessage(m:string): EcdsaSignature  {
    if (this.localPrivateKey) {
      let mBytes = Bytes43.fromString(m);
      let signature = Ecdsa.sign(mBytes.toBytes(), this.localPrivateKey.toBigInt());
      return signature;

    } else {
      throw new Error("Private Key not generated");
    }
  }


  //TODO : generalize to n participants:
  registerOtherParticipant(x: string, y: string): void {
    const xAFF = Secp256k1.Scalar.from(x);
    const yAFF = Secp256k1.Scalar.from(y);
    this.otherPublicKey = new ForeignCurve({x:xAFF,y:yAFF});
    console.log("Registered other participant's public key which is", this.otherPublicKey.toBigint);
  }

}
