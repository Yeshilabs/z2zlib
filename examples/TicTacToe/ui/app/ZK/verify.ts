import { MyProgram, MyProof } from "./zkprogram";

export { verifyProof };

const verifyProof = async (proofJSON) => {
    console.log("Verifying proof...");
    const proof = await MyProof.fromJSON(proofJSON);
    proof.verify();
    console.log("successfully verified proof.");
}