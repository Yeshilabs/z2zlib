import { JsonProof } from "o1js";
import { MyProgram, MyProof } from "./zkprogram";

export { verifyProof };

const verifyProof = async (proofJSON:JsonProof) => {
    console.log("Verifying proof...");
    const proof = await MyProof.fromJSON(proofJSON);
    proof.verify();
    console.log("successfully verified proof.");
}