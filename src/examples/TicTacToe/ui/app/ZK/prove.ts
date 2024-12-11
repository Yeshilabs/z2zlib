import { MyProgram } from "./zkprogram";

export { generateBaseCaseProof };

const generateBaseCaseProof = async () => {
    console.log("compiling program");
    await MyProgram.compile();
    console.log("program compiled");
    const proof = await MyProgram.baseCase();
    console.log("generated proof");
    const proofJSON = proof.toJSON();
    return proofJSON;
}